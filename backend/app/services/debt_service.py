from app.services.base_service import BaseService
from app.models import Debt, DebtCreate

class DebtService(BaseService):
    def __init__(self):
        super().__init__(table_name="debts")

    def create_debt(self, debt: Debt):
        return self.create(debt.model_dump())

    def get_debt(self, id: int):
        return self.get_by_id(id)

    def update_debt(self, id: int, debt: Debt):
        return self.update(id, debt.model_dump())

    def get_unpaid_debt(self, user_id: int):
        debts = self.get_all(order_by="created_at", desc=False, filters={"user_id": user_id, "is_fully_paid": False})
        return debts[0] if debts else None