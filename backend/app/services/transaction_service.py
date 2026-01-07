from app.core.database import get_supabase_client
from app.models import TransactionCreate

class TransactionService:
    def __init__(self):
        self.client = get_supabase_client()
        self.table_name = "transactions"

    def get_transactions(self):
        response = self.client.table(self.table_name).select("*").order("created_at", desc=True).execute()
        return response.data

    def create_transaction(self, transaction: TransactionCreate):
        response = self.client.table(self.table_name).insert(transaction.model_dump()).execute()

        # Supabase returns a list, but we need to return a single transaction object
        return response.data[0] if response.data else None

    def update_transaction(self, id: int, transaction: TransactionCreate):
        response = self.client.table(self.table_name).update(transaction.model_dump()).eq("id", id).execute()

        # Supabase returns a list, but we need to return a single transaction object
        return response.data[0] if response.data else None

    def delete_transaction(self, id: int):
        response = self.client.table(self.table_name).delete().eq("id", id).execute()

        return response.data