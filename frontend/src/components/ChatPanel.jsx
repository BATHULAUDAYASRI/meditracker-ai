import { useEffect, useRef, useState } from "react";
import { chat, chatHistory } from "../services/api.js";

export default function ChatPanel({
  userId,
  displayName = "there",
  className = "",
  showHeader = true,
  compact = false,
}) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const hist = await chatHistory({ user_id: userId, session_id: "default" });
        if (cancelled) return;
        const raw = Array.isArray(hist) ? hist : [];
        const mapped = raw
          .filter((m) => m && typeof m === "object")
          .map((m) => ({ role: String(m.role ?? "assistant"), content: String(m.content ?? "") }));
        if (!mapped.length) {
          setMsgs([
            {
              role: "assistant",
              content: `Hi ${displayName}! How can I assist you today?`,
            },
          ]);
        } else {
          setMsgs(mapped);
        }
      } catch {
        if (!cancelled) {
          setMsgs([
            {
              role: "assistant",
              content: `Hi ${displayName}! How can I assist you today?`,
            },
          ]);
        }
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, displayName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || loading || !hydrated) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await chat({ user_id: userId, session_id: "default", message: text });
      setMsgs((m) => [...m, { role: "assistant", content: res.reply }]);
    } catch (ex) {
      setMsgs((m) => [
        ...m,
        { role: "assistant", content: `Sorry, something went wrong: ${String(ex.message || ex)}` },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card-sm ${className}`}
    >
      {showHeader ? (
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-lg">
              💬
            </span>
            <div>
              <div className="font-semibold text-slate-800">MediTrack AI Chat</div>
              <div className="text-xs text-slate-500">Health assistant</div>
            </div>
          </div>
          <button
            type="button"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50"
            aria-label="Menu"
          >
            ⋯
          </button>
        </div>
      ) : null}

      <div
        className={`flex-1 space-y-3 overflow-y-auto bg-slate-50/60 p-4 ${compact ? "min-h-[260px] max-h-[320px]" : "min-h-[360px] max-h-[520px]"}`}
      >
        {msgs.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md bg-brand-500 px-4 py-2.5 text-sm text-white shadow-sm">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm shadow-sm">
                🤖
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-white px-4 py-2.5 text-sm text-slate-700 shadow-sm">
                {m.content}
              </div>
            </div>
          ),
        )}
        {loading ? (
          <div className="flex gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-sm shadow-sm">
              …
            </div>
            <div className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">
              Thinking…
            </div>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 bg-white p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 outline-none ring-brand-500/20 focus:ring-2"
        />
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-600 hover:bg-brand-200"
          aria-label="Voice (demo)"
        >
          🎤
        </button>
        <button
          type="submit"
          disabled={loading || !hydrated}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white shadow-sm hover:bg-brand-600 disabled:opacity-50"
          aria-label="Send"
        >
          ➤
        </button>
      </form>
      <p className="px-3 pb-2 text-center text-[10px] text-slate-400">
        Informational only. Not medical advice.
      </p>
    </div>
  );
}
