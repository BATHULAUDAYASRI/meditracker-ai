import { useMemo, useState } from "react";
import {
  analyzePrescription,
  setReminder,
  uploadPrescription,
} from "../services/api.js";

const USER_ID = "demo_user";

const DEMO_DOCUMENTS = [
  {
    fileName: "chronic-care-prescription.pdf",
    extracted_text: `Medicine: Metformin\nDosage: 500mg\nTiming: 08:00, 20:00\nDuration: 30 days\nPriority: 6\nMedicine: Aspirin\nDosage: 75mg\nTiming: 09:00\nDuration: 90 days\nPriority: 5`,
  },
  {
    fileName: "duplicate-copy-prescription.pdf",
    extracted_text: `Medicine: Metformin\nDosage: 500mg\nTiming: 08:00, 20:00\nDuration: 30 days\nPriority: 6\nMedicine: Aspirin\nDosage: 75mg\nTiming: 09:00\nDuration: 90 days\nPriority: 5`,
  },
  {
    fileName: "night-schedule-cardiology.jpg",
    extracted_text: `Medicine: Atorvastatin\nDosage: 10mg\nTiming: 21:00\nDuration: 60 days\nPriority: 7\nMedicine: Telmisartan\nDosage: 40mg\nTiming: 08:30\nDuration: 60 days\nPriority: 8`,
  },
];

function MedicineTag({ m }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className="font-semibold">{m.name}</div>
      <div className="text-sm text-slate-300 mt-1">
        Dosage: <span className="text-slate-100">{m.dosage}</span>
      </div>
      <div className="text-sm text-slate-300 mt-1">
        Timings:{" "}
        <span className="text-slate-100">
          {(m.timings || []).join(", ")}
        </span>
      </div>
      <div className="text-sm text-slate-300 mt-1">
        Duration: <span className="text-slate-100">{m.duration_days} days</span>
      </div>
      <div className="text-sm text-slate-300 mt-1">
        Priority: <span className="text-slate-100">{m.priority}</span>
      </div>
    </div>
  );
}

export default function Prescriptions({ refreshReminders, pushToast }) {
  const [items, setItems] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [seeding, setSeeding] = useState(false);

  const canRemind = useMemo(() => items.some((x) => x.analysis), [items]);

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const newRows = [];
      for (const file of files) {
        const id = `${Date.now()}-${file.name}-${Math.random().toString(16).slice(2)}`;
        pushToast?.("info", `Uploading ${file.name}...`);
        const r = await uploadPrescription(file, USER_ID);
        newRows.push({
          id,
          fileName: file.name,
          extracted_text: r.extracted_text,
          analysis: null,
        });
      }
      setItems((prev) => [...newRows, ...prev]);
      pushToast?.("success", "Prescription uploaded and extracted.");
    } catch (e) {
      pushToast?.("error", e?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const analyzeOne = async (id) => {
    const row = items.find((x) => x.id === id);
    if (!row) return;
    setAnalyzingId(id);
    try {
      pushToast?.("info", "Analyzing prescription with AI...");
      const r = await analyzePrescription(row.extracted_text, USER_ID);

      const medicines = r.medicines || [];
      // Auto-generate reminders from extracted data.
      if (medicines.length) {
        pushToast?.("info", "Generating reminders...");
        await Promise.all(
          medicines.flatMap((m) =>
            (m.timings || []).map((t) =>
              setReminder({
                user_id: USER_ID,
                medicine_name: m.name,
                time_hhmm: t,
                duration_days: m.duration_days,
                priority: m.priority,
                enabled: true,
              })
            )
          )
        );
      }

      setItems((prev) =>
        prev.map((x) =>
          x.id === id
            ? {
                ...x,
                analysis: {
                  medicines,
                  raw: r.raw,
                },
              }
            : x
        )
      );

      await refreshReminders();
      pushToast?.("success", "AI analysis complete and reminders created.");
    } catch (e) {
      pushToast?.("error", e?.message || "Analyze failed");
    } finally {
      setAnalyzingId(null);
    }
  };

  const seedDemoDocuments = async () => {
    setSeeding(true);
    try {
      const seeded = DEMO_DOCUMENTS.map((d) => ({
        id: `${Date.now()}-${d.fileName}-${Math.random().toString(16).slice(2)}`,
        ...d,
        analysis: null,
      }));
      setItems((prev) => [...seeded, ...prev]);
      pushToast?.(
        "success",
        "Added demo prescription cards (includes duplicate prescription copy)."
      );
    } finally {
      setSeeding(false);
    }
  };

  const setupDuplicateReminderPack = async () => {
    try {
      pushToast?.("info", "Setting up duplicate reminder pack...");
      const template = [
        { medicine_name: "Metformin", time_hhmm: "08:00", duration_days: 30, priority: 6 },
        { medicine_name: "Metformin", time_hhmm: "08:00", duration_days: 30, priority: 6 }, // duplicate
        { medicine_name: "Metformin", time_hhmm: "20:00", duration_days: 30, priority: 6 },
        { medicine_name: "Aspirin", time_hhmm: "09:00", duration_days: 90, priority: 5 },
        { medicine_name: "Atorvastatin", time_hhmm: "21:00", duration_days: 60, priority: 7 },
      ];

      await Promise.all(
        template.map((t) =>
          setReminder({
            user_id: USER_ID,
            enabled: true,
            ...t,
          })
        )
      );
      await refreshReminders();
      pushToast?.(
        "success",
        "Duplicate reminder setup complete. Check Reminders page for stacked schedules."
      );
    } catch (e) {
      pushToast?.("error", e?.message || "Failed to setup reminder pack");
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Prescriptions</h2>
        <div className="text-sm text-slate-400">
          Upload, extract, analyze, and auto-create reminders.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <label className="block text-sm text-slate-200 font-medium">
          Upload PDF/Image prescription
        </label>
        <input
          className="mt-2 w-full text-sm text-slate-200 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-brand-900 file:text-brand-100 hover:file:bg-brand-900"
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          disabled={uploading}
        />
        {uploading && <div className="text-sm text-slate-300 mt-2">Uploading...</div>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={seedDemoDocuments}
            disabled={seeding}
            className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-xs disabled:opacity-50"
          >
            {seeding ? "Adding..." : "Add demo documents"}
          </button>
          <button
            onClick={setupDuplicateReminderPack}
            className="px-3 py-2 rounded-xl bg-amber-900/30 border border-amber-700 hover:bg-amber-900/50 text-xs"
          >
            Setup duplicate reminder pack
          </button>
        </div>
      </div>

      {!items.length ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-300">
          Upload a prescription to get started.
        </div>
      ) : null}

      <div className="space-y-4">
        {items.map((it) => (
          <div
            key={it.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{it.fileName}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Extracted text preview
                </div>
              </div>
              <button
          className="px-4 py-2 rounded-xl bg-brand-900 border border-brand-800 hover:bg-brand-900 transition text-sm disabled:opacity-50"
                onClick={() => analyzeOne(it.id)}
                disabled={analyzingId === it.id}
              >
                {analyzingId === it.id ? "Analyzing..." : "Analyze with AI"}
              </button>
            </div>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-slate-300">
                Show extracted text
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-200 bg-slate-950/50 border border-slate-800 rounded-xl p-3">
                {it.extracted_text}
              </pre>
            </details>

            {it.analysis ? (
              <div className="mt-4">
                <div className="text-sm text-slate-300 mb-3 font-medium">
                  AI structured output
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {it.analysis.medicines.map((m) => (
                    <MedicineTag key={`${it.id}-${m.name}`} m={m} />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      {canRemind ? (
        <div className="text-xs text-slate-400">
          Reminders are stored in the backend memory for this demo session.
        </div>
      ) : null}
    </section>
  );
}

