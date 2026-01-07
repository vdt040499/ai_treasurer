import asyncio
import os
from app.services.transaction_service import TransactionService

class QueueManager:
    def __init__(self):
        self.queue = asyncio.Queue()
        self.transaction_service = TransactionService()
        # Lazy import to avoid circular dependency
        self._gemini_service = None
    
    @property
    def gemini_service(self):
        if self._gemini_service is None:
            from app.services.gemini_service import GeminiService
            self._gemini_service = GeminiService()
        return self._gemini_service

    async def add_task(self, transaction_id: str, type: str, data: dict):
        await self.queue.put((transaction_id, type, data))
        print(f"Task added for Transaction {transaction_id}. Queue size: {self.queue.qsize()}")

    async def worker(self):
        print("Queue Worker started...")
        print(f"Worker is running in event loop: {asyncio.get_event_loop().is_running()}")
        while True:
            print("Worker waiting for task...")
            transaction_id, type, data = await self.queue.get()
            print(f"Worker received task: transaction_id={transaction_id}, type={type}")
            
            try:
                print(f"Processing transaction: {transaction_id}")
                
                # Get existing transaction to preserve required fields
                print(f"Fetching transactions to find id={transaction_id}...")
                transactions = self.transaction_service.get_transactions()
                print(f"Found {len(transactions)} transactions")
                existing_transaction = next((t for t in transactions if t.get('id') == int(transaction_id)), None)
                
                if not existing_transaction:
                    print(f"Transaction {transaction_id} not found. Skipping...")
                    self.queue.task_done()
                    continue
                
                # Update transaction status to PROCESSING
                from app.models import TransactionCreate
                processing_data = TransactionCreate(
                    type=existing_transaction.get('type', 'INCOME'),
                    description=existing_transaction.get('description', 'Processing...'),
                    status="PROCESSING",
                    amount=existing_transaction.get('amount'),
                    user_id=existing_transaction.get('user_id'),
                    transaction_date=existing_transaction.get('transaction_date')
                )
                self.transaction_service.update_transaction(int(transaction_id), processing_data)

                if type == "INCOME":
                    file_path = data.get("file_path")
                    filename = data.get("filename", "image.jpg")
                    if not file_path or not os.path.exists(file_path):
                        print(f"File not found: {file_path}")
                        self.queue.task_done()
                        continue
                    
                    # Tạo UploadFile-like object từ file path
                    from fastapi import UploadFile
                    from io import BytesIO
                    with open(file_path, 'rb') as f:
                        file_content = f.read()
                    file_obj = UploadFile(
                        filename=filename,
                        file=BytesIO(file_content)
                    )
                    
                    result_json = await self.gemini_service.extract_transaction_from_image(file_obj)
                    
                    # Clean up temp file sau khi xử lý xong
                    try:
                        if os.path.exists(file_path):
                            os.unlink(file_path)
                    except Exception as cleanup_error:
                        print(f"Failed to cleanup temp file {file_path}: {cleanup_error}")
                    update_data = TransactionCreate(
                        type=result_json.get("type", existing_transaction.get('type', 'INCOME')),
                        description=result_json.get("description", existing_transaction.get('description', '')),
                        amount=result_json.get("amount"),
                        transaction_date=result_json.get("transaction_date"),
                        user_id=result_json.get("id_from"),
                        status="COMPLETED"
                    )
                    self.transaction_service.update_transaction(int(transaction_id), update_data)
                else:
                    pass
                
                print(f"Transaction {transaction_id} completed.")

            except Exception as e:
                print(f"Error processing {transaction_id}: {e}")
                # Cập nhật trạng thái lỗi
                try:
                    # Get existing transaction to preserve required fields
                    transactions = self.transaction_service.get_transactions()
                    existing_transaction = next((t for t in transactions if t.get('id') == int(transaction_id)), None)
                    if existing_transaction:
                        from app.models import TransactionCreate
                        failed_data = TransactionCreate(
                            type=existing_transaction.get('type', 'INCOME'),
                            description=existing_transaction.get('description', ''),
                            status="FAILED",
                            err_message=str(e),
                            amount=existing_transaction.get('amount'),
                            user_id=existing_transaction.get('user_id'),
                            transaction_date=existing_transaction.get('transaction_date')
                        )
                        self.transaction_service.update_transaction(int(transaction_id), failed_data)
                except Exception as update_error:
                    print(f"Failed to update transaction status: {update_error}")
            
            finally:
                # Đánh dấu task đã xong để queue biết đường xử lý tiếp
                self.queue.task_done()

# Tạo một instance global để dùng chung
queue_manager = QueueManager()