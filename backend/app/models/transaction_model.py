from pydantic import BaseModel
from typing import Optional

class TransactionBase(BaseModel):
    type: str
    description: str
    amount: Optional[int] = None
    user_id: Optional[int] = None
    status: str
    err_message: Optional[str] = None
    transaction_date: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class Transaction(TransactionBase):
    id: int
    created_at: Optional[str] = None

    class Config:
        from_attributes = True