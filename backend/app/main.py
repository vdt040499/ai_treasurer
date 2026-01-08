"""Main application entry point."""
from contextlib import asynccontextmanager
import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import config first to validate settings
from app.core.config import settings
settings.validate()

from app.core.queue_manager import queue_manager
from app.routers.ai_router import router as ai_router
from app.routers.transaction_router import router as transaction_router
from app.routers.user_router import router as user_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    
    Handles startup and shutdown tasks.
    """
    # STARTUP: Start background worker
    task = asyncio.create_task(queue_manager.worker())
    print(f"Worker task created: {task}")
    # Give event loop time to schedule task
    await asyncio.sleep(0.1)
    yield
    # SHUTDOWN: Cancel worker task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        print("Worker task cancelled")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
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