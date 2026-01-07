from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from app.services import GeminiService

router = APIRouter()
ai_service = GeminiService()

class ChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        return ai_service.chat_with_ai(request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ai/process-income-image")
async def upload_image(file: UploadFile = File(...)):
    try:
        return await ai_service.process_income_image(file)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))