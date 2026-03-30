"""Stubbed pharmacy search + order id generation (swap for partner API in production)."""

import uuid

from app.schemas.pharmacy import PharmacyStub


def nearby_pharmacies(lat: float, lon: float, radius_km: float) -> list[PharmacyStub]:
    """Deterministic fake results for hackathon demos."""
    _ = radius_km
    return [
        PharmacyStub(
            name="CityCare Pharmacy",
            address=f"Near ({lat:.4f}, {lon:.4f}) — Main St",
            distance_km=0.4,
        ),
        PharmacyStub(
            name="Wellness Rx",
            address="Oak Ave & 3rd",
            distance_km=1.1,
        ),
    ]


def create_external_order_ref() -> str:
    return f"PH-{uuid.uuid4().hex[:12].upper()}"
