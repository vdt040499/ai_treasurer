"""Base service class for common database operations."""
from typing import Optional, List, Dict, Any
from app.core.database import get_supabase_client
from supabase import Client


class BaseService:
    """Base service class with common CRUD operations."""
    
    def __init__(self, table_name: str):
        """
        Initialize base service.
        
        Args:
            table_name: Name of the Supabase table
        """
        self.client: Client = get_supabase_client()
        self.table_name: str = table_name
    
    def _get_first_item(self, response_data: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Extract first item from Supabase response.
        
        Args:
            response_data: List of items from Supabase response
            
        Returns:
            First item or None if list is empty
        """
        return response_data[0] if response_data else None
    
    def get_all(self, order_by: Optional[str] = None, desc: bool = True, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Get all records from table.
        
        Args:
            order_by: Column name to order by
            desc: Order descending if True
            
        Returns:
            List of records
        """
        query = self.client.table(self.table_name).select("*")

        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        if order_by:
            query = query.order(order_by, desc=desc)
        
        response = query.execute()
        return response.data
    
    def get_by_id(self, id: int) -> Optional[Dict[str, Any]]:
        """
        Get record by ID.
        
        Args:
            id: Record ID
            
        Returns:
            Record or None if not found
        """
        response = self.client.table(self.table_name).select("*").eq("id", id).execute()
        return self._get_first_item(response.data)
    
    def create(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Create a new record.
        
        Args:
            data: Data to insert
            
        Returns:
            Created record or None
        """
        response = self.client.table(self.table_name).insert(data).execute()
        return self._get_first_item(response.data)
    
    def update(self, id: int, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update a record by ID.
        
        Args:
            id: Record ID
            data: Data to update
            
        Returns:
            Updated record or None
        """
        response = self.client.table(self.table_name).update(data).eq("id", id).execute()
        return self._get_first_item(response.data)
    
    def delete(self, id: int) -> bool:
        """
        Delete a record by ID.
        
        Args:
            id: Record ID
            
        Returns:
            True if deleted successfully
        """
        response = self.client.table(self.table_name).delete().eq("id", id).execute()
        return len(response.data) > 0

