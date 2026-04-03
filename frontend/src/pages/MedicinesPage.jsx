import { useCallback, useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import ReminderModal from "../components/ReminderModal.jsx";
import { getReminders } from "../services/api.js";
import { apiUserId, formatHHMM12 } from "../utils/timeFormat.js";

export default function MedicinesPage({ auth }) {
  const userId = apiUserId(auth);
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Medicines</h1>
        <p className="text-sm text-slate-600">Daily schedule and dose status</p>
      </div>

      {err ? (
        <p className="text-sm text-red-600">Could not load reminders: {err}</p>
      ) : null}

      <Card
        title="Timeline"
        right={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
          >
            + Add
          </button>
        }
      >
        {rows.length === 0 ? (
          <p className="text-sm text-slate-500">No medicines yet. Add a reminder to build your timeline.</p>
        ) : (
          <ul className="relative space-y-0 border-l-2 border-brand-200 pl-6">
            {rows
              .slice()
              .sort((a, b) => a.time_hhmm.localeCompare(b.time_hhmm))
              .map((r) => (
                <li key={r.id} className="relative pb-8 last:pb-0">
                  <span className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-brand-500 shadow" />
                  <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
                    <div className="font-semibold text-slate-900">{r.medicine_name}</div>
                    <div className="mt-1 text-sm text-slate-600">
                      {formatHHMM12(r.time_hhmm)} · Priority {r.priority}
                    </div>
                    <div
                      className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        r.status === "missed"
                          ? "bg-red-100 text-red-800"
                          : r.status === "taken"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {r.status}
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white hover:bg-brand-600 sm:w-auto sm:px-8"
        >
          Set reminder
        </button>
      </Card>

      <ReminderModal open={modalOpen} onClose={() => setModalOpen(false)} userId={userId} onSaved={load} />
    </div>
  );
}
