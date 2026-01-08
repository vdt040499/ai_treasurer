"""User router endpoints."""
from fastapi import APIRouter, HTTPException, Depends
from app.models import User, UserCreate
from app.services import UserService

router = APIRouter()

# Dependency injection for service
def get_user_service() -> UserService:
    """Get UserService instance."""
    return UserService()

@router.get("/", response_model=list[User])
async def get_users(service: UserService = Depends(get_user_service)):
    """
    Get all users.
    
    Args:
        service: UserService instance
        
    Returns:
        List of users
    """
    try:
        return service.get_users()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users: {str(e)}")

@router.post("/", response_model=User)
async def create_user(
    user: UserCreate,
    service: UserService = Depends(get_user_service)
):
    """
    Create a new user.
    
    Args:
        user: User data
        service: UserService instance
        
    Returns:
        Created user
    """
    try:
        result = service.create_user(user)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create user")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")
