import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { randomEncouragement } from "../utils/encourage";

export default function DashboardPage() {
  const { user } = useAuth();
  const profile = user?.patientProfile || {};
  const patient = user?.role === "patient";
  const [apiOk, setApiOk] = useState(null);
  const [adherence, setAdherence] = useState(null);
  const [reminders, setReminders] = useState([]);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/health")
      .then(() => {
        if (!cancelled) setApiOk(true);
      })
      .catch(() => {
        if (!cancelled) setApiOk(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const loadPatientData = async () => {
    const [a, r] = await Promise.all([api.get("/adherence/daily"), api.get("/reminders")]);
    setAdherence(a.data);
    setReminders(r.data.reminders || []);
  };

  useEffect(() => {
    if (!patient) return;
    let cancelled = false;
    (async () => {
      try {
        await loadPatientData();
      } catch {
        if (!cancelled) setAdherence(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [patient]);

  const chartData = useMemo(() => {
    const days = adherence?.days || [];
    return days.map((d) => ({
      ...d,
      label: d.date.slice(5),
      rateDisplay: d.rate == null ? null : d.rate,
    }));
  }, [adherence]);

  const sortedToday = useMemo(() => {
    return [...reminders].filter((r) => r.enabled).sort((a, b) => String(a.scheduleTime).localeCompare(String(b.scheduleTime)));
  }, [reminders]);

  const logTaken = async (id) => {
    await api.put(`/reminders/${id}/log`, { status: "taken" });
    setFlash(randomEncouragement());
    setTimeout(() => setFlash(""), 4000);
    await loadPatientData();
  };

  const markTodayDone = async () => {
    await api.post("/reminders/mark-today-done");
    setFlash(randomEncouragement() + " You’ve logged today’s medications.");
    setTimeout(() => setFlash(""), 5000);
    await loadPatientData();
  };

  return (
    <div className="space-y-4">
      {apiOk === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Backend not reachable.</strong> Docker: run{" "}
          <code className="rounded bg-white px-1">docker compose -f docker-compose.node.yml up --build</code> then open{" "}
          <strong>
            <code className="rounded bg-white px-1">http://localhost:8080</code>
          </strong>
          . Local dev: run server and client; open <code className="rounded bg-white px-1">http://localhost:5173</code>.
        </div>
      )}
      {apiOk === true && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-900">
          Connected to API — MediTrack is live.
        </div>
      )}

      {flash && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-950">{flash}</div>
      )}

      <div className="rounded-2xl bg-gradient-to-br from-sky-600 to-indigo-700 p-6 text-white shadow-sm">
        <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
        <p className="mt-1 text-sm text-sky-100">Language: {user?.preferredLanguage || "en"} · Use the assistant on the right for questions.</p>
      </div>

      {patient && (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card title="BMI" value={profile.bmi != null ? profile.bmi.toFixed(1) : "—"} />
            <Card title="Category" value={profile.bmiCategory ?? "—"} />
            <Card
              title="7-day consistency"
              value={adherence?.overallConsistency != null ? `${adherence.overallConsistency}%` : "—"}
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900">Medication consistency (last 7 days)</h3>
            <p className="text-xs text-slate-500">Based on doses you mark as taken or missed.</p>
            <div className="mt-4 h-64 w-full">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) => [value, name === "taken" ? "Taken" : "Missed"]}
                      labelFormatter={(_, p) => (p?.[0]?.payload?.date ? `Date: ${p[0].payload.date}` : "")}
                    />
                    <Legend />
                    <Bar dataKey="taken" name="Taken" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missed" name="Missed" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500">No data yet — log doses from reminders.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Today&apos;s medications</h3>
                <p className="text-xs text-slate-500">Mark taken for a quick boost — or finish all at once.</p>
              </div>
              <button
                type="button"
                onClick={markTodayDone}
                disabled={sortedToday.length === 0}
                className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:opacity-40"
              >
                Done with today&apos;s medicines
              </button>
            </div>
            {sortedToday.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">
                No active reminders.{" "}
                <Link className="font-medium text-sky-700 underline" to="/prescriptions">
                  Upload a prescription
                </Link>{" "}
                or{" "}
                <Link className="font-medium text-sky-700 underline" to="/reminders">
                  add reminders
                </Link>
                .
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {sortedToday.map((r) => (
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
                    <button
                      type="button"
                      onClick={() => logTaken(r._id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white"
                    >
                      Taken
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <QuickLink to="/prescriptions" title="Prescriptions" desc="Upload &amp; view by date" />
            <QuickLink to="/reminders" title="Daily meds" desc="Times, slots, adherence" />
            <QuickLink to="/pharmacies" title="Pharmacies &amp; refill" desc="Nearby with Google Maps" />
            <QuickLink to="/profile" title="Profile" desc="BMI, history, checkups" />
          </div>
        </>
      )}

      {!patient && (
        <p className="rounded-2xl bg-white p-5 text-slate-600 shadow-sm">
          Use <strong>Doctor hub</strong> from the nav to review patients.
        </p>
      )}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function QuickLink({ to, title, desc }) {
  return (
    <Link
      to={to}
      className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-sky-200 hover:shadow-md"
    >
      <div className="font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </Link>
  );
}
