export default function Dashboard({ reminders, refreshReminders }) {
  const pending = reminders.filter((r) => r.status === "pending" && r.enabled).length;
  const missed = reminders.filter((r) => r.status === "missed").length;
  const taken = reminders.filter((r) => r.status === "taken").length;
  const aboutToFinish = reminders.filter((r) => r.enabled && r.about_to_finish).length;
  const duplicatePairs = reminders.reduce((acc, r) => {
    const key = `${r.medicine_name}|${r.time_hhmm}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const duplicateCount = Object.values(duplicatePairs).filter((n) => n > 1).length;
  const timeline = reminders
    .map((r) => ({
      id: r.id,
      title: `${r.medicine_name} · ${r.time_hhmm}`,
      when: new Date(r.due_at),
      status: r.status,
      enabled: r.enabled,
    }))
    .sort((a, b) => a.when - b.when)
    .slice(0, 8);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Dashboard</h2>
        <button
          onClick={refreshReminders}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 transition text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs text-slate-400">Pending</div>
          <div className="text-2xl font-bold text-amber-300">{pending}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs text-slate-400">Missed</div>
          <div className="text-2xl font-bold text-rose-400">{missed}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs text-slate-400">Taken</div>
          <div className="text-2xl font-bold text-emerald-300">{taken}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs text-slate-400">About to finish</div>
          <div className="text-2xl font-bold text-brand-300">{aboutToFinish}</div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs text-slate-400">Duplicate schedules</div>
          <div className="text-2xl font-bold text-violet-300">{duplicateCount}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="text-sm text-slate-300">
          Tip: Upload a prescription, analyze it, and the app will auto-create reminders and refill alerts.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="text-sm font-medium mb-2">Priority queue preview</div>
        <div className="space-y-2">
          {reminders.slice(0, 5).map((r) => (
            <div
              key={`${r.id}-queue`}
              className="flex items-center justify-between text-xs bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2"
            >
              <span>{r.medicine_name} · {r.time_hhmm}</span>
              <span className="text-slate-400">Priority {r.priority}</span>
            </div>
          ))}
          {!reminders.length ? (
            <div className="text-xs text-slate-400">No reminder queue yet.</div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="text-sm font-medium mb-2">Notification timeline (preset view)</div>
        <div className="space-y-2">
          {timeline.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between text-xs bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className={[
                    "inline-block w-2 h-2 rounded-full",
                    t.status === "taken"
                      ? "bg-emerald-400"
                      : t.status === "missed"
                        ? "bg-rose-400"
                        : "bg-amber-400",
                  ].join(" ")}
                />
                <span>{t.title}</span>
              </div>
              <span className="text-slate-400">
                {t.when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))}
          {!timeline.length ? (
            <div className="text-xs text-slate-400">No notifications yet. Create reminders to populate timeline.</div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

