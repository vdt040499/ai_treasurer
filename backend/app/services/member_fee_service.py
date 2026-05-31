"""Member fee schedule service."""
from typing import Any, Dict, List, Optional
import logging

from app.constants import MONTHLY_FEE
from app.services.base_service import BaseService


logger = logging.getLogger(__name__)


class MemberFeeService(BaseService):
    """Resolve monthly fund fees from member fee schedules."""

    def __init__(self):
        super().__init__(table_name="member_fee_schedules")

    def get_fee_schedules(self, user_ids: Optional[List[int]] = None) -> List[Dict[str, Any]]:
        query = self.client.table(self.table_name).select("*")

        if user_ids:
            query = query.in_("user_id", user_ids)

        try:
            response = query.order("effective_from_month", desc=True).execute()
            return response.data
        except Exception as exc:
            logger.warning("Failed to load member fee schedules, using default fee: %s", exc)
            return []

    def get_monthly_fee(
        self,
        user_id: int,
        period_month: str,
        schedules: Optional[List[Dict[str, Any]]] = None,
    ) -> int:
        if not user_id or not period_month:
            return MONTHLY_FEE

        candidate_schedules = schedules
        if candidate_schedules is None:
            candidate_schedules = self.get_fee_schedules([user_id])

        user_schedules = [
            schedule for schedule in candidate_schedules
            if schedule.get("user_id") == user_id
            and schedule.get("effective_from_month")
            and schedule.get("effective_from_month") <= period_month
            and (
                not schedule.get("effective_to_month")
                or schedule.get("effective_to_month") >= period_month
            )
        ]

        if not user_schedules:
            return MONTHLY_FEE

        user_schedules.sort(
            key=lambda schedule: (
                schedule.get("effective_from_month") or "",
                schedule.get("created_at") or "",
                schedule.get("id") or 0,
            ),
            reverse=True,
        )
        monthly_fee = user_schedules[0].get("monthly_fee")
        return int(monthly_fee) if monthly_fee is not None else MONTHLY_FEE

    def get_first_effective_month(
        self,
        user_id: int,
        schedules: Optional[List[Dict[str, Any]]] = None,
    ) -> Optional[str]:
        candidate_schedules = schedules
        if candidate_schedules is None:
            candidate_schedules = self.get_fee_schedules([user_id])

        user_months = [
            schedule.get("effective_from_month")
            for schedule in candidate_schedules
            if schedule.get("user_id") == user_id and schedule.get("effective_from_month")
        ]
        return min(user_months) if user_months else None
