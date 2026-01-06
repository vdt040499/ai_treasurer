import os
import json
import time
import tempfile
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from database import get_supabase


load_dotenv()

supabase = get_supabase()

GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

client = genai.Client(api_key=GOOGLE_API_KEY)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong production nên đổi thành ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

def clean_json_string(json_str):
    json_str = json_str.replace("```json", "").replace("```", "").strip()
    return json_str

# Hàm lấy model mặc định (trả về tên model)
def get_model():
    available = get_cached_available_models()
    if available:
        # Ưu tiên các model có "flash" hoặc "exp" trong tên (thường nhanh hơn)
        for model in available:
            if 'flash' in model.lower() or 'exp' in model.lower():
                return model
        # Nếu không có, trả về model đầu tiên
        return available[0]
    # Fallback nếu không lấy được danh sách
    return "gemini-1.5-flash"

# Hàm thử model thay thế
def try_alternative_model():
    available = get_cached_available_models()
    if available and len(available) > 1:
        # Trả về model thứ 2 trong danh sách
        return available[1]
    return None

# Hàm lấy danh sách models có sẵn và hỗ trợ generateContent
def get_available_models():
    try:
        # Thử lấy danh sách models
        models_response = client.models.list()
        available_models = []
        
        # Xử lý response (có thể là iterator hoặc list)
        models_list = list(models_response) if hasattr(models_response, '__iter__') else models_response
        
        for model in models_list:
            try:
                # Lấy tên model
                model_name = getattr(model, 'name', None)
                if not model_name:
                    continue
                
                # Bỏ prefix "models/" nếu có
                if model_name.startswith('models/'):
                    model_name = model_name.replace('models/', '')
                
                # Kiểm tra xem model có hỗ trợ generateContent không
                supported_methods = getattr(model, 'supported_generation_methods', [])
                if not supported_methods:
                    # Nếu không có thông tin, thêm vào danh sách (sẽ thử và bỏ qua nếu lỗi)
                    available_models.append(model_name)
                elif 'generateContent' in supported_methods:
                    available_models.append(model_name)
            except Exception as e:
                # Bỏ qua model này nếu có lỗi
                continue
        
        return available_models
    except Exception as e:
        # Nếu không lấy được, trả về danh sách rỗng (sẽ dùng fallback)
        print(f"Error listing models: {e}")
        return []

# Cache danh sách models có sẵn
_available_models_cache = None

def get_cached_available_models():
    global _available_models_cache
    if _available_models_cache is None:
        _available_models_cache = get_available_models()
    return _available_models_cache

# --- PROMPT KỸ THUẬT (System Prompt) ---
SYSTEM_PROMPT = """
Bạn là một trợ lý kế toán AI. Nhiệm vụ của bạn là trích xuất thông tin tài chính từ văn bản hoặc hình ảnh hóa đơn/chuyển khoản ngân hàng.
Hãy trả về kết quả CHỈ LÀ MỘT JSON duy nhất (không giải thích thêm) theo định dạng sau:
{
    "date": "YYYY-MM-DD", (Ngày giao dịch, nếu không rõ thì lấy ngày hôm nay)
    "from": "Tên người gửi",
    "to": "Tên người nhận",
    "item": "Tên ngắn gọn của món hàng hoặc nội dung chuyển khoản",
    "type": "Thu" hoặc "Chi", (Giao dịch ngân hàng Techcombank hoặc Momo là Thu, hoá đơn mua hàng là Chi)
    "amount": Số_nguyên (Ví dụ: 50000, bỏ qua 'đ', 'VND', dấu chấm phẩy)
}
Nếu không tìm thấy thông tin, hãy đoán dựa trên ngữ cảnh tốt nhất có thể.
"""

# API 1: Xử lý Text (Chat)
@app.post("/api/chat")
async def process_chat(request: ChatRequest):
    try:
        # Gửi prompt + tin nhắn user
        model_name = get_model()
        response = client.models.generate_content(
            model=model_name,
            contents=f"{SYSTEM_PROMPT}\n\nNội dung user nhập: {request.message}"
        )
        
        # Parse kết quả thành JSON
        clean_res = clean_json_string(response.text)
        data = json.loads(clean_res)
        return data
        
    except Exception as e:
        # Nếu lỗi 404 (model not found), thử model khác
        if "404" in str(e) or "not found" in str(e).lower():
            alt_model = try_alternative_model()
            if alt_model:
                try:
                    response = client.models.generate_content(
                        model=alt_model,
                        contents=f"{SYSTEM_PROMPT}\n\nNội dung user nhập: {request.message}"
                    )
                    clean_res = clean_json_string(response.text)
                    data = json.loads(clean_res)
                    return data
                except Exception as e2:
                    raise HTTPException(status_code=500, detail=f"Lỗi sau khi thử model khác: {str(e2)}")
        raise HTTPException(status_code=500, detail=str(e))

# API 2: Xử lý Ảnh (Upload Hóa đơn)
@app.post("/api/upload")
async def process_image(file: UploadFile = File(...)):
    temp_file_path = None
    try:
        # Lấy MIME type từ file
        mime_type = file.content_type or "image/jpeg"
        
        # Tạo file tạm để lưu ảnh upload
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1] if file.filename else '.jpg') as temp_file:
            temp_file_path = temp_file.name
            # Ghi dữ liệu ảnh vào file tạm
            content = await file.read()
            temp_file.write(content)
        
        # Upload file lên Google Gemini để lấy file URI
        uploaded_file = client.files.upload(
            file=temp_file_path
        )
        
        # Đợi file được xử lý
        while uploaded_file.state.name == "PROCESSING":
            time.sleep(0.5)
            uploaded_file = client.files.get(name=uploaded_file.name)
        
        if uploaded_file.state.name == "FAILED":
            raise HTTPException(status_code=500, detail="File upload failed")
        
        # Sử dụng file URI để generate content
        # Lấy danh sách models có sẵn
        models_to_try = get_cached_available_models()
        
        if not models_to_try:
            # Nếu không lấy được, thử các model mặc định
            models_to_try = [
                'gemini-2.0-flash-exp',
                'gemini-1.5-flash-latest',
                'gemini-1.5-pro-latest',
                'gemini-1.5-pro',
                'gemini-1.5-flash'
            ]
        
        response = None
        last_error = None
        for model_name in models_to_try:
            try:
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=[SYSTEM_PROMPT, uploaded_file]
                )
                break  # Thành công, thoát khỏi vòng lặp
            except Exception as e:
                last_error = e
                continue  # Thử model tiếp theo
        
        if response is None:
            available_models_str = ', '.join(models_to_try) if models_to_try else 'none'
            raise HTTPException(
                status_code=500, 
                detail=f"Không thể tìm model phù hợp. Đã thử: {available_models_str}. Lỗi cuối: {str(last_error)}"
            )
        
        # Parse kết quả thành JSON (giống như API chat)
        clean_res = clean_json_string(response.text)
        data = json.loads(clean_res)
        print(data)
        
        # Xóa file đã upload sau khi xử lý xong
        try:
            client.files.delete(name=uploaded_file.name)
        except:
            pass  # Ignore errors when deleting
        
        return data

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Xóa file tạm
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass  # Ignore errors when deleting temp file
            

# API để xem danh sách models có sẵn (để debug)
@app.get("/api/models")
async def list_models():
    try:
        models = get_available_models()
        return {
            "available_models": models,
            "current_model": get_model()
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Chạy server tại port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)