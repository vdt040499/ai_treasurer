from app.services.base_service import BaseService
from app.models import Debt, DebtCreate
from typing import Optional, List, Dict, Any

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

    def get_all_debts(
        self,
        user_id: Optional[int] = None,
        is_fully_paid: Optional[bool] = None,
        order_by: Optional[str] = "created_at",
        desc: bool = True
    ) -> List[Dict[str, Any]]:
        """
        Get all debts with optional filters.
        
        Args:
            user_id: Filter by user_id
            is_fully_paid: Filter by is_fully_paid status
            order_by: Column name to order by
            desc: Order descending if True
            
        Returns:
            List of debts with user information
        """
        query = self.client.table(self.table_name).select("*, users(*)").order(order_by, desc=desc)
        
        if user_id is not None:
            query = query.eq("user_id", user_id)
        
        if is_fully_paid is not None:
            query = query.eq("is_fully_paid", is_fully_paid)
        
        response = query.execute()
        
        # Transform data: Supabase returns users as array, but we need single user object
        transformed_data = []
        for item in response.data:
            # Handle different response formats from Supabase
            if 'users' in item:
                if isinstance(item['users'], list):
                    if len(item['users']) > 0:
                        item['user'] = item['users'][0]
                    else:
                        item['user'] = None
                elif isinstance(item['users'], dict):
                    item['user'] = item['users']
                else:
                    item['user'] = None
                item.pop('users', None)
            else:
                item['user'] = None
            
            transformed_data.append(item)
        
        return transformed_data