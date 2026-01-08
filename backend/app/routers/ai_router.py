"""AI router endpoints."""
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from pydantic import BaseModel
from app.services import GeminiService

router = APIRouter()

# Dependency injection for service
def get_gemini_service() -> GeminiService:
    """Get GeminiService instance."""
    return GeminiService()

class ChatRequest(BaseModel):
    """Chat request model."""
    message: str

@router.post("/chat")
async def chat(
    request: ChatRequest,
    service: GeminiService = Depends(get_gemini_service)
):
    """
    Chat with AI to extract transaction information from text.
    
    Args:
        request: Chat request with message
        service: GeminiService instance
        
    Returns:
        Extracted transaction data
    """
    try:
        return service.chat_with_ai(request.message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI processing failed: {str(e)}")

@router.post("/ai/process-income-image")
async def upload_income_image(
    file: UploadFile = File(...),
    service: GeminiService = Depends(get_gemini_service)
):
    """
    Process income image, extract transaction information, and create transaction immediately.
    
    Args:
        file: Image file to process
        service: GeminiService instance
        
    Returns:
        Created transaction with extracted data (status: COMPLETED)
    """
    try:
        return await service.process_income_image(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")

@router.post("/ai/process-expense-image")
async def upload_expense_image(
    file: UploadFile = File(...),
    service: GeminiService = Depends(get_gemini_service)
):
    """
    Process expense image, extract transaction information, and create transaction immediately.
    """
    try:
        return await service.process_expense_image(file)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failed: {str(e)}")