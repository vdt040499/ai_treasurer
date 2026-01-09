from pydantic import BaseModel
from typing import Optional

class UserBase(BaseModel):
    name: str
    email: str
    active: bool

class UserCreate(UserBase):
    pass

class User(UserBase):
    id: int
    created_at: Optional[str] = None
    contributions: Optional[list[str]] = None

    class Config:
        from_attributes = True