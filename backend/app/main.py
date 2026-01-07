# Load environment variables FIRST, before any other imports
from dotenv import load_dotenv
from pathlib import Path

from app.core.queue_manager import queue_manager
from contextlib import asynccontextmanager
import asyncio

# Load .env file from the backend directory
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Now import other modules that may use environment variables
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.ai_router import router as ai_router
from app.routers.transaction_router import router as transaction_router
from app.routers.user_router import router as user_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP: Chạy worker trong background
    task = asyncio.create_task(queue_manager.worker())
    print(f"Worker task created: {task}")
    # Đảm bảo task được schedule
    await asyncio.sleep(0.1)  # Cho event loop thời gian để schedule task
    yield
    # SHUTDOWN: Cancel worker task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Worker task cancelled")

app = FastAPI(lifespan=lifespan)

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong production nên set cụ thể domain frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router, prefix="/api", tags=["AI"])
app.include_router(transaction_router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)