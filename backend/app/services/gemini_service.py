import asyncio
import os
import json
import time
import tempfile
from pathlib import Path
from google import genai
from app.models.transaction_model import TransactionCreate
from fastapi import UploadFile, HTTPException
from dotenv import load_dotenv

from app.services.user_service import UserService
from app.services.transaction_service import TransactionService
# Lazy import QueueManager to avoid circular dependency

env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

INCOME_PROMPT_TEMPLATE = """
Bạn là một trợ lý kế toán AI. Nhiệm vụ của bạn là trích xuất thông tin tài chính từ văn bản hoặc hình ảnh chuyển khoản ngân hàng.
Hãy trả về kết quả CHỈ LÀ MỘT JSON duy nhất (không giải thích thêm) theo định dạng sau:

Danh sách thành viên hợp lệ trong nhóm: {member_list}.

Quy tắc quan trọng về user_from:
1. Nếu tên trích xuất được có độ tương đồng cao với một tên trong danh sách trên (bỏ qua dấu, viết hoa/thường), hãy trả về TÊN CHÍNH XÁC trong danh sách.
2. Nếu không tìm thấy ai phù hợp, hãy giữ nguyên tên trích xuất được.

{{
    "transaction_date": "YYYY-MM-DD",
    "user_from": "Tên người gửi (nếu có)",
    "id_from": "ID người gửi được lấy từ trong danh sách thành viên hợp lệ tương ứng với user_from",
    "user_to": "Tên người nhận (nếu có)",
    "amount": Số_nguyên (Ví dụ: 50000),
    "description": "Nội dung của giao dịch"
}}
"""

EXPENSE_PROMPT_TEMPLATE = """
Bạn là một trợ lý kế toán AI. Nhiệm vụ của bạn là trích xuất thông tin tài chính từ văn bản hoặc hình ảnh hóa đơn. 
Hãy trả về kết quả CHỈ LÀ MỘT ARRAY JSON duy nhất. Mỗi phần tử trong array là một hóa đơn (không giải thích thêm) theo định dạng sau:

[{
    "transaction_date": "YYYY-MM-DD",
    "bill_name": "Tên hoá đơn",
    "amount": Tổng tiền của hoá đơn (Số_nguyên, Ví dụ: 50000)
}]
"""

class GeminiService:
    def __init__(self):
        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key or api_key.strip() == "":
            raise ValueError(
                "GOOGLE_API_KEY environment variable is not set or is empty. "
                "Please set it in your .env file or environment variables."
            )
        self.client = genai.Client(api_key=api_key.strip())

        self.user_service = UserService()
        self.transaction_service = TransactionService()

    def chat_with_ai(self, message: str):
        system_prompt = self._get_system_prompt()
        response = self.client.models.generate_content(
            model='gemini-2.5-flash', # Hoặc model bạn muốn
            contents=f"{system_prompt}\n\nNội dung user nhập: {message}"
        )
        clean_res = self._clean_json_string(response.text)
        return json.loads(clean_res)

    async def process_income_image(self, file: UploadFile):
        """
        Process income image, extract transaction data, and create transaction immediately.
        
        Args:
            file: Image file to process
            
        Returns:
            Created transaction with extracted data
        """
        extracted_data = await self._extract_transaction_from_image(file, "INCOME")
        
        # Handle case where id_from might be string or missing
        user_id = extracted_data.get("id_from")
        if isinstance(user_id, str) and user_id.isdigit():
            user_id = int(user_id)
        elif not isinstance(user_id, int) or user_id is None:
            # Try to find user by name
            user_from = extracted_data.get("user_from")
            if user_from:
                users = self.user_service.get_all()
                matching_user = next((u for u in users if u.get("name") == user_from), None)
                if matching_user:
                    user_id = matching_user.get("id")
                else:
                    user_id = None
        
        transaction_data = TransactionCreate(
            type="INCOME",
            description=extracted_data.get("description", ""),
            amount=extracted_data.get("amount"),
            user_id=user_id,
            transaction_date=extracted_data.get("transaction_date"),
            status="COMPLETED"
        )
        
        transaction = self.transaction_service.create_transaction(transaction_data)
        
        if not transaction:
            raise HTTPException(status_code=500, detail="Failed to create transaction")

        result = dict(transaction)
        result["user_name"] = extracted_data.get("user_from")
        return result

    async def process_expense_image(self, file: UploadFile):
        """
        Process expense image, extract transaction information, and create transaction immediately.
        
        Args:
            file: Image file to process
            
        Returns:
            Created transactions with extracted data (status: COMPLETED)
        """
        extracted_data_list = await self._extract_transaction_from_image(file, "EXPENSE")
        
        # Ensure extracted_data_list is a list
        if not isinstance(extracted_data_list, list):
            extracted_data_list = [extracted_data_list]

        transaction_creates = [
            TransactionCreate(
                type="EXPENSE",
                description=extracted_data.get("bill_name"),
                amount=extracted_data.get("amount"),
                user_id=None,
                transaction_date=extracted_data.get("transaction_date"),
                status="COMPLETED"
            )
            for extracted_data in extracted_data_list
        ]

        created_transactions = self.transaction_service.create_transaction(transaction_creates)

        if not created_transactions:
            raise HTTPException(status_code=500, detail="Failed to create transaction")

        return created_transactions

    # Private methods

    def _clean_json_string(self, json_str):
        return json_str.replace("```json", "").replace("```", "").strip()

    def _get_system_prompt(self, type: str = "INCOME"):
        if type == "INCOME":
            members = self.user_service.get_all_member_names()
            return INCOME_PROMPT_TEMPLATE.format(member_list=members)
        elif type == "EXPENSE":
            return EXPENSE_PROMPT_TEMPLATE

    async def _extract_transaction_from_image(self, file: UploadFile, type: str):
        temp_file_path = None
        try:
            system_prompt = self._get_system_prompt(type)
            
            suffix = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file_path = temp_file.name
                content = await file.read()
                temp_file.write(content)
            
            # Upload lên Gemini
            uploaded_file = self.client.files.upload(file=temp_file_path)
            
            # Đợi xử lý
            while uploaded_file.state.name == "PROCESSING":
                time.sleep(0.5)
                uploaded_file = self.client.files.get(name=uploaded_file.name)
            
            # Generate content
            response = self.client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=[system_prompt, uploaded_file]
            )
            
            clean_res = self._clean_json_string(response.text)

            # await asyncio.sleep(10)

            return json.loads(clean_res)
            # return {
            #     "transaction_date": "2026-01-06",
            #     "user_from": "Võ Duy Tân",
            #     "id_from": 3,
            #     "user_to": "MOMO_TOMPAO",
            #     "type": "INCOME",
            #     "amount": 200000,
            #     "description": "Vo Tan dong quy thang 1"
            # }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)