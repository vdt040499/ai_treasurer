"""Transaction router endpoints."""
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.models import Transaction, TransactionCreate, TransactionFilters
from app.services import TransactionService

router = APIRouter()

# Dependency injection for service
def get_transaction_service() -> TransactionService:
    """Get TransactionService instance."""
    return TransactionService()

@router.get("/", response_model=list[Transaction])
async def get_transactions(
    filters: TransactionFilters = Depends(),
    service: TransactionService = Depends(get_transaction_service)
):
    """
    Get transactions with optional filters.
    
    Args:
        filters: Query filters (skip, limit, status, type, dates, description)
        service: TransactionService instance
        
    Returns:
        List of transactions
    """
    try:
        return service.get_transactions(
            skip=filters.skip,
            limit=filters.limit,
            status=filters.status,
            type=filters.type,
            start_date=filters.start_date,
            end_date=filters.end_date,
            description=filters.description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch transactions: {str(e)}")

@router.post("/", response_model=Transaction)
async def create_transaction(
    transaction: TransactionCreate,
    service: TransactionService = Depends(get_transaction_service)
):
    """
    Create a new transaction.
    
    Args:
        transaction: Transaction data
        service: TransactionService instance
        
    Returns:
        Created transaction
    """
    try:
        result = service.create_transaction(transaction)
        if not result:
            raise HTTPException(status_code=400, detail="Failed to create transaction")
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create transaction: {str(e)}")

@router.get("/get-all-incomes", response_model=List[Dict[str, Any]])
async def get_all_incomes(
    filters: TransactionFilters = Depends(),
    service: TransactionService = Depends(get_transaction_service)
):
    """
    Get all incomes with optional filters.
    
    Args:
        filters: Query filters (skip, limit, status, type, dates, description)
        service: TransactionService instance
        
    Returns:
        List of incomes
    """
    try:
        return service.get_all_incomes(
            start_date=filters.start_date,
            end_date=filters.end_date,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch incomes: {str(e)}")

@router.get("/dashboard-stats", response_model=Dict[str, Any])
async def get_dashboard_stats(
    service: TransactionService = Depends(get_transaction_service)
):
    """
    Get dashboard statistics.
    
    Args:
        service: TransactionService instance
        
    Returns:
        Dict with total_income, total_expense, and balance
    """
    try:
        return service.get_dashboard_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard stats: {str(e)}")