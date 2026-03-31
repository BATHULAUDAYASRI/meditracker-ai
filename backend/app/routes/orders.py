from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter

from app.models.schemas import OrderMedicineOut, OrderMedicineRequest

router = APIRouter(tags=["orders"])
UTC = timezone.utc


@router.post("/order-medicine", response_model=OrderMedicineOut)
def order_medicine(body: OrderMedicineRequest) -> OrderMedicineOut:
    now = datetime.now(tz=UTC)
    eta = now + timedelta(hours=2 if body.refill else 4)
    return OrderMedicineOut(
        order_id=str(uuid4()),
        status="confirmed",
        medication_name=body.medication_name,
        pharmacy_id=body.pharmacy_id,
        quantity=body.quantity,
        refill=body.refill,
        created_at=now,
        estimated_delivery=eta.strftime("%Y-%m-%d %H:%M UTC"),
    )

