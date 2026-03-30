import { useEffect, useRef, useState } from "react";
import { chat, chatHistory } from "../services/api.js";

const USER_ID = "demo_user";
const STARTER_PROMPTS = [
  "I feel anxious and my heart is racing. Help me calm down.",
  "I missed my evening tablet. What should I do next?",
  "Can you help me set a routine for 8 AM and 8 PM medicines?",
];

export default function Chatbot({ pushToast }) {
  const [sessionId] = useState("default");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const rows = await chatHistory({ session_id: sessionId, user_id: USER_ID });
        if (!alive) return;
        setMessages(rows);
      } catch (e) {
        pushToast?.("error", e?.message || "Failed to load chat history");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || busy) return;
    setText("");
    setBusy(true);

    const userRow = {
      role: "user",
      content: msg,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userRow]);
    try {
      const r = await chat({ message: msg, session_id: sessionId, user_id: USER_ID });
      const botRow = {
        role: "assistant",
        content: r.reply,
        created_at: new Date().toISOString(),
        disclaimer: r.disclaimer,
      };
      setMessages((prev) => [...prev, botRow]);
    } catch (e) {
      pushToast?.("error", e?.message || "Chat failed");
    } finally {
      setBusy(false);
    }
  };

  const seedConversation = async () => {
    if (busy || seeding) return;
    setSeeding(true);
    try {
      for (const p of STARTER_PROMPTS.slice(0, 2)) {
        const userRow = {
          role: "user",
          content: p,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userRow]);
        const r = await chat({ message: p, session_id: sessionId, user_id: USER_ID });
        const botRow = {
          role: "assistant",
          content: r.reply,
          created_at: new Date().toISOString(),
          disclaimer: r.disclaimer,
        };
        setMessages((prev) => [...prev, botRow]);
      }
      pushToast?.("success", "Starter conversation added.");
    } catch (e) {
      pushToast?.("error", e?.message || "Failed to seed starter conversation");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Chatbot</h2>
        <div className="text-sm text-slate-400">
          Calm, helpful suggestions (non-diagnostic).
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="mb-3 flex flex-wrap gap-2">
          {STARTER_PROMPTS.map((p) => (
            <button
              key={p}
              className="text-xs px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700/60"
              onClick={() => setText(p)}
              disabled={busy}
            >
              {p}
            </button>
          ))}
          <button
            className="text-xs px-3 py-2 rounded-xl border border-brand-700 bg-brand-900/40 hover:bg-brand-900/60 disabled:opacity-50"
            onClick={seedConversation}
            disabled={busy || seeding}
          >
            {seeding ? "Adding..." : "Seed starter chat history"}
          </button>
        </div>

        <div className="h-[60vh] overflow-auto pr-2 space-y-3">
          {messages.length ? null : (
            <div className="text-sm text-slate-300">
              Start a conversation. Example: “I’m panicking because I missed my medication.”
            </div>
          )}
          {messages.map((m, idx) => (
            <div
              key={`${m.created_at}-${idx}`}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={[
                  "max-w-[80%] rounded-2xl border px-4 py-3 whitespace-pre-wrap text-sm",
                  m.role === "user"
                    ? "bg-brand-900 border-brand-800"
                    : "bg-slate-950/40 border-slate-800",
                ].join(" ")}
              >
                <div className="text-xs text-slate-400 mb-1">
                  {m.role === "user" ? "You" : "Assistant"}
                </div>
                <div>{m.content}</div>
                {m.disclaimer ? (
                  <div className="text-[11px] text-slate-400 mt-2">{m.disclaimer}</div>
                ) : null}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-600"
            placeholder="Type symptoms or anxiety messages..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            disabled={busy}
          />
          <button
          className="px-4 py-2 rounded-xl bg-brand-900 border border-brand-800 hover:bg-brand-900 transition text-sm disabled:opacity-50"
            onClick={send}
            disabled={busy}
          >
            {busy ? "Sending..." : "Send"}
          </button>
        </div>
      </div>
    </section>
  );
}

