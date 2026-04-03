import { useState } from "react";
import { setReminder } from "../services/api.js";

export default function ReminderModal({ open, onClose, userId, onSaved }) {
  const [medicine, setMedicine] = useState("");
  const [time, setTime] = useState("09:00");
  const [repeat, setRepeat] = useState("daily");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    const name = medicine.trim();
    if (!name) {
      setErr("Enter a medicine name.");
      return;
    }
    const duration_days = repeat === "weekly" ? 84 : 30;
    setBusy(true);
    try {
      await setReminder({
        user_id: userId,
        medicine_name: name,
        time_hhmm: time.length === 5 ? time : `${time}:00`.slice(0, 5),
        duration_days,
        priority: 6,
        enabled: true,
      });
      onSaved?.();
      onClose();
      setMedicine("");
      setTime("09:00");
      setRepeat("daily");
    } catch (ex) {
      setErr(String(ex.message || ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-100 bg-white p-6 shadow-card"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Set Reminder</h2>
            <p className="text-sm text-slate-500">Choose time and repeat pattern.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Medicine</span>
            <input
              value={medicine}
              onChange={(e) => setMedicine(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-slate-800 outline-none ring-brand-500/30 focus:ring-2"
              placeholder="e.g. Paracetamol 500mg"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Time</span>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-slate-800 outline-none ring-brand-500/30 focus:ring-2"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Repeat</span>
            <select
              value={repeat}
              onChange={(e) => setRepeat(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-slate-800 outline-none ring-brand-500/30 focus:ring-2"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly (longer course)</option>
            </select>
          </label>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save reminder"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
