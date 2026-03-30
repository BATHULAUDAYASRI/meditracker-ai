import { useMemo, useState } from "react";
import { recordDose, toggleReminder } from "../services/api.js";

function StatusPill({ status }) {
  const cls =
    status === "taken"
      ? "bg-emerald-950/60 border-emerald-800 text-emerald-200"
      : status === "missed"
        ? "bg-rose-950/60 border-rose-800 text-rose-200"
        : "bg-amber-950/60 border-amber-800 text-amber-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-lg border text-xs ${cls}`}
    >
      {status}
    </span>
  );
}

export default function Reminders({
  reminders,
  refreshReminders,
  pushToast,
}) {
  const [busy, setBusy] = useState(null);

  const total = reminders.length;
  const enabledCount = useMemo(
    () => reminders.filter((r) => r.enabled).length,
    [reminders]
  );
  const duplicateSetups = useMemo(() => {
    const map = {};
    for (const r of reminders) {
      const key = `${r.medicine_name}|${r.time_hhmm}`;
      map[key] = (map[key] || 0) + 1;
    }
    return Object.entries(map).filter(([, n]) => n > 1);
  }, [reminders]);

  const markDose = async (r, status) => {
    setBusy(`${r.id}-${status}`);
    try {
      await recordDose(
        r.id,
        new Date(r.due_at).toISOString(),
        status
      );
      pushToast?.(
        "success",
        `Marked ${status}: ${r.medicine_name} at ${r.time_hhmm}`
      );
      await refreshReminders();
    } catch (e) {
      pushToast?.("error", e?.message || "Failed to record dose");
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (r) => {
    setBusy(`toggle-${r.id}`);
    try {
      await toggleReminder(r.id, !r.enabled);
      pushToast?.(
        "success",
        `${r.enabled ? "Disabled" : "Enabled"} reminder: ${r.medicine_name}`
      );
      await refreshReminders();
    } catch (e) {
      pushToast?.("error", e?.message || "Toggle failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Reminders</h2>
        <div className="text-sm text-slate-400">
          {enabledCount} enabled · {total} total
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <button
          onClick={refreshReminders}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 transition text-sm"
        >
          Refresh reminder status
        </button>
      </div>

      {!reminders.length ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-300">
          No reminders yet. Upload and analyze a prescription first.
        </div>
      ) : null}

      {!!duplicateSetups.length ? (
        <div className="rounded-2xl border border-violet-800/50 bg-violet-950/20 p-4">
          <div className="text-sm font-medium text-violet-200">Duplicate reminder setups detected</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {duplicateSetups.map(([k, n]) => (
              <span
                key={k}
                className="text-xs px-2 py-1 rounded-lg border border-violet-800 text-violet-200"
              >
                {k.replace("|", " @ ")} · {n} copies
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {reminders.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{r.medicine_name}</div>
                <div className="text-sm text-slate-300 mt-1">
                  Time:{" "}
                  <span className="text-slate-100 font-medium">
                    {r.time_hhmm}
                  </span>
                  {" · "}Due at:{" "}
                  <span className="text-slate-100 font-medium">
                    {new Date(r.due_at).toLocaleString()}
                  </span>
                </div>
                {r.about_to_finish ? (
                  <div className="text-xs mt-2 text-amber-200">
                    About to finish (refill soon)
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col items-end gap-2">
                <StatusPill status={r.status} />
                <label className="flex items-center gap-2 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    checked={r.enabled}
                    onChange={() => toggle(r)}
                    disabled={busy === `toggle-${r.id}`}
                  />
                  Enabled
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-4">
              <button
                className="px-3 py-2 rounded-xl bg-emerald-950/50 border border-emerald-800 hover:bg-emerald-950 text-xs disabled:opacity-50"
                onClick={() => markDose(r, "taken")}
                disabled={busy === `${r.id}-taken`}
              >
                {busy === `${r.id}-taken` ? "Saving..." : "Mark taken"}
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-rose-950/50 border border-rose-800 hover:bg-rose-950 text-xs disabled:opacity-50"
                onClick={() => markDose(r, "missed")}
                disabled={busy === `${r.id}-missed`}
              >
                {busy === `${r.id}-missed` ? "Saving..." : "Mark missed"}
              </button>

              <div className="ml-auto text-xs text-slate-400">
                Priority:{" "}
                <span className="text-slate-200">{r.priority}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

