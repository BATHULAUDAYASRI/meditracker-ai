import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 5000;
const DATA_FILE = path.join(__dirname, "data", "todos.json");

const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    credentials: true,
  })
);
app.use(express.json());

async function readTodos() {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeTodos(todos) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), "utf8");
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, port: PORT });
});

app.get("/api/todos", async (_req, res) => {
  try {
    const todos = await readTodos();
    res.json(todos);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.post("/api/todos", async (req, res) => {
  try {
    const text = String(req.body?.text ?? "").trim();
    if (!text) {
      return res.status(400).json({ error: "text is required" });
    }
    const todos = await readTodos();
    const id = String(Date.now());
    const todo = { id, text, done: false, createdAt: new Date().toISOString() };
    todos.push(todo);
    await writeTodos(todos);
    res.status(201).json(todo);
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.delete("/api/todos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const todos = await readTodos();
    const next = todos.filter((t) => t.id !== id);
    if (next.length === todos.length) {
      return res.status(404).json({ error: "not found" });
    }
    await writeTodos(next);
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: String(e.message) });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`\n  Todo API listening on http://localhost:${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/api/health`);
  console.log(`  Todos:  GET/POST http://localhost:${PORT}/api/todos\n`);
});
