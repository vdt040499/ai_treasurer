"""User service for business logic."""
import json
import math
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.services.base_service import BaseService
from app.models import UserCreate
from app.constants import MONTHLY_FEE


class UserService(BaseService):
    """Service for user operations."""
    
    def __init__(self):
        super().__init__(table_name="users")

    def get_all_member_names(self) -> str:
        """
        Get all active member names as comma-separated string.
        
        Returns:
            Comma-separated string of member names
        """
        try:
            response = self.client.table(self.table_name).select("name", "id").execute()
            print('response: ', response.data)
            names = [{ "id": user['id'], "name": user['name'] } for user in response.data]
            return "[" + ", ".join([f"{{'id': {user['id']}, 'name': '{user['name']}'}}" for user in names]) + "]"
        except Exception:
            return ""

    def get_users(self) -> List[Dict[str, Any]]:
        """
        Get all users ordered by creation date.
        
        Returns:
            List of users
        """
        return self.get_all(order_by="id", desc=False)

    def create_user(self, user: UserCreate) -> Optional[Dict[str, Any]]:
        """
        Create a new user.
        
        Args:
            user: User data
            
        Returns:
            Created user or None
        """
        return self.create(user.model_dump())

    def get_users_with_contributions(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all users with their INCOME transaction contributions.
        Format: { id, name, avatar: '', joinedDate: YYYY-MM, contributions: [YYYY-MM, ...] }
        
        Args:
            year: Optional year to filter transactions (e.g., 2024). If None, returns all transactions.
        
        Returns:
            List of users with contributions formatted for frontend
        """
        # Get all users
        users = self.get_users()

        current_year = datetime.now().year

        # Get all transaction entries grouped by user_id
        transaction_entry_service = self.client.table("transaction_entries")
        query = transaction_entry_service.select("*").eq("type", "FUND")
        query = query.ilike("period_month", f"{current_year}%")
        transaction_entries = query.execute()

        debt_service = self.client.table("debts")
        query = debt_service.select("*").eq("is_fully_paid", False)
        debt_entries = query.execute()
    
        # Group transactions by user_id
        total_user_amount: Dict[int, Dict[str, int]] = {}
        for tx in transaction_entries.data:
            user_id = tx.get('user_id')
            if user_id not in total_user_amount:
                total_user_amount[user_id] = {
                    "total_income": 0,
                    "paid_months": [],
                }

            amount = tx.get('amount', 0)
            total_user_amount[user_id]["total_income"] += amount
            total_user_amount[user_id]["paid_months"].append(tx.get('period_month'))
        
        result = []
        for user in users:
            user_id = user.get('id')
            created_at = user.get('created_at', '')
            avatar = user.get('avatar', '')
            
            joined_date = created_at[:7] if created_at else ''
            
            # Get user's transaction totals, default to 0 if no transactions
            user_totals = total_user_amount.get(user_id, {"total_income": 0, "paid_months": []})
            income_total = user_totals.get("total_income", 0)
            contributions = sorted(user_totals.get("paid_months", []))
            debt_entry = next((debt for debt in debt_entries.data if debt.get("user_id") == user_id), None)
            debt_total = debt_entry.get('amount', 0) if debt_entry else 0
            debt_description = debt_entry.get('description', '') if debt_entry else ''

            current_month = datetime.now().month
            debt_amount = income_total - current_month * MONTHLY_FEE - debt_total

            # Admin debt is 0
            if (user_id == 9 or debt_amount > 0):
                debt_amount = 0

            result.append({
                'id': str(user_id),
                'name': user.get('name', ''),
                'avatar': avatar,
                'created_at': joined_date,
                'contributions': contributions,
                'debt_amount': debt_amount,
                'debt_description': debt_description
            })
        
        return result