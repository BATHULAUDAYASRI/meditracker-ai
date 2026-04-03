import { useEffect, useState } from "react";
import api from "../services/api";
import { randomEncouragement } from "../utils/encourage";

const SLOTS = [
  { value: "", label: "Auto from time" },
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
  { value: "night", label: "Night" },
];

export default function RemindersPage() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    medicineName: "",
    dosage: "",
    scheduleTime: "09:00",
    timeSlot: "morning",
  });

  const load = async () => {
    const { data } = await api.get("/reminders");
    setReminders(data.reminders || []);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await load();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const addReminder = async (e) => {
    e.preventDefault();
    if (!form.medicineName.trim()) return;
    await api.post("/reminders", {
      medicineName: form.medicineName.trim(),
      dosage: form.dosage.trim(),
      scheduleTime: form.scheduleTime,
      timeSlot: form.timeSlot || "",
      scheduleLabel: "custom",
      enabled: true,
    });
    setForm({ ...form, medicineName: "", dosage: "" });
    await load();
    setMsg("Reminder added.");
    setTimeout(() => setMsg(""), 2500);
  };

  const logAdherence = async (id, status) => {
    await api.put(`/reminders/${id}/log`, { status });
    await load();
    if (status === "taken") {
      setMsg(randomEncouragement());
      setTimeout(() => setMsg(""), 4000);
    }
  };

  const markTodayDone = async () => {
    await api.post("/reminders/mark-today-done");
    await load();
    setMsg(randomEncouragement() + " — all logged for today.");
    setTimeout(() => setMsg(""), 4000);
  };

  const sorted = [...reminders].sort((a, b) => String(a.scheduleTime).localeCompare(String(b.scheduleTime)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Daily medications &amp; reminders</h1>
        <p className="text-sm text-slate-500">Set times and slots; mark doses to track consistency on the dashboard.</p>
      </div>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{msg}</div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Add a reminder</h2>
        <form onSubmit={addReminder} className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Medicine name"
            value={form.medicineName}
            onChange={(e) => setForm({ ...form, medicineName: e.target.value })}
            required
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Dosage (e.g. 1 tablet)"
            value={form.dosage}
            onChange={(e) => setForm({ ...form, dosage: e.target.value })}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            type="time"
            value={form.scheduleTime}
            onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })}
          />
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={form.timeSlot}
            onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
          >
            {SLOTS.filter((s) => s.value !== "").map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white">
            Save reminder
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-900">Your schedule</h2>
          <button
            type="button"
            onClick={markTodayDone}
            disabled={loading || reminders.filter((r) => r.enabled).length === 0}
            className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
          >
            Done with today&apos;s medicines
          </button>
        </div>
        {loading ? (
          <p className="mt-3 text-sm text-slate-500">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No reminders yet. Add one above or upload a prescription.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {sorted.map((r) => (
              <li
                key={r._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-900">{r.medicineName}</div>
                  <div className="text-slate-500">
                    {[r.dosage, r.scheduleTime, r.timeSlot].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg bg-emerald-600 px-2 py-1 text-xs text-white"
                    onClick={() => logAdherence(r._id, "taken")}
                  >
                    Taken
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-slate-200 px-2 py-1 text-xs text-slate-800"
                    onClick={() => logAdherence(r._id, "missed")}
                  >
                    Missed
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
