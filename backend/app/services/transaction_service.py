"""Transaction service for business logic."""
from typing import Optional, List, Dict, Any
from app.services.base_service import BaseService
from app.models import TransactionCreate


class TransactionService(BaseService):
    """Service for transaction operations."""
    
    def __init__(self):
        super().__init__(table_name="transactions")

    def get_transactions(
        self,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None,
        type: Optional[str] = None,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        description: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Get transactions with optional filters.
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            status: Filter by status
            type: Filter by type (INCOME/EXPENSE)
            start_date: Filter by start date (YYYY-MM-DD)
            end_date: Filter by end date (YYYY-MM-DD)
            description: Search in description (case-insensitive)
            
        Returns:
            List of transactions
        """
        # Join với users table - Supabase tự động detect foreign key relationship
        # Nếu không work, thử: users!user_id(*) hoặc users!inner(*)
        query = self.client.table(self.table_name).select("*, users(*)").order("transaction_date", desc=True)

        if status:
            query = query.eq("status", status)
        if type:
            query = query.eq("type", type)
        if start_date:
            query = query.gte("transaction_date", start_date)
        if end_date:
            query = query.lte("transaction_date", end_date)
        if description:
            query = query.ilike("description", f"%{description}%")

        query = query.range(skip, skip + limit - 1)
        response = query.execute()
        
        # Transform data: Supabase returns users as array, but we need single user object
        transformed_data = []
        for item in response.data:
            # Handle different response formats from Supabase
            # Case 1: users is an array (most common)
            if 'users' in item:
                if isinstance(item['users'], list):
                    if len(item['users']) > 0:
                        item['user'] = item['users'][0]
                    else:
                        item['user'] = None
                # Case 2: users is already an object (shouldn't happen but handle it)
                elif isinstance(item['users'], dict):
                    item['user'] = item['users']
                else:
                    item['user'] = None
                # Remove the users key, keep only user object
                item.pop('users', None)
            # Case 3: No users field (transaction without user_id)
            else:
                item['user'] = None
            
            transformed_data.append(item)
        
        return transformed_data

    def create_transaction(self, transaction: TransactionCreate) -> Optional[Dict[str, Any]]:
        """
        Create a new transaction.
        
        Args:
            transaction: Transaction data
            
        Returns:
            Created transaction or None
        """
        return self.create(transaction.model_dump())

    def update_transaction(self, id: int, transaction: TransactionCreate) -> Optional[Dict[str, Any]]:
        """
        Update a transaction.
        
        Args:
            id: Transaction ID
            transaction: Updated transaction data
            
        Returns:
            Updated transaction or None
        """
        return self.update(id, transaction.model_dump())

    def delete_transaction(self, id: int) -> bool:
        """
        Delete a transaction.
        
        Args:
            id: Transaction ID
            
        Returns:
            True if deleted successfully
        """
        return self.delete(id)

    def update_status(self, id: int, status: str, error_msg: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Update transaction status.
        
        Args:
            id: Transaction ID
            status: New status
            error_msg: Optional error message
            
        Returns:
            Updated transaction or None
        """
        data = {"status": status}
        if error_msg:
            data["err_message"] = error_msg
        return self.update(id, data)

    def get_all_incomes(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get all incomes with optional filters.
        
        Args:
            start_date: Filter by start date (YYYY-MM-DD)
            end_date: Filter by end date (YYYY-MM-DD)
            
        Returns:
            List of incomes
        """
        query = self.client.table(self.table_name).select("transaction_date, amount, users!inner(*)").order("transaction_date", desc=True)

        query = query.eq("type", "INCOME")

        if start_date:
            query = query.gte("transaction_date", start_date)
        if end_date:
            query = query.lte("transaction_date", end_date)

        query = query.execute()
        return query.data