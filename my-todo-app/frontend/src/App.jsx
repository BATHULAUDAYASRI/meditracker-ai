import { useCallback, useEffect, useState } from "react";

/** Same-origin /api → Vite proxies to http://127.0.0.1:5000 */
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (res.status === 204) return null;
  const text = await res.text();
  if (!res.ok) {
    let err = text;
    try {
      err = JSON.parse(text).error || text;
    } catch {
      /* ignore */
    }
    throw new Error(err || res.statusText);
  }
  return text ? JSON.parse(text) : null;
}

export default function App() {
  const [todos, setTodos] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [backendOk, setBackendOk] = useState(false);

  const load = useCallback(async () => {
    setError("");
    try {
      const data = await api("/api/todos");
      setTodos(Array.isArray(data) ? data : []);
      setBackendOk(true);
    } catch (e) {
      setError(e.message || "Cannot reach API. Is the backend running on port 5000?");
      setBackendOk(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    setError("");
    try {
      const created = await api("/api/todos", {
        method: "POST",
        body: JSON.stringify({ text: t }),
      });
      setText("");
      setTodos((prev) => [...prev, created]);
    } catch (e) {
      setError(e.message);
    }
  };

  const remove = async (id) => {
    setError("");
    try {
      await api(`/api/todos/${id}`, { method: "DELETE" });
      setTodos((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div style={{ maxWidth: 520, margin: "0 auto", padding: "2rem 1rem" }}>
      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem" }}>Todo list</h1>
      <p style={{ margin: "0 0 1.25rem", color: "#94a3b8", fontSize: "0.9rem" }}>
        React on <strong>localhost:3000</strong> · API proxied to Express on <strong>localhost:5000</strong>
      </p>

      {backendOk && (
        <p style={{ color: "#4ade80", fontSize: "0.85rem", marginBottom: "1rem" }}>Connected to backend</p>
      )}

      {error && (
        <div
          style={{
            background: "#7f1d1d",
            color: "#fecaca",
            padding: "0.75rem 1rem",
            borderRadius: 8,
            marginBottom: "1rem",
            fontSize: "0.9rem",
          }}
        >
          {error}
        </div>
      )}

      <form onSubmit={add} style={{ display: "flex", gap: 8, marginBottom: "1.5rem" }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="New todo…"
          style={{
            flex: 1,
            padding: "0.65rem 0.85rem",
            borderRadius: 8,
            border: "1px solid #334155",
            background: "#1e293b",
            color: "#f1f5f9",
            fontSize: "1rem",
          }}
        />
        <button
          type="submit"
          style={{
            padding: "0.65rem 1.1rem",
            borderRadius: 8,
            border: "none",
            background: "#3b82f6",
            color: "#fff",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </form>

      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading todos…</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {todos.length === 0 && <li style={{ color: "#64748b" }}>No todos yet. Add one above.</li>}
          {todos.map((todo) => (
            <li
              key={todo.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "0.75rem 0",
                borderBottom: "1px solid #334155",
              }}
            >
              <span>{todo.text}</span>
              <button
                type="button"
                onClick={() => remove(todo.id)}
                style={{
                  padding: "0.35rem 0.65rem",
                  borderRadius: 6,
                  border: "none",
                  background: "#ef4444",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
