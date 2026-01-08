from pydantic import BaseModel
from typing import Optional

class TransactionBase(BaseModel):
    type: str
    description: Optional[str] = None
    amount: Optional[int] = None
    user_id: Optional[int] = None
    status: str
    err_message: Optional[str] = None
    transaction_date: Optional[str] = None

class TransactionCreate(TransactionBase):
    pass

class TransactionFilters(BaseModel):
    """Query filters for transactions."""
    skip: int = 0
    limit: int = 100
    status: Optional[str] = None
    type: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    description: Optional[str] = None

class UserInfo(BaseModel):
    """User information embedded in transaction."""
    id: int
    name: str
    email: Optional[str] = None

class Transaction(TransactionBase):
    id: int
    created_at: Optional[str] = None
    status: Optional[str] = "COMPLETED"
    user: Optional[UserInfo] = None

    class Config:
        from_attributes = True