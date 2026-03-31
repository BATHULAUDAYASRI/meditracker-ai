from __future__ import annotations

import math
import random


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return r * (2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)))


def nearby_pharmacies(lat: float | None, lng: float | None, radius_km: float) -> list[dict]:
    base_lat = lat if lat is not None else 12.9716
    base_lng = lng if lng is not None else 77.5946
    rng = random.Random(int(base_lat * 1000 + base_lng * 1000))
    base = [
        {"id": "ph1", "name": "CityCare Pharmacy", "rating": 4.6, "address": "Main St, Downtown", "phone": "+1-555-0101"},
        {"id": "ph2", "name": "Wellness Rx", "rating": 4.2, "address": "Oak Ave & 3rd", "phone": "+1-555-0102"},
        {"id": "ph3", "name": "HealthPlus Meds", "rating": 4.8, "address": "Market Road, Block B", "phone": "+1-555-0103"},
        {"id": "ph4", "name": "MedStar Pharmacy", "rating": 3.9, "address": "Lake View, Sector 8", "phone": "+1-555-0104"},
    ]
    out = []
    for b in base:
        lat2 = base_lat + rng.uniform(-0.02, 0.02)
        lng2 = base_lng + rng.uniform(-0.02, 0.02)
        d = round(_haversine_km(base_lat, base_lng, lat2, lng2), 2)
        if d <= radius_km * 2:
            out.append({**b, "distance_km": d})
    out.sort(key=lambda x: x["distance_km"])
    return out

