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
        return self.get_all(order_by="id", desc=False, filters={"active": True})

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
        current_month = datetime.now().month

        # Get all transaction entries in one query - both FUND and DEBT_PAYMENT types
        transaction_entry_service = self.client.table("transaction_entries")
        query = transaction_entry_service.select("*").in_("type", ["FUND", "DEBT_PAYMENT"])
        query = query.ilike("period_month", f"{current_year}%")
        all_transaction_entries = query.execute()

        # Get all unpaid debts in one query
        debt_service = self.client.table("debts")
        query = debt_service.select("*").eq("is_fully_paid", False)
        debt_entries = query.execute()
    
        # Create a dictionary for O(1) debt lookup by user_id
        debt_by_user: Dict[int, Dict[str, Any]] = {}
        for debt in debt_entries.data:
            user_id = debt.get('user_id')
            if user_id:
                debt_by_user[user_id] = debt
    
        # Group transactions by user_id and type
        total_user_amount: Dict[int, Dict[str, Any]] = {}
        for tx in all_transaction_entries.data:
            user_id = tx.get('user_id')
            tx_type = tx.get('type')
            
            if user_id not in total_user_amount:
                total_user_amount[user_id] = {
                    "total_income": 0,
                    "paid_months": [],
                    "paid_debt_total": 0,
                }

            amount = tx.get('amount', 0)
            if tx_type == "FUND":
                total_user_amount[user_id]["total_income"] += amount
                total_user_amount[user_id]["paid_months"].append(tx.get('period_month'))
            elif tx_type == "DEBT_PAYMENT":
                total_user_amount[user_id]["paid_debt_total"] += amount
        
        result = []
        for user in users:
            user_id = user.get('id')
            created_at = user.get('created_at', '')
            avatar = user.get('avatar', '')
            
            joined_date = created_at[:7] if created_at else ''
            
            # Get user's transaction totals, default to 0 if no transactions
            user_totals = total_user_amount.get(user_id, {
                "total_income": 0, 
                "paid_months": [],
                "paid_debt_total": 0
            })
            income_total = user_totals.get("total_income", 0)
            contributions = sorted(user_totals.get("paid_months", []))
            paid_debt_total = user_totals.get("paid_debt_total", 0)
            
            # O(1) lookup for debt entry
            debt_entry = debt_by_user.get(user_id)
            debt_total = debt_entry.get('amount', 0) if debt_entry else 0
            debt_description = debt_entry.get('description', '') if debt_entry else ''

            debt_amount = income_total - current_month * MONTHLY_FEE - debt_total + paid_debt_total

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