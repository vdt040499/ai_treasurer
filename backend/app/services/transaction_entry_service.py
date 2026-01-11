from app.services.base_service import BaseService
from app.models import TransactionEntry, TransactionEntryCreate

class TransactionEntryService(BaseService):
    def __init__(self):
        super().__init__(table_name="transaction_entries")

    def create_transaction_entry(self, transaction_entry: TransactionEntryCreate):
        return self.create(transaction_entry.model_dump())

    def get_transaction_entry(self, id: int):
        return self.get_by_id(id)

    def update_transaction_entry(self, id: int, transaction_entry: TransactionEntryCreate):
        return self.update(id, transaction_entry.model_dump())