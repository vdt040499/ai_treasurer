from app.services.base_service import BaseService
from app.models import Debt, DebtCreate
from typing import Optional, List, Dict, Any
from app.services.user_service import UserService

class PaymentService():
    def __init__(self):
        self.user_service = UserService()

    def get_payment_link(self, user_id: int):
        user = self.user_service.get_user(user_id)


        return user

    