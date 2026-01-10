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

        # Get all INCOME transactions grouped by user_id
        transaction_service = self.client.table("transactions")
        query = transaction_service.select("user_id, transaction_date, amount, type", "description").in_("type", ["INCOME", "DEBT"])
        
        # Filter by year if provided
        if year is not None:
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
            query = query.gte("transaction_date", start_date).lte("transaction_date", end_date)
        
        income_transactions = query.execute()
        
        # Group transactions by user_id
        total_user_amount: Dict[int, Dict[str, int]] = {}
        for tx in income_transactions.data:
            user_id = tx.get('user_id')
            if user_id is None:
                continue  # Skip transactions without user_id
                
            if user_id not in total_user_amount:
                total_user_amount[user_id] = {
                    "INCOME": 0,
                    "DEBT": 0
                }

            tx_type = tx.get('type')
            amount = tx.get('amount', 0)
            
            if tx_type == "INCOME":
                total_user_amount[user_id]["INCOME"] += amount
            elif tx_type == "DEBT":
                description = tx.get('description', '')
                total_user_amount[user_id]["DEBT"] += amount
                total_user_amount[user_id]["DEBT_DESCRIPTION"] = description
        
        result = []
        for user in users:
            user_id = user.get('id')
            created_at = user.get('created_at', '')
            avatar = user.get('avatar', '')
            
            joined_date = created_at[:7] if created_at else ''
            
            # Get user's transaction totals, default to 0 if no transactions
            user_totals = total_user_amount.get(user_id, {"INCOME": 0, "DEBT": 0})
            income_total = user_totals.get("INCOME", 0)
            debt_total = user_totals.get("DEBT", 0)
            debt_description = user_totals.get("DEBT_DESCRIPTION", '')
            
            # Use current year if year is None
            target_year = year if year is not None else datetime.now().year
            current_month = datetime.now().month
            number_of_paid_months = math.floor(income_total / MONTHLY_FEE) if MONTHLY_FEE > 0 else 0
            contributions = [f"{target_year}-{month:02d}" for month in range(1, 13) if month <= number_of_paid_months]
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