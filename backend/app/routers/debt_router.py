"""Debt router endpoints."""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from app.models import Debt
from app.services import DebtService

router = APIRouter()

# Dependency injection for service
def get_debt_service() -> DebtService:
    """Get DebtService instance."""
    return DebtService()

@router.get("/", response_model=List[Dict[str, Any]])
async def get_debts(
    user_id: Optional[int] = Query(None, description="Filter by user_id"),
    is_fully_paid: Optional[bool] = Query(None, description="Filter by is_fully_paid status"),
    service: DebtService = Depends(get_debt_service)
):
    """
    Get all debts with optional filters.
    
    Args:
        user_id: Filter by user_id
        is_fully_paid: Filter by is_fully_paid status (True/False)
        service: DebtService instance
        
    Returns:
        List of debts with user information
    """
    try:
        return service.get_all_debts(user_id=user_id, is_fully_paid=is_fully_paid)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch debts: {str(e)}")

