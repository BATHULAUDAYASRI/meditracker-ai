import { useState } from "react";
import { useAuth } from "../context/AuthContext";

const initialForm = () => ({
  name: "",
  email: "",
  password: "",
  role: "patient",
  preferredLanguage: "en",
  smoke: "no",
  drink: "no",
  diabetes: "no",
  pastMedicalHistory: "",
});

export default function AuthPage() {
  const { login, register, googleFirebase } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  const patientSignup = !isLogin && form.role === "patient";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isLogin) {
        await login({ email: form.email, password: form.password });
        return;
      }
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        preferredLanguage: form.preferredLanguage,
      };
      if (form.role === "patient") {
        payload.smoke = form.smoke === "yes";
        payload.drink = form.drink === "yes";
        payload.diabetes = form.diabetes === "yes";
        payload.pastMedicalHistory = form.pastMedicalHistory;
      }
      await register(payload);
    } catch (err) {
      setError(err.response?.data?.error || "Auth failed");
    }
  };

  const runGoogleOAuth = async () => {
    setError("");
    try {
      await googleFirebase({
        email: form.email,
        name: form.name,
        role: form.role,
        preferredLanguage: form.preferredLanguage,
        smoke: form.smoke === "yes",
        drink: form.drink === "yes",
        diabetes: form.diabetes === "yes",
        pastMedicalHistory: form.pastMedicalHistory,
      });
    } catch (err) {
      setError(err.response?.data?.error || "Google login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow">
        <h2 className="text-2xl font-bold">{isLogin ? "Login" : "Sign up"} — MediTrack AI</h2>
        <p className="mb-4 text-sm text-slate-500">
          Role and language. Patients also share health history at signup.
        </p>

        {!isLogin && (
          <input
            className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
            placeholder="Full name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        )}
        <input
          className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
          placeholder="Email"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="mb-3 w-full rounded-xl border border-slate-200 px-3 py-2"
          type="password"
          placeholder="Password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <div className="mb-3 grid grid-cols-2 gap-2">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="patient">Patient</option>
            <option value="doctor">Doctor</option>
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2"
            value={form.preferredLanguage}
            onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
            <option value="te">Telugu</option>
          </select>
        </div>

        {patientSignup && (
          <div className="mb-4 space-y-3 rounded-xl border border-sky-100 bg-sky-50/50 p-4">
            <p className="text-sm font-medium text-slate-800">Health history (yes / no)</p>
            <YesNoRow
              label="Do you smoke?"
              value={form.smoke}
              onChange={(v) => setForm({ ...form, smoke: v })}
            />
            <YesNoRow
              label="Do you drink alcohol regularly?"
              value={form.drink}
              onChange={(v) => setForm({ ...form, drink: v })}
            />
            <YesNoRow
              label="Are you diabetic?"
              value={form.diabetes}
              onChange={(v) => setForm({ ...form, diabetes: v })}
            />
            <label className="block text-sm text-slate-700">
              Past medical history (optional)
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                placeholder="Allergies, surgeries, chronic conditions…"
                value={form.pastMedicalHistory}
                onChange={(e) => setForm({ ...form, pastMedicalHistory: e.target.value })}
              />
            </label>
          </div>
        )}

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <button type="submit" className="w-full rounded-xl bg-sky-600 py-2.5 font-medium text-white">
          {isLogin ? "Login" : "Create account"}
        </button>
        <button type="button" onClick={runGoogleOAuth} className="mt-2 w-full rounded-xl border border-slate-200 py-2.5 text-sm">
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLogin((v) => !v);
            setError("");
            setForm(initialForm());
          }}
          className="mt-3 w-full text-sm text-slate-600"
        >
          {isLogin ? "Need an account? Sign up" : "Already have an account? Login"}
        </button>
      </form>
    </div>
  );
}

function YesNoRow({ label, value, onChange }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm text-slate-700">{label}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange("yes")}
          className={`rounded-lg px-3 py-1.5 text-sm ${value === "yes" ? "bg-rose-600 text-white" : "bg-white border border-slate-200"}`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange("no")}
          className={`rounded-lg px-3 py-1.5 text-sm ${value === "no" ? "bg-emerald-600 text-white" : "bg-white border border-slate-200"}`}
        >
          No
        </button>
      </div>
    </div>
  );
}
