from __future__ import annotations

import math
import random
from typing import Any


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return r * c


def nearby_pharmacies(lat: float | None, lng: float | None, radius_km: float) -> list[dict[str, Any]]:
    # Default location: Bengaluru center (deterministic).
    base_lat = lat if lat is not None else 12.9716
    base_lng = lng if lng is not None else 77.5946

    # Deterministic pseudo RNG based on coordinates.
    seed = int((base_lat * 1000) + (base_lng * 1000)) % 2**31
    rng = random.Random(seed)

    # Candidate pharmacy points in the vicinity.
    candidates = [
        {"id": "ph1", "name": "CityCare Pharmacy", "rating": 4.6, "address": "Main St, Downtown", "phone": "+1-555-0101"},
        {"id": "ph2", "name": "Wellness Rx", "rating": 4.2, "address": "Oak Ave & 3rd", "phone": "+1-555-0102"},
        {"id": "ph3", "name": "HealthPlus Meds", "rating": 4.8, "address": "Market Road, Block B", "phone": "+1-555-0103"},
        {"id": "ph4", "name": "MedStar Pharmacy", "rating": 3.9, "address": "Lake View, Sector 8", "phone": "+1-555-0104"},
    ]

    # Spread them deterministically.
    points = [
        (base_lat + (rng.uniform(-0.02, 0.02)), base_lng + (rng.uniform(-0.02, 0.02))),
        (base_lat + (rng.uniform(-0.03, 0.03)), base_lng + (rng.uniform(-0.03, 0.03))),
        (base_lat + (rng.uniform(-0.01, 0.01)), base_lng + (rng.uniform(-0.01, 0.01))),
        (base_lat + (rng.uniform(-0.04, 0.04)), base_lng + (rng.uniform(-0.04, 0.04))),
    ]

    rows: list[dict[str, Any]] = []
    for c, (plat, plng) in zip(candidates, points):
        d = haversine_km(base_lat, base_lng, plat, plng)
        if d <= radius_km * 2:  # allow some spread
            rows.append(
                {
                    **c,
                    "distance_km": round(d, 2),
                }
            )
    rows.sort(key=lambda x: x["distance_km"])
    return rows

