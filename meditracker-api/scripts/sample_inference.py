"""
Sample client flow: register → token → create patient → medication → notification queue.

Run from repo root:
  cd meditracker-api
  pip install -r requirements.txt
  uvicorn app.main:app --port 8080

Then:
  python scripts/sample_inference.py
"""

from __future__ import annotations

import sys
from datetime import datetime, timedelta

import httpx

BASE = "http://127.0.0.1:8080/api/v1"


def main() -> None:
    email = f"demo_{datetime.utcnow().timestamp():.0f}@example.com"
    password = "demo-pass-12345"

    with httpx.Client(timeout=30.0) as client:
        r = client.post(
            f"{BASE}/auth/register",
            json={"email": email, "password": password, "full_name": "Demo User"},
        )
        r.raise_for_status()
        print("Registered:", r.json())

        r = client.post(
            f"{BASE}/auth/token",
            data={"username": email, "password": password},
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        r.raise_for_status()
        token = r.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        r = client.post(
            f"{BASE}/patients",
            json={"display_name": "Parent", "relationship_note": "parent"},
            headers=headers,
        )
        r.raise_for_status()
        pid = r.json()["id"]
        print("Patient id:", pid)

        r = client.post(
            f"{BASE}/patients/{pid}/medications",
            json={"name": "Metformin", "dosage": "500mg", "quantity_remaining": 10, "refill_alert_threshold": 5},
            headers=headers,
        )
        r.raise_for_status()
        mid = r.json()["id"]
        print("Medication id:", mid)

        when = datetime.utcnow() + timedelta(hours=2)
        r = client.post(
            f"{BASE}/patients/{pid}/medications/{mid}/reminders",
            json={"scheduled_at": when.isoformat() + "Z", "priority": 5, "channel": "push"},
            headers=headers,
        )
        r.raise_for_status()
        print("Reminder:", r.json())

        r = client.get(f"{BASE}/notifications/queue", headers=headers)
        r.raise_for_status()
        print("Smart queue:", r.json())

    print("Done.")


if __name__ == "__main__":
    try:
        main()
    except httpx.HTTPError as e:
        print("HTTP error:", e, file=sys.stderr)
        sys.exit(1)
