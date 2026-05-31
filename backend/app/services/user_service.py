"""User service for business logic."""
from datetime import datetime
from typing import List, Dict, Any, Optional
from app.services.base_service import BaseService
from app.models import UserCreate
from app.services.member_fee_service import MemberFeeService


class UserService(BaseService):
    """Service for user operations."""
    
    def __init__(self):
        super().__init__(table_name="users")
        self.member_fee_service = MemberFeeService()

    def _get_months_between(self, start_month: str, end_month: str) -> List[str]:
        start_year, start_month_number = [int(part) for part in start_month.split("-")]
        end_year, end_month_number = [int(part) for part in end_month.split("-")]
        months = []

        while (start_year < end_year) or (start_year == end_year and start_month_number <= end_month_number):
            months.append(f"{start_year}-{start_month_number:02d}")
            if start_month_number == 12:
                start_year += 1
                start_month_number = 1
            else:
                start_month_number += 1

        return months

    def get_all_member_names(self) -> str:
        """
        Get all active member names as comma-separated string.
        
        Returns:
            Comma-separated string of member names
        """
        try:
            response = self.client.table(self.table_name).select("name", "id").execute()
            print('response: ', response.data)
            names = [{ "id": user['id'], "name": user['name'] } for user in response.data]
            return "[" + ", ".join([f"{{'id': {user['id']}, 'name': '{user['name']}'}}" for user in names]) + "]"
        except Exception:
            return ""

    def get_users(self) -> List[Dict[str, Any]]:
        """
        Get all users ordered by creation date.
        
        Returns:
            List of users
        """
        return self.get_all(order_by="id", desc=False, filters={"active": True})

    def create_user(self, user: UserCreate) -> Optional[Dict[str, Any]]:
        """
        Create a new user.
        
        Args:
            user: User data
            
        Returns:
            Created user or None
        """
        return self.create(user.model_dump())

    def get_users_with_contributions(self, year: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Get all users with their INCOME transaction contributions.
        Format: { id, name, avatar: '', joinedDate: YYYY-MM, contributions: [YYYY-MM, ...] }
        
        Args:
            year: Optional year to filter transactions (e.g., 2024). If None, returns all transactions.
        
        Returns:
            List of users with contributions formatted for frontend
        """
        # Get all users
        users = self.get_users()

        now = datetime.now()
        target_year = year or now.year
        end_month = now.month if target_year == now.year else 12
        end_period_month = f"{target_year}-{end_month:02d}"

        # Get all transaction entries in one query - both FUND and DEBT_PAYMENT types
        transaction_entry_service = self.client.table("transaction_entries")
        query = transaction_entry_service.select("*").in_("type", ["FUND", "DEBT_PAYMENT", "DEBT", "EXEMPT"])
        query = query.ilike("period_month", f"{target_year}%")
        all_transaction_entries = query.execute()

        # Get all unpaid debts in one query
        debt_service = self.client.table("debts")
        query = debt_service.select("*").eq("is_fully_paid", False)
        debt_entries = query.execute()
    
        # Create a dictionary for O(1) debt lookup by user_id
        debt_by_user: Dict[int, Dict[str, Any]] = {}
        for debt in debt_entries.data:
            user_id = debt.get('user_id')
            if user_id:
                debt_by_user[user_id] = debt
    
        user_ids = [user.get("id") for user in users if user.get("id")]
        fee_schedules = self.member_fee_service.get_fee_schedules(user_ids)

        # Group transactions by user_id and type
        total_user_amount: Dict[int, Dict[str, Any]] = {}
        print(all_transaction_entries.data)
        for tx in all_transaction_entries.data:
            user_id = tx.get('user_id')
            tx_type = tx.get('type')
            
            if user_id not in total_user_amount:
                total_user_amount[user_id] = {
                    "fund_by_month": {},
                    "exempt_months": []
                }

            amount = tx.get('amount', 0)
            period_month = tx.get('period_month')
            if tx_type == "FUND":
                if period_month:
                    fund_by_month = total_user_amount[user_id]["fund_by_month"]
                    fund_by_month[period_month] = fund_by_month.get(period_month, 0) + amount
            elif tx_type == "EXEMPT":
                if period_month:
                    total_user_amount[user_id]["exempt_months"].append(period_month)
        
        result = []
        for user in users:
            user_id = user.get('id')
            created_at = user.get('created_at', '')
            avatar = user.get('avatar', '')
            
            joined_date = created_at[:7] if created_at else ''
            
            # Get user's transaction totals, default to 0 if no transactions
            user_totals = total_user_amount.get(user_id, {
                "fund_by_month": {},
                "exempt_months": []
            })
            fund_by_month = user_totals.get("fund_by_month", {})
            exempts = sorted(user_totals.get("exempt_months", []))

            start_candidates = [f"{target_year}-01"]
            first_fee_month = self.member_fee_service.get_first_effective_month(user_id, fee_schedules)
            if first_fee_month:
                start_candidates.append(first_fee_month)

            start_period_month = max(start_candidates)
            obligation_months = []
            if start_period_month <= end_period_month:
                obligation_months = self._get_months_between(start_period_month, end_period_month)

            contributions = []
            fund_shortfall = 0
            fee_by_month = {}
            exempt_months = set(exempts)
            for period_month in obligation_months:
                monthly_fee = self.member_fee_service.get_monthly_fee(user_id, period_month, fee_schedules)
                fee_by_month[period_month] = monthly_fee

                if period_month in exempt_months:
                    continue

                paid_amount = fund_by_month.get(period_month, 0)
                if paid_amount >= monthly_fee:
                    contributions.append(period_month)
                else:
                    fund_shortfall += monthly_fee - paid_amount
            
            # O(1) lookup for debt entry
            debt_entry = debt_by_user.get(user_id)
            debt_total = debt_entry.get('amount', 0) if debt_entry else 0
            debt_description = debt_entry.get('description', '') if debt_entry else ''

            debt_amount = -(fund_shortfall + debt_total)

            # Admin debt is 0
            if (user_id == 9 or debt_amount > 0):
                debt_amount = 0

            result.append({
                'id': str(user_id),
                'name': user.get('name', ''),
                'avatar': avatar,
                'created_at': joined_date,
                'contributions': contributions,
                'exempts': exempts,
                'monthly_fee': self.member_fee_service.get_monthly_fee(user_id, end_period_month, fee_schedules),
                'fee_by_month': fee_by_month,
                'debt_amount': debt_amount,
                'debt_description': debt_description
            })
        
        return result
