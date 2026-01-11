from pydantic import BaseModel
from typing import Optional

class TransactionEntryBase(BaseModel):
    transaction_id: int
    debt_id: Optional[int] = None
    user_id: int
    amount: int
    type: str
    period_month: Optional[str] = None

class TransactionEntry(TransactionEntryBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True

class TransactionEntryCreate(TransactionEntryBase):
    pass