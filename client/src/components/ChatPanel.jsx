import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ChatPanel() {
  const { user } = useAuth();
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Ask about medications, side effects (general info), or how to use MediTrack.",
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const t = input.trim();
    if (!t || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: t }]);
    setLoading(true);
    try {
      const { data } = await api.post("/chat", { message: t, language });
      setMessages((m) => [...m, { role: "assistant", text: data.reply || "…" }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", text: "Could not reach the assistant. Check OPENAI_API_KEY on the server." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-900">AI assistant</h3>
        <select
          className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-xs"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="te">Telugu</option>
        </select>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto px-2 py-2">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[95%] rounded-xl px-2.5 py-1.5 text-xs leading-relaxed ${
                msg.role === "user" ? "bg-sky-600 text-white" : "bg-slate-100 text-slate-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <p className="text-xs text-slate-500">Thinking…</p>}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-slate-100 p-2">
        <div className="flex gap-1">
          <input
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
            placeholder="Message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            type="button"
            onClick={send}
            disabled={loading}
            className="shrink-0 rounded-lg bg-slate-900 px-2 py-1.5 text-xs text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
