import { useEffect, useRef, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ChatPage() {
  const { user } = useAuth();
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      role: "assistant",
      text:
        "Hi — I’m your MediTrack assistant. Ask about medication reminders, general wellness, or how to use your prescriptions. I’m not a replacement for a doctor.",
    },
  ]);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: trimmed }]);
    setLoading(true);
    try {
      const { data } = await api.post("/chat", { message: trimmed, language });
      setMessages((m) => [...m, { role: "assistant", text: data.reply || "(No reply)" }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          text: e.response?.data?.error || "Could not reach the chat service. Check API key and network.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">AI health assistant</h2>
          <p className="text-xs text-slate-500">Powered by your server + OpenAI (language: {language})</p>
        </div>
        <select
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="te">Telugu</option>
        </select>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-sky-600 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-sm text-slate-500">Thinking…</div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-100 p-3">
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none ring-sky-500 focus:ring-2"
            placeholder="Type your message…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button
            type="button"
            onClick={send}
            disabled={loading}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-medium text-white disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
