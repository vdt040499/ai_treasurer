"""User service for business logic."""
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
            response = self.client.table(self.table_name).select("name").execute()
            names = [user['name'] for user in response.data]
            return ", ".join(names)
        except Exception:
            return ""

    def get_users(self) -> List[Dict[str, Any]]:
        """
        Get all users ordered by creation date.
        
        Returns:
            List of users
        """
        return self.get_all(order_by="created_at", desc=True)

    def create_user(self, user: UserCreate) -> Optional[Dict[str, Any]]:
        """
        Create a new user.
        
        Args:
            user: User data
            
        Returns:
            Created user or None
        """
        return self.create(user.model_dump())