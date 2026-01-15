from fastapi import APIRouter, HTTPException, Request
from app.services.payos_service import PayOSService
from app.services.transaction_service import TransactionService
from app.services.transaction_entry_service import TransactionEntryService
from app.services.debt_service import DebtService
from app.models.transaction_model import TransactionCreate
from app.models.transaction_entry_model import TransactionEntryCreate
from app.constants import MONTHLY_FEE
from pydantic import BaseModel
from datetime import datetime
import time
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
payos_service = PayOSService()
transaction_service = TransactionService()
transaction_entry_service = TransactionEntryService()
debt_service = DebtService()

class CreatePaymentRequest(BaseModel):
    amount: int
    description: str
    user_id: int

@router.post("/create-link")
async def create_payment(request: CreatePaymentRequest):
    logger.info(f"[CREATE_PAYMENT] Starting payment link creation - user_id: {request.user_id}, amount: {request.amount}, description: {request.description}")
    
    order_code = int(time.time())
    logger.info(f"[CREATE_PAYMENT] Generated order_code: {order_code}")
    
    domain = "http://localhost:3000"
    
    checkout_url = payos_service.create_payment_link(
        order_code=order_code,
        amount=request.amount,
        description=request.description,
        return_url=f"{domain}?status=success",
        cancel_url=f"{domain}?status=cancelled"
    )
    
    if not checkout_url:
        logger.error(f"[CREATE_PAYMENT] Failed to create payment link - order_code: {order_code}")
        raise HTTPException(status_code=500, detail="Không thể tạo link thanh toán")
    
    logger.info(f"[CREATE_PAYMENT] Payment link created successfully - checkout_url: {checkout_url}")
    
    transaction_data = TransactionCreate(
        type="INCOME",
        description=f"{request.description}",
        amount=request.amount,
        user_id=request.user_id,
        order_code=order_code,
        transaction_date=datetime.now().strftime("%Y-%m-%d"),
        status="PENDING"
    )
    
    logger.info(f"[CREATE_PAYMENT] Creating transaction - order_code: {order_code}, user_id: {request.user_id}")
    transaction = transaction_service.create_transaction(transaction_data)
    
    if not transaction:
        logger.error(f"[CREATE_PAYMENT] Failed to create transaction - order_code: {order_code}")
        raise HTTPException(status_code=500, detail="Không thể tạo transaction")
    
    transaction_id = transaction.get("id")
    logger.info(f"[CREATE_PAYMENT] Transaction created successfully - transaction_id: {transaction_id}, order_code: {order_code}")
        
    return {"checkoutUrl": checkout_url, "orderCode": order_code, "transaction_id": transaction_id}

@router.post("/webhook")
async def payos_webhook(request: Request):
    # Use print as backup in case logging isn't configured
    print("[WEBHOOK] ========== WEBHOOK RECEIVED ==========")
    logger.info("[WEBHOOK] Received webhook request")
    
    try:
        # Webhook verification cần raw body (bytes), không phải JSON parsed
        body_bytes = await request.body()
        print(f"[WEBHOOK] Webhook body length: {len(body_bytes)} bytes")
        logger.debug(f"[WEBHOOK] Webhook body length: {len(body_bytes)} bytes")
        
        verified_data = payos_service.verify_webhook_data(body_bytes)
        print(f"[WEBHOOK] Verified webhook data: {verified_data}")
        logger.info(f"[WEBHOOK] Verified webhook data: {verified_data}")
        
        if not verified_data:
            logger.error("[WEBHOOK] Webhook verification failed - Invalid signature or data")
            raise HTTPException(status_code=400, detail="Invalid Webhook")
        
        # verified_data từ payos.webhooks.verify() là object, truy cập bằng attribute hoặc convert sang dict
        if hasattr(verified_data, 'order_code'):
            order_code = verified_data.order_code
        elif hasattr(verified_data, 'orderCode'):
            order_code = verified_data.orderCode
        elif isinstance(verified_data, dict):
            order_code = verified_data.get("orderCode") or verified_data.get("order_code")
        else:
            order_code = None
        
        if not order_code:
            logger.error(f"[WEBHOOK] Missing orderCode in webhook data - verified_data: {verified_data}")
            raise HTTPException(status_code=400, detail="Missing orderCode in webhook data")
        
        # Convert order_code sang int nếu là string
        try:
            order_code = int(order_code)
            print(f"[WEBHOOK] Extracted order_code: {order_code}")
            logger.info(f"[WEBHOOK] Extracted order_code: {order_code}")
        except (ValueError, TypeError) as e:
            logger.error(f"[WEBHOOK] Invalid orderCode format - order_code: {order_code}, error: {e}")
            raise HTTPException(status_code=400, detail="Invalid orderCode format")
        
        # 1. Tìm transaction theo orderCode
        print(f"[WEBHOOK] Looking up transaction by order_code: {order_code}")
        logger.info(f"[WEBHOOK] Looking up transaction by order_code: {order_code}")
        transaction = transaction_service.get_transaction_by_order_code(order_code)
        print(f"[WEBHOOK] Found transaction: {transaction}")
        logger.info(f"[WEBHOOK] Found transaction: {transaction}")
        
        if not transaction:
            logger.error(f"[WEBHOOK] Transaction not found for order_code: {order_code}")
            raise HTTPException(
                status_code=404, 
                detail=f"Transaction not found for orderCode: {order_code}"
            )
        
        transaction_id = transaction.get("id")
        user_id = transaction.get("user_id")
        amount = transaction.get("amount")
        
        print(f"[WEBHOOK] Transaction details - transaction_id: {transaction_id}, user_id: {user_id}, amount: {amount}")
        logger.info(f"[WEBHOOK] Transaction details - transaction_id: {transaction_id}, user_id: {user_id}, amount: {amount}")
        
        if not user_id:
            logger.error(f"[WEBHOOK] Transaction missing user_id - transaction_id: {transaction_id}")
            raise HTTPException(status_code=400, detail="Transaction missing user_id")
        
        logger.info(f"[WEBHOOK] Updating transaction status to COMPLETED - transaction_id: {transaction_id}")
        transaction_update = TransactionCreate(
            type=transaction.get("type", "INCOME"),
            amount=amount,
            user_id=user_id,
            transaction_date=datetime.now().strftime("%Y-%m-%d"),
            status="COMPLETED"
        )
        updated_transaction = transaction_service.update_transaction(transaction_id, transaction_update)
        logger.info(f"[WEBHOOK] Transaction updated: {updated_transaction}")

        if not updated_transaction:
            logger.error(f"[WEBHOOK] Failed to update transaction status - transaction_id: {transaction_id}")
            raise HTTPException(status_code=500, detail="Failed to update transaction status")
        
        # 3. Tạo TransactionEntry cho nhiều tháng
        logger.info(f"[WEBHOOK] Processing transaction entries - amount: {amount}, MONTHLY_FEE: {MONTHLY_FEE}")
        if amount and amount >= MONTHLY_FEE:
            # Lấy tháng hiện tại (YYYY-MM)
            current_date = datetime.now()
            current_month_str = current_date.strftime("%Y-%m")
            current_year, current_month = current_date.year, current_date.month
            logger.info(f"[WEBHOOK] Current date - year: {current_year}, month: {current_month}, current_month_str: {current_month_str}")
            
            # Tìm FUND entry gần nhất của user
            logger.info(f"[WEBHOOK] Finding latest FUND entry for user_id: {user_id}")
            latest_fund_entry_query = transaction_entry_service.client.table("transaction_entries").select("period_month").eq("user_id", user_id).eq("type", "FUND").order("period_month", desc=True).limit(1)
            latest_fund_entry_response = latest_fund_entry_query.execute()
            logger.info(f"[WEBHOOK] Latest FUND entry response: {latest_fund_entry_response.data}")
            
            # Xác định tháng bắt đầu đóng quỹ
            if latest_fund_entry_response.data and len(latest_fund_entry_response.data) > 0:
                latest_period_month = latest_fund_entry_response.data[0].get("period_month")
                logger.info(f"[WEBHOOK] Latest FUND period_month: {latest_period_month}")
                
                if latest_period_month:
                    # Tính tháng tiếp theo của FUND entry gần nhất
                    year, month = latest_period_month.split("-")
                    start_year, start_month = int(year), int(month)
                    logger.info(f"[WEBHOOK] Latest FUND entry - year: {start_year}, month: {start_month}")
                    
                    # Tính tháng tiếp theo
                    if start_month == 12:
                        start_year += 1
                        start_month = 1
                    else:
                        start_month += 1
                    logger.info(f"[WEBHOOK] Starting payment from - year: {start_year}, month: {start_month}")
                else:
                    # Nếu không có period_month, bắt đầu từ tháng 1
                    start_year, start_month = current_year, 1
                    logger.info(f"[WEBHOOK] No period_month in latest entry, starting from month 1 - year: {start_year}, month: {start_month}")
            else:
                # Không có FUND entry nào, bắt đầu từ tháng 1
                start_year, start_month = current_year, 1
                logger.info(f"[WEBHOOK] No FUND entries found, starting from month 1 - year: {start_year}, month: {start_month}")
            
            # Tính số tháng cần đóng từ start_month đến current_month
            remaining_amount = amount
            months_to_pay = []
            
            logger.info(f"[WEBHOOK] Calculating months to pay - start: {start_year}-{start_month:02d}, current: {current_year}-{current_month:02d}, remaining_amount: {remaining_amount}")
            
            # Tạo danh sách các tháng cần đóng
            temp_year, temp_month = start_year, start_month
            while (temp_year < current_year) or (temp_year == current_year and temp_month <= current_month):
                if remaining_amount >= MONTHLY_FEE:
                    month_str = f"{temp_year}-{temp_month:02d}"
                    months_to_pay.append(month_str)
                    remaining_amount -= MONTHLY_FEE
                    logger.info(f"[WEBHOOK] Added month to pay list: {month_str}, remaining_amount: {remaining_amount}")
                    
                    # Tính tháng tiếp theo
                    if temp_month == 12:
                        temp_year += 1
                        temp_month = 1
                    else:
                        temp_month += 1
                else:
                    logger.info(f"[WEBHOOK] Insufficient amount to pay next month - remaining_amount: {remaining_amount}, MONTHLY_FEE: {MONTHLY_FEE}")
                    break
            
            logger.info(f"[WEBHOOK] Total months to pay: {len(months_to_pay)}, months: {months_to_pay}, remaining_amount: {remaining_amount}")
            
            # Tạo FUND entries cho các tháng thiếu
            for period_month in months_to_pay:
                logger.info(f"[WEBHOOK] Creating FUND entry - transaction_id: {transaction_id}, user_id: {user_id}, period_month: {period_month}, amount: {MONTHLY_FEE}")
                transaction_entry_fund_data = TransactionEntryCreate(
                    transaction_id=transaction_id,
                    user_id=user_id,
                    amount=MONTHLY_FEE,
                    type="FUND",
                    period_month=period_month
                )
                created_entry = transaction_entry_service.create_transaction_entry(transaction_entry_fund_data)
                logger.info(f"[WEBHOOK] FUND entry created: {created_entry}")
            
            # Sau khi đóng các tháng thiếu, xử lý phần dư
            if remaining_amount > 0:
                logger.info(f"[WEBHOOK] Processing remaining amount: {remaining_amount}")
                
                logger.info(f"[WEBHOOK] Checking for unpaid debt - user_id: {user_id}")
                debt = debt_service.get_unpaid_debt(user_id)
                logger.info(f"[WEBHOOK] Debt found: {debt}")
                
                if debt and remaining_amount >= debt.get("amount"):
                    debt_amount = debt.get("amount")
                    logger.info(f"[WEBHOOK] Paying debt - debt_id: {debt.get('id')}, debt_amount: {debt_amount}, remaining_amount: {remaining_amount}")
                    
                    # Ưu tiên thanh toán debt
                    transaction_entry_debt_data = TransactionEntryCreate(
                        transaction_id=transaction_id,
                        debt_id=int(debt.get("id")),
                        user_id=user_id,
                        amount=debt_amount,
                        type="DEBT",
                        period_month=current_month_str
                    )
                    created_debt_entry = transaction_entry_service.create_transaction_entry(transaction_entry_debt_data)
                    logger.info(f"[WEBHOOK] DEBT entry created: {created_debt_entry}")
                    
                    # Update debt to fully paid
                    debt_id = debt.get("id")
                    if debt_id:
                        logger.info(f"[WEBHOOK] Updating debt to fully paid - debt_id: {debt_id}")
                        debt_service.update(debt_id, {"is_fully_paid": True})
                        logger.info(f"[WEBHOOK] Debt updated to fully paid")
                    
                    remaining_amount -= debt_amount
                    logger.info(f"[WEBHOOK] Remaining amount after debt payment: {remaining_amount}")
                else:
                    if debt:
                        logger.info(f"[WEBHOOK] Debt exists but insufficient amount - debt_amount: {debt.get('amount')}, remaining_amount: {remaining_amount}")
                    else:
                        logger.info(f"[WEBHOOK] No unpaid debt found")
                
                # Nếu còn dư và >= MONTHLY_FEE, tạo FUND entry cho tháng tiếp theo
                if remaining_amount >= MONTHLY_FEE:
                    # Tính tháng tiếp theo sau current_month
                    if current_month == 12:
                        next_year = current_year + 1
                        next_month = 1
                    else:
                        next_year = current_year
                        next_month = current_month + 1
                    next_period_month = f"{next_year}-{next_month:02d}"
                    
                    logger.info(f"[WEBHOOK] Creating FUND entry for next month - period_month: {next_period_month}, amount: {MONTHLY_FEE}")
                    transaction_entry_fund_data = TransactionEntryCreate(
                        transaction_id=transaction_id,
                        user_id=user_id,
                        amount=MONTHLY_FEE,
                        type="FUND",
                        period_month=next_period_month
                    )
                    created_next_entry = transaction_entry_service.create_transaction_entry(transaction_entry_fund_data)
                    logger.info(f"[WEBHOOK] Next month FUND entry created: {created_next_entry}")
                    
                    remaining_amount -= MONTHLY_FEE
                    logger.info(f"[WEBHOOK] Final remaining amount: {remaining_amount}")
                else:
                    logger.info(f"[WEBHOOK] Remaining amount ({remaining_amount}) is less than MONTHLY_FEE ({MONTHLY_FEE}), no further entries created")
        
        logger.info(f"[WEBHOOK] Payment processing completed successfully - order_code: {order_code}, transaction_id: {transaction_id}")
        print(f"[WEBHOOK] ========== WEBHOOK COMPLETED SUCCESSFULLY ==========")
        return {"success": True, "orderCode": order_code, "transaction_id": transaction_id}
    except Exception as e:
        error_msg = f"[WEBHOOK] ERROR: {str(e)}"
        print(error_msg)
        logger.error(error_msg, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Webhook processing error: {str(e)}")