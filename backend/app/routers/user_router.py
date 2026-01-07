from fastapi import APIRouter, HTTPException
from app.models import User, UserCreate
from app.services import UserService

router = APIRouter()
user_service = UserService()

@router.get("/", response_model=list[User])
async def get_users():
    response = user_service.get_users()

    return response

@router.post("/", response_model=User)
async def create_user(user: UserCreate):
    response = user_service.create_user(user)

    return response
