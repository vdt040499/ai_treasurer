from fastapi import APIRouter, HTTPException
from app.models import Transaction, TransactionCreate
from app.services import TransactionService

router = APIRouter()

@router.get("/", response_model=list[Transaction])
async def get_transactions():
    return TransactionService().get_transactions()

@router.post("/", response_model=Transaction)
async def create_transaction(transaction: TransactionCreate):
    return TransactionService().create_transaction(transaction)
