"""Main application entry point."""
from contextlib import asynccontextmanager
import asyncio
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Import config first to validate settings
from app.core.config import settings
settings.validate()

# from app.core.queue_manager import queue_manager
from app.routers.ai_router import router as ai_router
from app.routers.transaction_router import router as transaction_router
from app.routers.user_router import router as user_router
from app.routers.debt_router import router as debt_router
from app.routers.payment_router import router as payment_router

# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     """
#     Application lifespan manager.
    
#     Handles startup and shutdown tasks.
#     """
#     task = asyncio.create_task(queue_manager.worker())
#     print(f"Worker task created: {task}")
#     await asyncio.sleep(0.1)
#     yield
#     task.cancel()
#     try:
#         await task
#     except asyncio.CancelledError:
#         print("Worker task cancelled")

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    # lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger = logging.getLogger(__name__)
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response: {request.method} {request.url.path} - Status: {response.status_code}")
    return response

app.include_router(ai_router, prefix="/api", tags=["AI"])
app.include_router(transaction_router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(user_router, prefix="/api/users", tags=["Users"])
app.include_router(debt_router, prefix="/api/debts", tags=["Debts"])
app.include_router(payment_router, prefix="/api/payments", tags=["Payments"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)