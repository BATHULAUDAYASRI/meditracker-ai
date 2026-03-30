# MediTracker AI — Backend

AI-assisted medication adherence, checkups, report understanding, pharmacy workflows, and mental-health chat (non-clinical). Built for **hackathon / MVP** with a clear path to production (PostgreSQL, real pharmacy APIs, push notifications, ML).

---

## 1. System architecture (high level)

```mermaid
flowchart TB
  subgraph clients["Clients"]
    Mobile["Mobile / Web app"]
  end

  subgraph api["FastAPI (`app.main`)"]
    Auth["Auth JWT"]
    Med["Medications & doses"]
    Rem["Reminders"]
    Appt["Appointments"]
    Rep["Reports + AI extract"]
    Pharm["Pharmacy stub"]
    Chat["Chatbot (OpenAI)"]
    Notif["Smart queue + refill + risk"]
  end

  subgraph data["Data"]
    DB[("SQLite / PostgreSQL")]
  end

  subgraph external["External"]
    OAI["OpenAI API"]
    Push["FCM / APNs (future)"]
    Rx["Pharmacy partner API (future)"]
  end

  Mobile --> Auth
  Mobile --> Med
  Mobile --> Rem
  Mobile --> Appt
  Mobile --> Rep
  Mobile --> Pharm
  Mobile --> Chat
  Mobile --> Notif

  Auth --> DB
  Med --> DB
  Rem --> DB
  Appt --> DB
  Rep --> DB
  Pharm --> DB
  Chat --> DB

  Rep --> OAI
  Chat --> OAI
  Pharm -.-> Rx
  Notif -.-> Push
```

**Design choices**

- **Modular routers** under `app/routers/` — each domain is isolated for testing and scaling out workers later.
- **Service layer** (`app/services/`) — OpenAI calls, PDF text extraction, pharmacy stubs, notification ranking, simple risk heuristic.
- **JWT auth** — stateless API; swap for refresh tokens + OAuth in production.
- **SQLite by default** — zero setup for demos; set `DATABASE_URL` to PostgreSQL when deploying.

---

## 2. Folder structure

```
meditracker-api/
  app/
    main.py              # FastAPI app, CORS, router mount, lifespan (DB create)
    config.py            # OPENAI_API_KEY, API_BASE_URL, MODEL_NAME, DATABASE_URL, SECRET_KEY
    database.py          # Engine, SessionLocal, Base
    deps.py              # get_current_user (Bearer JWT)
    core/security.py     # bcrypt + JWT
    models/              # SQLAlchemy tables
    schemas/             # Pydantic request/response models
    routers/             # API routes
    services/            # OpenAI, reports, pharmacy stub, notifications, prediction
  scripts/
    sample_inference.py  # End-to-end HTTP demo
  requirements.txt
  Dockerfile
  .env.example
  README.md
```

---

## 3. Database schema (summary)

| Table | Purpose |
|-------|---------|
| `users` | Accounts; `chat_subscription_active` gates premium chat |
| `patient_profiles` | Multi-user: family members / patients under one account |
| `medications` | Prescriptions + `quantity_remaining` / `refill_alert_threshold` |
| `reminders` | Scheduled pushes with `priority` (smart ordering) |
| `dose_logs` | Taken / missed / skipped — feeds analytics & risk score |
| `appointments` | Visits; `suggested_next_at` for follow-up (rule-based demo) |
| `medical_reports` | Upload metadata + extracted JSON + AI summary |
| `pharmacy_orders` | Stub orders + status + external ref |
| `chat_messages` | Chat history per `session_id` |

**PostgreSQL:** set `DATABASE_URL=postgresql+psycopg://user:pass@host/db` and run migrations (add Alembic when the schema stabilizes).

---

## 4. API endpoints (base: `/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create user |
| POST | `/auth/token` | OAuth2 form: `username`, `password` → JWT |
| GET | `/patients` | List patients for current user |
| POST | `/patients` | Create patient profile |
| GET | `/patients/{id}/medications` | List medications |
| POST | `/patients/{id}/medications` | Add medication |
| POST | `/patients/{id}/medications/{mid}/reminders` | Schedule reminder |
| POST | `/patients/{id}/medications/{mid}/doses` | Record dose (taken/missed/skipped) |
| GET | `/patients/{id}/appointments` | List appointments |
| POST | `/patients/{id}/appointments` | Create appointment (+ suggested follow-up) |
| GET | `/patients/{id}/reports` | List reports |
| POST | `/patients/{id}/reports/analyze` | Upload PDF/text → AI extraction + stored row |
| POST | `/pharmacy/nearby` | Stub nearby pharmacies |
| POST | `/pharmacy/orders` | Create stub order |
| GET | `/pharmacy/orders` | List orders for your patients |
| POST | `/chat/message` | Chatbot (OpenAI or demo fallback) |
| GET | `/chat/history` | Messages by `session_id` |
| GET | `/notifications/queue` | Priority reminder preview + refill alerts |
| GET | `/notifications/predict/missed-dose/{medication_id}` | Heuristic risk score |
| GET | `/health` | Liveness |

Interactive docs: `http://localhost:8080/docs` (when server is running).

---

## 5. Environment variables

Copy `.env.example` to `.env` and set:

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Chat + report analysis (optional; demo text if empty) |
| `API_BASE_URL` | OpenAI-compatible base URL (default official API) |
| `MODEL_NAME` | e.g. `gpt-4o-mini` |
| `DATABASE_URL` | SQLite default; PostgreSQL in production |
| `SECRET_KEY` | JWT signing secret |
| `CHAT_SUBSCRIPTION_REQUIRED` | `true` to enforce `chat_subscription_active` on user |

---

## 6. Run locally

```bash
cd meditracker-api
python -m venv .venv
.venv\Scripts\activate   # Windows
pip install -r requirements.txt
copy .env.example .env     # edit OPENAI_API_KEY optional
uvicorn app.main:app --reload --port 8080
```

**Sample client (requires server running):**

```bash
python scripts/sample_inference.py
```

Use `TestClient` with a **context manager** so DB tables are created:

```python
from fastapi.testclient import TestClient
from app.main import app

with TestClient(app) as client:
    ...
```

---

## 7. Docker

```bash
docker build -t meditracker-api ./meditracker-api
docker run -p 8080:8080 -e OPENAI_API_KEY=sk-... -v medidata:/app/data meditracker-api
```

Persist SQLite under `/app/data` or point `DATABASE_URL` to PostgreSQL.

---

## 8. AI integration notes

- **Chatbot:** calming, non-diagnostic; escalates emergencies in system prompt. Not a replacement for licensed care.
- **Reports:** returns **informational** summary + extracted fields; always show disclaimer in API responses.
- Without `OPENAI_API_KEY`, services return **safe demo strings** so the hackathon demo still runs.

---

## 9. Optional: IoT & predictive analytics

- **IoT smart pillbox:** ingest events (`opened`, `missed_slot`) via `POST /integrations/pillbox` (future) → join with `dose_logs` to improve adherence models.
- **Missed-dose prediction:** replace `services/prediction.py` heuristic with gradient boosting or sequence model on history + time-of-day + refill gaps.

---

## 10. License / compliance

This MVP is for demonstration. Production deployments require HIPAA/GDPR review, BAAs with vendors, audit logs, and clinician oversight for any clinical content.
