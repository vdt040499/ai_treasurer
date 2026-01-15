import os
from payos import PayOS
from payos.types import CreatePaymentLinkRequest, ItemData
from dotenv import load_dotenv

load_dotenv()

class PayOSService:
    def __init__(self):
        self.payos = PayOS(
            client_id=os.environ.get("PAYOS_CLIENT_ID"),
            api_key=os.environ.get("PAYOS_API_KEY"),
            checksum_key=os.environ.get("PAYOS_CHECKSUM_KEY")
        )

    def create_payment_link(self, order_code: int, amount: int, description: str, return_url: str, cancel_url: str):
        payment_data = CreatePaymentLinkRequest(
            order_code=order_code,
            amount=amount,
            description=description,
            items=[ItemData(name="Nạp quỹ Team", quantity=1, price=amount)],
            cancel_url=cancel_url,
            return_url=return_url
        )
        try:
            payment_link = self.payos.payment_requests.create(payment_data)
            return payment_link.checkout_url
        except Exception as e:
            print(f"Error creating payment link: {e}")
            return None

    def verify_webhook_data(self, webhook_body, headers=None):
        try:
            # PayOS sử dụng Svix, cần verify với headers
            # Nếu có headers, dùng verify với headers
            if headers:
                return self.payos.webhooks.verify(webhook_body, headers)
            else:
                # Fallback: thử verify không cần headers (có thể SDK tự động lấy)
                return self.payos.webhooks.verify(webhook_body)
        except Exception as e:
            print(f"Error verifying webhook: {e}")
            import traceback
            traceback.print_exc()
            return None