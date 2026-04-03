import { useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import { calculateBmi, getBmiCategory } from "../utils/bmi.js";

const STEPS = ["Basic Details", "Physical Details", "Lifestyle", "Medical History"];

const initial = {
  fullName: "",
  age: "",
  dob: "",
  gender: "",
  heightCm: "",
  weightKg: "",
  bmi: null,
  smoke: false,
  alcohol: false,
  exercise: false,
  diabetes: false,
  bpIssues: false,
  pastHistory: "",
  currentMeds: "",
};

function Field({ label, children, required = false }) {
  return (
    <label className="block">
      <div className="mb-1 text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </div>
      {children}
    </label>
  );
}

function YesNo({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`rounded-xl border px-3 py-2 ${
          value ? "border-brand-400 bg-brand-50 text-brand-800" : "border-slate-200 bg-white"
        }`}
      >
        Yes
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`rounded-xl border px-3 py-2 ${
          !value ? "border-brand-400 bg-brand-50 text-brand-800" : "border-slate-200 bg-white"
        }`}
      >
        No
      </button>
    </div>
  );
}

export default function OnboardingPage({ auth, onComplete, onLogout }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ ...initial, fullName: auth?.fullName || "" });
  const [errors, setErrors] = useState({});

  const bmi = useMemo(() => calculateBmi(form.heightCm, form.weightKg), [form.heightCm, form.weightKg]);
  const bmiCategory = getBmiCategory(bmi);

  const progressPct = Math.round(((step + 1) / STEPS.length) * 100);

  const setField = (key, value) => {
    setForm((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validateStep = () => {
    const next = {};
    if (step === 0) {
      if (!form.fullName.trim()) next.fullName = "Full Name is required";
      if (!form.age || Number(form.age) <= 0) next.age = "Enter a valid age";
      if (!form.dob) next.dob = "Date of birth is required";
      if (!form.gender) next.gender = "Please select gender";
    }
    if (step === 1) {
      if (!form.heightCm || Number(form.heightCm) <= 0) next.heightCm = "Enter valid height";
      if (!form.weightKg || Number(form.weightKg) <= 0) next.weightKg = "Enter valid weight";
    }
    if (step === 3) {
      /* Medical history optional per product spec */
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };

  const prevStep = () => setStep((s) => Math.max(0, s - 1));

  const submit = () => {
    if (!validateStep()) return;
    onComplete({ ...form, bmi, bmiCategory, age: Number(form.age) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-heal-bg px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-3xl space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome, {auth?.fullName || "there"}</h1>
            <p className="text-sm text-slate-600">A few steps to personalize MediTrack AI</p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50"
          >
            Switch account
          </button>
        </header>

        <Card title={`Step ${step + 1} of ${STEPS.length}: ${STEPS[step]}`}>
          <div className="mb-4">
            <div className="h-2 w-full rounded-full bg-slate-200">
              <div className="h-2 rounded-full bg-brand-500 transition-all" style={{ width: `${progressPct}%` }} />
            </div>
            <div className="mt-1 text-xs text-slate-500">{progressPct}% completed</div>
          </div>

          <div className="space-y-3">
            {step === 0 && (
              <>
                <Field label="Full Name" required>
                  <input
                    value={form.fullName}
                    onChange={(e) => setField("fullName", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                  />
                  {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName}</p> : null}
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Age" required>
                    <input
                      type="number"
                      value={form.age}
                      onChange={(e) => setField("age", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                    />
                    {errors.age ? <p className="mt-1 text-xs text-red-600">{errors.age}</p> : null}
                  </Field>
                  <Field label="Date of Birth" required>
                    <input
                      type="date"
                      value={form.dob}
                      onChange={(e) => setField("dob", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                    />
                    {errors.dob ? <p className="mt-1 text-xs text-red-600">{errors.dob}</p> : null}
                  </Field>
                </div>
                <Field label="Gender" required>
                  <select
                    value={form.gender}
                    onChange={(e) => setField("gender", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                  >
                    <option value="">Select</option>
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                    <option>Prefer not to say</option>
                  </select>
                  {errors.gender ? <p className="mt-1 text-xs text-red-600">{errors.gender}</p> : null}
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Height (cm)" required>
                    <input
                      type="number"
                      value={form.heightCm}
                      onChange={(e) => setField("heightCm", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                    />
                    {errors.heightCm ? <p className="mt-1 text-xs text-red-600">{errors.heightCm}</p> : null}
                  </Field>
                  <Field label="Weight (kg)" required>
                    <input
                      type="number"
                      value={form.weightKg}
                      onChange={(e) => setField("weightKg", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                    />
                    {errors.weightKg ? <p className="mt-1 text-xs text-red-600">{errors.weightKg}</p> : null}
                  </Field>
                </div>
                <div className="rounded-xl border border-brand-100 bg-brand-50/60 p-4">
                  <div className="text-sm text-slate-700">
                    BMI: <span className="font-bold text-slate-900">{bmi ?? "--"}</span>
                  </div>
                  <div className="mt-1 text-sm text-slate-700">
                    Category:{" "}
                    <span
                      className={`font-semibold ${
                        bmiCategory === "Normal" ? "text-heal-leafDark" : "text-amber-600"
                      }`}
                    >
                      {bmiCategory}
                    </span>
                  </div>
                  {bmiCategory === "Overweight" || bmiCategory === "Obese" ? (
                    <p className="mt-2 text-xs text-red-600">
                      BMI is outside the typical healthy range — consider discussing with your clinician.
                    </p>
                  ) : null}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <Field label="Do you smoke?">
                  <YesNo value={form.smoke} onChange={(v) => setField("smoke", v)} />
                </Field>
                <Field label="Do you consume alcohol?">
                  <YesNo value={form.alcohol} onChange={(v) => setField("alcohol", v)} />
                </Field>
                <Field label="Do you exercise regularly?">
                  <YesNo value={form.exercise} onChange={(v) => setField("exercise", v)} />
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label="Do you have diabetes?">
                  <YesNo value={form.diabetes} onChange={(v) => setField("diabetes", v)} />
                </Field>
                <Field label="Do you have blood pressure issues?">
                  <YesNo value={form.bpIssues} onChange={(v) => setField("bpIssues", v)} />
                </Field>
                <Field label="Any past medical history? (optional)">
                  <textarea
                    value={form.pastHistory}
                    onChange={(e) => setField("pastHistory", e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                    placeholder="Optional — surgeries, conditions, notes…"
                  />
                  {errors.pastHistory ? <p className="mt-1 text-xs text-red-600">{errors.pastHistory}</p> : null}
                </Field>
                <Field label="Current medications (optional)">
                  <textarea
                    value={form.currentMeds}
                    onChange={(e) => setField("currentMeds", e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 outline-none ring-brand-500/20 focus:ring-2"
                  />
                </Field>
              </>
            )}
          </div>

          <footer className="mt-6 flex justify-between gap-3">
            <button
              type="button"
              onClick={prevStep}
              disabled={step === 0}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm disabled:opacity-40"
            >
              Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={nextStep}
                className="rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-brand-600"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                className="rounded-xl bg-heal-leaf px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-heal-leafDark"
              >
                Complete onboarding
              </button>
            )}
          </footer>
        </Card>
      </div>
    </div>
  );
}

