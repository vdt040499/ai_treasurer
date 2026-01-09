"""User router endpoints."""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
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


@router.get("/get-users-with-contributions", response_model=List[Dict[str, Any]])
async def get_users_with_contributions(
    year: Optional[int] = Query(None, description="Filter transactions by year (e.g., 2024)"),
    service: UserService = Depends(get_user_service)
):
    """
    Get all users with their INCOME transaction contributions.
    
    Args:
        year: Optional year to filter transactions (e.g., 2024). If None, returns all transactions.
        service: UserService instance
        
    Returns:
        List of users with contributions formatted for frontend
    """
    try:
        return service.get_users_with_contributions(year=year)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch users with contributions: {str(e)}")

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
