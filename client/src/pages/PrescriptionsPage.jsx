import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function formatDate(d) {
  if (!d) return "Unknown date";
  try {
    return new Date(d).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(d);
  }
}

export default function PrescriptionsPage() {
  const { user } = useAuth();
  const [rawText, setRawText] = useState("Tab Dolo 650 - 1 tablet - 08:00 - 5 days");
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState(user?.preferredLanguage || "en");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);

  const refresh = async () => {
    const { data } = await api.get("/prescriptions");
    setPrescriptions(data.prescriptions || []);
  };

  useEffect(() => {
    refresh();
  }, []);

  const byDate = useMemo(() => {
    const list = [...prescriptions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const groups = new Map();
    for (const pr of list) {
      const key = new Date(pr.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(pr);
    }
    return Array.from(groups.entries());
  }, [prescriptions]);

  const uploadPrescription = async () => {
    setBusy(true);
    try {
      const form = new FormData();
      form.append("rawText", rawText);
      form.append("language", language);
      if (file) {
        form.append("file", file);
      } else {
        const blob = new Blob([rawText], { type: "text/plain" });
        form.append("file", blob, "prescription.txt");
      }
      const { data } = await api.post("/prescriptions/upload", form);
      setResult(data);
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Prescriptions</h1>
        <p className="text-sm text-slate-500">
          Upload documents; AI extracts medicines and creates reminders.{" "}
          <Link className="font-medium text-sky-700 underline" to="/profile">
            Edit health profile
          </Link>{" "}
          or{" "}
          <Link className="font-medium text-sky-700 underline" to="/reminders">
            manage daily reminders
          </Link>
          .
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Add prescription</h2>
        <p className="text-xs text-slate-500">PDF, image, or paste text — server runs OCR + analysis.</p>
        <input
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm"
          type="file"
          accept=".txt,.pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <textarea
          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          rows={4}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
          </select>
          <button
            type="button"
            onClick={uploadPrescription}
            disabled={busy}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? "Analyzing…" : "Analyze & create reminders"}
          </button>
        </div>
        {result && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <p>
              <strong>Auto-reminders:</strong> {result.autoRemindersCreated ?? 0}
            </p>
            {result.prescription?.aiSummary && (
              <p className="mt-2">
                <strong>Summary:</strong> {result.prescription.aiSummary}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">Documents (by upload date)</h2>
        {byDate.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No prescriptions yet.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {byDate.map(([dayLabel, items]) => (
              <div key={dayLabel}>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{dayLabel}</h3>
                <ul className="mt-2 space-y-3">
                  {items.map((pr) => (
                    <li key={pr._id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-sm">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="font-medium text-slate-900">{pr.fileName || "Prescription"}</div>
                        <span className="text-xs text-slate-500">{formatDate(pr.createdAt)}</span>
                      </div>
                      {pr.aiSummary && <p className="mt-2 text-slate-600">{pr.aiSummary}</p>}
                      {Array.isArray(pr.medications) && pr.medications.length > 0 && (
                        <ul className="mt-2 list-inside list-disc text-slate-700">
                          {pr.medications.map((m, i) => (
                            <li key={i}>
                              {[m.name, m.dosage, m.timing].filter(Boolean).join(" · ")}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
