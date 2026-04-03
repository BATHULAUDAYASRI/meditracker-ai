import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import { getReminders } from "../services/api.js";
import { apiUserId, formatHHMM12 } from "../utils/timeFormat.js";

function dotClass(status) {
  if (status === "taken") return "bg-heal-leaf";
  if (status === "missed") return "bg-red-500";
  return "bg-amber-400";
}

export default function RemindersPage({ auth }) {
  const userId = apiUserId(auth);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await getReminders(userId);
      setRows(Array.isArray(r) ? r : []);
      setErr("");
    } catch (e) {
      setErr(String(e.message || e));
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const upcoming = useMemo(
    () => rows.filter((x) => x.status === "pending").sort((a, b) => a.time_hhmm.localeCompare(b.time_hhmm)),
    [rows],
  );

  const weekDays = useMemo(() => {
    const out = [];
    const now = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      out.push(d);
    }
    return out;
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Reminders</h1>
        <p className="text-sm text-slate-600">Calendar overview & upcoming doses</p>
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}

      <Card title="This week">
        <div className="grid grid-cols-7 gap-1 text-center sm:gap-2">
          {weekDays.map((d, i) => (
            <div
              key={i}
              className={`rounded-xl border py-2 text-xs font-medium ${
                i === 0 ? "border-brand-300 bg-brand-50 text-brand-800" : "border-slate-100 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="uppercase text-[10px] opacity-70">
                {d.toLocaleDateString(undefined, { weekday: "short" })}
              </div>
              <div className="text-base font-bold">{d.getDate()}</div>
            </div>
          ))}
        </div>
        <p className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-heal-leaf" /> Done
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-red-500" /> Missed
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Upcoming
          </span>
        </p>
      </Card>

      <Card title="Upcoming doses">
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">No pending doses. Add reminders from Medicines or the dashboard.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 shadow-sm"
              >
                <span className={`h-3 w-3 shrink-0 rounded-full ${dotClass(r.status)}`} />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-900">{r.medicine_name}</div>
                  <div className="text-sm text-slate-500">{formatHHMM12(r.time_hhmm)}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Other events (demo)">
        <ul className="space-y-2 text-sm text-slate-600">
          <li className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span>Doctor appointment</span>
            <span className="font-medium text-slate-800">Apr 12 · 10:00</span>
          </li>
          <li className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
            <span>Annual health checkup</span>
            <span className="font-medium text-slate-800">May 03</span>
          </li>
        </ul>
      </Card>
    </div>
  );
}
