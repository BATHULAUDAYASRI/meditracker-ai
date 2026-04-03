import { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

function emptyVisit() {
  return { visitedAt: "", doctorName: "", notes: "", nextVisit: "" };
}

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const p = user?.patientProfile || {};
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    age: p.age ?? "",
    weightKg: p.weightKg ?? "",
    heightCm: p.heightCm ?? "",
    smoke: !!p.smoke,
    drink: !!p.drink,
    diabetes: !!p.diabetes,
    pastMedicalHistory: p.pastMedicalHistory || "",
    checkupVisits: (p.checkupVisits && p.checkupVisits.length ? p.checkupVisits : [emptyVisit()]).map((v) => ({
      visitedAt: v.visitedAt ? new Date(v.visitedAt).toISOString().slice(0, 10) : "",
      doctorName: v.doctorName || "",
      notes: v.notes || "",
      nextVisit: v.nextVisit ? new Date(v.nextVisit).toISOString().slice(0, 10) : "",
    })),
  });

  useEffect(() => {
    if (!user) return;
    const pp = user.patientProfile || {};
    setForm((prev) => ({
      ...prev,
      name: user.name || "",
      phone: user.phone || "",
      age: pp.age ?? "",
      weightKg: pp.weightKg ?? "",
      heightCm: pp.heightCm ?? "",
      smoke: !!pp.smoke,
      drink: !!pp.drink,
      diabetes: !!pp.diabetes,
      pastMedicalHistory: pp.pastMedicalHistory || "",
      checkupVisits:
        (pp.checkupVisits && pp.checkupVisits.length
          ? pp.checkupVisits
          : [emptyVisit()]
        ).map((v) => ({
          visitedAt: v.visitedAt ? new Date(v.visitedAt).toISOString().slice(0, 10) : "",
          doctorName: v.doctorName || "",
          notes: v.notes || "",
          nextVisit: v.nextVisit ? new Date(v.nextVisit).toISOString().slice(0, 10) : "",
        })),
    }));
  }, [user]);

  const save = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const checkupVisits = form.checkupVisits
        .filter((v) => v.visitedAt || v.doctorName || v.notes || v.nextVisit)
        .map((v) => ({
          visitedAt: v.visitedAt ? new Date(v.visitedAt) : undefined,
          doctorName: v.doctorName.trim(),
          notes: v.notes.trim(),
          nextVisit: v.nextVisit ? new Date(v.nextVisit) : undefined,
        }));
      await api.put("/auth/profile", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        patientProfile: {
          age: form.age === "" ? undefined : Number(form.age),
          weightKg: form.weightKg === "" ? undefined : Number(form.weightKg),
          heightCm: form.heightCm === "" ? undefined : Number(form.heightCm),
          smoke: form.smoke,
          drink: form.drink,
          diabetes: form.diabetes,
          pastMedicalHistory: form.pastMedicalHistory.trim(),
          checkupVisits,
        },
      });
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const bmi = user?.patientProfile?.bmi;
  const bmiCat = user?.patientProfile?.bmiCategory;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500">Your details, BMI, history, and doctor visits.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">{error}</div>
      )}

      <form onSubmit={save} className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Account</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-500">
              Name
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="block text-xs text-slate-500">
              Email
              <input className="mt-1 w-full rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-sm" readOnly value={user?.email || ""} />
            </label>
            <label className="block text-xs text-slate-500">
              Phone
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 …"
              />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Body metrics</h2>
          <p className="text-xs text-slate-500">BMI is calculated from height and weight when you save.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <label className="block text-xs text-slate-500">
              Age
              <input
                type="number"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
                min={0}
              />
            </label>
            <label className="block text-xs text-slate-500">
              Weight (kg)
              <input
                type="number"
                step="0.1"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </label>
            <label className="block text-xs text-slate-500">
              Height (cm)
              <input
                type="number"
                step="0.1"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={form.heightCm}
                onChange={(e) => setForm({ ...form, heightCm: e.target.value })}
              />
            </label>
          </div>
          <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
            BMI: <strong>{bmi != null ? bmi.toFixed(1) : "—"}</strong>
            {bmiCat ? ` · ${bmiCat}` : ""}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Health &amp; history</h2>
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.smoke} onChange={(e) => setForm({ ...form, smoke: e.target.checked })} />
              Smoke
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.drink} onChange={(e) => setForm({ ...form, drink: e.target.checked })} />
              Alcohol
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.diabetes} onChange={(e) => setForm({ ...form, diabetes: e.target.checked })} />
              Diabetes
            </label>
          </div>
          <label className="mt-3 block text-xs text-slate-500">
            Past medical history
            <textarea
              className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
              rows={3}
              value={form.pastMedicalHistory}
              onChange={(e) => setForm({ ...form, pastMedicalHistory: e.target.value })}
            />
          </label>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900">Doctor checkups</h2>
            <button
              type="button"
              className="text-xs font-medium text-sky-700"
              onClick={() => setForm({ ...form, checkupVisits: [...form.checkupVisits, emptyVisit()] })}
            >
              + Add visit
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {form.checkupVisits.map((v, i) => (
              <div key={i} className="rounded-xl border border-slate-100 p-3">
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="text-xs text-slate-500">
                    Visit date
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.visitedAt}
                      onChange={(e) => {
                        const next = [...form.checkupVisits];
                        next[i] = { ...next[i], visitedAt: e.target.value };
                        setForm({ ...form, checkupVisits: next });
                      }}
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Doctor
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.doctorName}
                      onChange={(e) => {
                        const next = [...form.checkupVisits];
                        next[i] = { ...next[i], doctorName: e.target.value };
                        setForm({ ...form, checkupVisits: next });
                      }}
                    />
                  </label>
                  <label className="text-xs text-slate-500 sm:col-span-2">
                    Notes
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.notes}
                      onChange={(e) => {
                        const next = [...form.checkupVisits];
                        next[i] = { ...next[i], notes: e.target.value };
                        setForm({ ...form, checkupVisits: next });
                      }}
                    />
                  </label>
                  <label className="text-xs text-slate-500">
                    Next visit reminder
                    <input
                      type="date"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
                      value={v.nextVisit}
                      onChange={(e) => {
                        const next = [...form.checkupVisits];
                        next[i] = { ...next[i], nextVisit: e.target.value };
                        setForm({ ...form, checkupVisits: next });
                      }}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save profile"}
        </button>
      </form>
    </div>
  );
}
