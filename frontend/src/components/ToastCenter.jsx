import { useMemo } from "react";

export default function ToastCenter({ toasts, onDismiss }) {
  const sorted = useMemo(() => {
    return [...toasts].sort((a, b) => b.createdAt - a.createdAt);
  }, [toasts]);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-[320px] max-w-[90vw]">
      {sorted.map((t) => (
        <div
          key={t.id}
          className={[
            "rounded-2xl border shadow-lg p-3",
            t.kind === "success"
              ? "bg-emerald-950/80 border-emerald-800"
              : t.kind === "error"
                ? "bg-rose-950/80 border-rose-800"
                : t.kind === "warning"
                  ? "bg-amber-950/80 border-amber-800"
                  : "bg-slate-900/80 border-slate-700",
          ].join(" ")}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold">
                {t.kind === "success"
                  ? "Success"
                  : t.kind === "error"
                    ? "Error"
                    : t.kind === "warning"
                      ? "Warning"
                      : "Info"}
              </div>
              <div className="text-sm text-slate-200/90 mt-1">{t.message}</div>
            </div>
            <button
              className="text-slate-300 hover:text-white text-xs px-2 py-1 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-900/30"
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss toast"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

