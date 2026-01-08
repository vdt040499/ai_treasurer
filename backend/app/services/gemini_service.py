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

SYSTEM_PROMPT_TEMPLATE = """
Bạn là một trợ lý kế toán AI. Nhiệm vụ của bạn là trích xuất thông tin tài chính từ văn bản hoặc hình ảnh hóa đơn/chuyển khoản ngân hàng.
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
    "type": "INCOME" hoặc "EXPENSE",
    "amount": Số_nguyên (Ví dụ: 50000),
    "description": "Nội dung của giao dịch"
}}
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
        # Use the global queue_manager instance to ensure same queue
        self._queue_manager = None
    
    @property
    def queue_manager(self):
        """Get the global queue_manager instance"""
        if self._queue_manager is None:
            from app.core.queue_manager import queue_manager
            self._queue_manager = queue_manager
        return self._queue_manager

    def _clean_json_string(self, json_str):
        return json_str.replace("```json", "").replace("```", "").strip()

    def _get_system_prompt(self):
        members = self.user_service.get_all_member_names()
        return SYSTEM_PROMPT_TEMPLATE.format(member_list=members)

    def chat_with_ai(self, message: str):
        system_prompt = self._get_system_prompt()
        response = self.client.models.generate_content(
            model='gemini-2.5-flash', # Hoặc model bạn muốn
            contents=f"{system_prompt}\n\nNội dung user nhập: {message}"
        )
        clean_res = self._clean_json_string(response.text)
        return json.loads(clean_res)

    async def process_income_image(self, file: UploadFile):
        # Lưu file vào temp file trước khi thêm vào queue
        # Vì file object sẽ bị đóng sau khi request kết thúc
        suffix = os.path.splitext(file.filename)[1] if file.filename else '.jpg'
        temp_file_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file_path = temp_file.name
                content = await file.read()
                temp_file.write(content)
            
            transaction = self.transaction_service.create_transaction(TransactionCreate(type="INCOME", description="Giao dịch đang xử lý", status="PENDING"))
            transaction_id = transaction['id']
            # Truyền file path thay vì file object
            await self.queue_manager.add_task(transaction_id, "INCOME", { "file_path": temp_file_path, "filename": file.filename })
            return transaction
        except Exception as e:
            # Clean up temp file nếu có lỗi
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
            raise HTTPException(status_code=500, detail=str(e))

    async def extract_transaction_from_image(self, file: UploadFile):
        temp_file_path = None
        try:
            system_prompt = self._get_system_prompt()
            
            # Tạo file tạm
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
                model='gemini-2.5-flash',
                contents=[system_prompt, uploaded_file]
            )
            
            clean_res = self._clean_json_string(response.text)

            # await asyncio.sleep(10)

            # {
            #     "transaction_date": "2026-01-06",
            #     "user_from": "Võ Duy Tân",
            #     "id_from": 3,
            #     "user_to": "MOMO_TOMPAO",
            #     "type": "EXPENSE",
            #     "amount": 384000,
            #     "description": "Vo Tan transfer money quickly via Zalo"
            # }

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