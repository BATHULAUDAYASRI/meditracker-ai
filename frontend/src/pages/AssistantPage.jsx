import { useState } from "react";
import Card from "../components/Card.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import { analyzePrescription, uploadPrescription } from "../services/api.js";
import { apiUserId, displayFirstName } from "../utils/timeFormat.js";

export default function AssistantPage({ auth, onboarding }) {
  const userId = apiUserId(auth);
  const name = displayFirstName(onboarding?.fullName || auth?.fullName);
  const [busy, setBusy] = useState(false);
  const [extracted, setExtracted] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [fileErr, setFileErr] = useState("");

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileErr("");
    setBusy(true);
    setAnalysis(null);
    setExtracted("");
    try {
      const up = await uploadPrescription(file, userId);
      setExtracted(up.extracted_text || "");
      const ann = await analyzePrescription(up.extracted_text || "", userId);
      setAnalysis(ann);
    } catch (err) {
      setFileErr(String(err.message || err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">AI assistant</h1>
        <p className="text-sm text-slate-600">Chat, upload a prescription, and get structured medication hints</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ChatPanel userId={userId} displayName={name} compact={false} className="min-h-[560px] shadow-card" />

        <Card title="Upload prescription">
          <label className="flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 px-4 py-10 text-center hover:border-brand-300 hover:bg-brand-50/30">
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={onFile} />
            <span className="text-3xl">📄</span>
            <span className="mt-2 font-medium text-slate-800">Tap to upload</span>
            <span className="mt-1 text-xs text-slate-500">Demo extracts from filename on the server</span>
          </label>
          {busy ? <p className="mt-3 text-sm text-slate-500">Processing…</p> : null}
          {fileErr ? <p className="mt-3 text-sm text-red-600">{fileErr}</p> : null}
          {extracted ? (
            <details className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left text-xs text-slate-600">
              <summary className="cursor-pointer font-medium text-slate-800">Extracted text</summary>
              <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap">{extracted}</pre>
            </details>
          ) : null}
          {analysis?.medicines?.length ? (
            <div className="mt-4 space-y-2">
              <div className="text-sm font-semibold text-slate-800">Parsed medicines</div>
              <ul className="space-y-2 text-sm">
                {analysis.medicines.map((m, i) => (
                  <li key={i} className="rounded-xl border border-slate-100 bg-white px-3 py-2 shadow-sm">
                    <span className="font-medium text-slate-900">{m.name}</span>
                    <span className="text-slate-600"> — {m.dosage}</span>
                    <div className="text-xs text-slate-500">
                      Times: {(m.timings || []).join(", ")} · {m.duration_days} days
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
