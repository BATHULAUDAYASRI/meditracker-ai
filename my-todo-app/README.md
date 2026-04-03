# My Todo App — full stack (works on Windows / Mac / Linux)

## Ports

| Service   | URL                     |
|----------|-------------------------|
| Frontend | **http://localhost:3000** |
| Backend  | http://localhost:5000   |

The React dev server **proxies** `/api` → `http://127.0.0.1:5000`, so the browser only talks to **port 3000** for API calls (no CORS issues during dev).

## One-time setup

From this folder (`my-todo-app`):

```bash
npm run install:all
```

Or:

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

(`npm install` at root also runs `postinstall` to install backend + frontend.)

## Start everything (one command)

```bash
npm run dev
```

You should see console output like:

- `Todo API listening on http://localhost:5000`
- Vite ready on **http://localhost:3000**

Then open **http://localhost:3000** in your browser.

## If you see “This site can’t be reached”

1. Run `npm run dev` from **`my-todo-app`** (not the parent repo folder).
2. Use **http://localhost:3000** (frontend), not a random port.
3. If port 3000 is busy, stop the other app or change `frontend/vite.config.js` `server.port`.
4. If the UI loads but todos fail: check the terminal — backend must show `listening on ...5000`.

## API (direct to backend)

- `GET  http://localhost:5000/api/health`
- `GET  http://localhost:5000/api/todos`
- `POST http://localhost:5000/api/todos` — body: `{ "text": "Buy milk" }`
- `DELETE http://localhost:5000/api/todos/:id`

Data file: `backend/data/todos.json`

## Scripts

| Command              | What it does                          |
|----------------------|----------------------------------------|
| `npm run dev`        | Backend + frontend together           |
| `npm start`          | Same as `npm run dev`                 |
| `npm run install:all`| Install root + backend + frontend deps |
