"""User service for business logic."""
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.services.base_service import BaseService
from app.models import UserCreate


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
        print('users: ', users)
        
        # Get all INCOME transactions grouped by user_id
        transaction_service = self.client.table("transactions")
        query = transaction_service.select("user_id, transaction_date").eq("type", "INCOME")
        
        # Filter by year if provided
        if year is not None:
            start_date = f"{year}-01-01"
            end_date = f"{year}-12-31"
            query = query.gte("transaction_date", start_date).lte("transaction_date", end_date)
        
        income_transactions = query.execute()
        
        # Group transactions by user_id
        user_transactions: Dict[int, List[str]] = {}
        for tx in income_transactions.data:
            if tx.get('user_id') and tx.get('transaction_date'):
                user_id = tx['user_id']
                transaction_date = tx['transaction_date']
                # Format date to YYYY-MM
                try:
                    date_obj = datetime.fromisoformat(transaction_date.replace('Z', '+00:00'))
                    month_str = date_obj.strftime('%Y-%m')
                    # If year filter is provided, only include transactions from that year
                    if year is not None and date_obj.year != year:
                        continue
                    if user_id not in user_transactions:
                        user_transactions[user_id] = []
                    if month_str not in user_transactions[user_id]:
                        user_transactions[user_id].append(month_str)
                except (ValueError, AttributeError):
                    # If date parsing fails, try to extract YYYY-MM directly
                    if len(transaction_date) >= 7:
                        month_str = transaction_date[:7]
                        # If year filter is provided, check if month_str starts with that year
                        if year is not None and not month_str.startswith(str(year)):
                            continue
                        if user_id not in user_transactions:
                            user_transactions[user_id] = []
                        if month_str not in user_transactions[user_id]:
                            user_transactions[user_id].append(month_str)
        
        # Format users with contributions
        result = []
        for user in users:
            user_id = user.get('id')
            created_at = user.get('created_at', '')
            avatar = user.get('avatar', '')
            
            # Format joinedDate from created_at
            joined_date = ''
            if created_at:
                try:
                    date_obj = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    joined_date = date_obj.strftime('%Y-%m')
                except (ValueError, AttributeError):
                    # If date parsing fails, try to extract YYYY-MM directly
                    if len(created_at) >= 7:
                        joined_date = created_at[:7]
            
            # Get contributions for this user
            contributions = user_transactions.get(user_id, [])
            # Sort contributions from smallest to largest
            contributions.sort()
            
            result.append({
                'id': str(user_id),
                'name': user.get('name', ''),
                'avatar': avatar,
                'created_at': joined_date,
                'contributions': contributions
            })
        
        return result