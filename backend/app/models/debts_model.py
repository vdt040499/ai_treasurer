from pydantic import BaseModel

class DebtBase(BaseModel):
    user_id: int
    amount: int
    description: str
    type: str
    is_full_paid: bool

class DebtCreate(DebtBase):
    pass

class Debt(DebtBase):
    id: int
    created_at: str

    class Config:
        from_attributes = True