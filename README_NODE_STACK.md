# MediTrack AI (Node Full-Stack)

## Docker (recommended — one URL, no “site can’t be reached”)

UI and API are served together on **port 8080** (no separate nginx + client container).

1. `copy server\.env.example server\.env` and fill `JWT_SECRET`, `OPENAI_API_KEY`, etc.
2. Run:

```bash
docker compose -f docker-compose.node.yml up --build
```

3. Open **only**: **http://localhost:8080**

- API check: **http://localhost:8080/api/health**
- Do **not** rely on `:5173` or `:5000` for Docker; those were the old split setup.

MongoDB is included; data persists in volume `mongo_data`.

## Local development (two terminals)

1. `cd server` → `npm install` → `npm run dev` → API at **http://localhost:5000**
2. `cd client` → `npm install` → `npm run dev` → UI at **http://localhost:5173** (Vite proxies `/api` → 5000)

## Folders

- `server/` — Express, MongoDB, auth, OpenAI, reminders
- `client/` — React + Tailwind
- `Dockerfile.node` — builds client + copies `dist` into server `static/`

## Implemented APIs

- `GET /api/health`
- `POST /api/auth/register`, `/login`, `/google-mock`, `/google-firebase`
- `PUT /api/auth/onboarding`
- `POST /api/prescriptions/upload`, `GET /api/prescriptions`
- `GET|POST /api/reminders`, `PUT /api/reminders/:id/log`
- `GET /api/pharmacy/nearby` (Google Places if `GOOGLE_MAPS_API_KEY` set)
- `POST /api/chat`
- `GET /api/doctor/overview`, `/api/doctor/patients`

## Firebase / Google Places

See previous sections in this file for `FIREBASE_*` and `GOOGLE_MAPS_API_KEY` in `server/.env`.
