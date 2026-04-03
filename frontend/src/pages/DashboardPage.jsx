import { useCallback, useEffect, useMemo, useState } from "react";
import Card from "../components/Card.jsx";
import ReminderModal from "../components/ReminderModal.jsx";
import ChatPanel from "../components/ChatPanel.jsx";
import { getPharmacies, getReminders } from "../services/api.js";
import { apiUserId, displayFirstName, formatHHMM12, greetingForHour } from "../utils/timeFormat.js";

const DEMO_MEDS = [
  { id: "d1", time_hhmm: "08:00", medicine_name: "Paracetamol 500mg", status: "pending", demo: true },
  { id: "d2", time_hhmm: "14:00", medicine_name: "Vitamin D 1000 IU", status: "pending", demo: true },
  { id: "d3", time_hhmm: "21:00", medicine_name: "BP Tablet", status: "missed", demo: true },
];

function statusStyles(status) {
  if (status === "missed") return "border-red-100 bg-red-50 text-red-800";
  if (status === "taken") return "border-emerald-100 bg-emerald-50 text-emerald-900";
  return "border-slate-100 bg-white text-slate-700";
}

function PharmacyMiniMap({ pharmacies }) {
  const pins = (pharmacies || []).slice(0, 3);
  const colors = ["bg-red-500", "bg-heal-leaf", "bg-red-500"];
  return (
    <div className="relative mt-3 h-40 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute left-1/4 top-1/3 h-16 w-24 rounded-full bg-slate-200/80 blur-sm" />
        <div className="absolute right-1/4 bottom-1/4 h-20 w-28 rounded-full bg-slate-200/60 blur-sm" />
      </div>
      {pins.map((p, i) => (
        <div
          key={p.id || i}
          className="absolute flex flex-col items-center"
          style={{
            left: `${22 + i * 26}%`,
            top: `${30 + (i % 2) * 22}%`,
          }}
        >
          <span className={`h-3 w-3 rounded-full border-2 border-white shadow ${colors[i % colors.length]}`} />
          <span className="mt-1 max-w-[72px] truncate rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-semibold text-slate-700 shadow-sm">
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage({ auth, onboarding, healthFlags, onNavigate = () => {} }) {
  const userId = apiUserId(auth);
  const [reminders, setReminders] = useState([]);
  const [pharmacies, setPharmacies] = useState([]);
  const [loadErr, setLoadErr] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const refresh = useCallback(async () => {
    setLoadErr("");
    try {
      const [r, p] = await Promise.all([
        getReminders(userId),
        getPharmacies({ lat: 12.97, lng: 77.59, radius_km: 8 }),
      ]);
      setReminders(Array.isArray(r) ? r : []);
      setPharmacies(Array.isArray(p) ? p : []);
    } catch (e) {
      setLoadErr(String(e.message || e));
      setReminders([]);
      setPharmacies([]);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const displayMeds = useMemo(() => {
    if (reminders.length) {
      return reminders.map((x) => ({
        id: x.id,
        time_hhmm: x.time_hhmm,
        medicine_name: x.medicine_name,
        status: x.status,
        demo: false,
      }));
    }
    return DEMO_MEDS;
  }, [reminders]);

  const sortedMeds = useMemo(() => {
    return [...displayMeds].sort((a, b) => a.time_hhmm.localeCompare(b.time_hhmm));
  }, [displayMeds]);

  const nextPending = useMemo(() => {
    const pend = sortedMeds.find((m) => m.status === "pending" || m.status === "missed");
    return pend || sortedMeds[0];
  }, [sortedMeds]);

  const refillSoon = useMemo(() => reminders.some((r) => r.about_to_finish), [reminders]);

  const overviewParts = useMemo(() => {
    const bmi = onboarding?.bmi != null ? `BMI: ${onboarding.bmi}` : "";
    let next = "";
    if (nextPending) {
      const med = String(nextPending.medicine_name || "Medication").split(/[—\-]/)[0].trim();
      next = `Next dose: ${formatHHMM12(nextPending.time_hhmm)} ${med}`;
    }
    const refill = refillSoon
      ? "Refill reminder soon"
      : healthFlags.length
        ? healthFlags.slice(0, 2).join(" · ")
        : "Refill reminder in 10 days";
    return [bmi, next, refill].filter(Boolean);
  }, [onboarding, nextPending, refillSoon, healthFlags]);

  const greet = greetingForHour();
  const name = displayFirstName(onboarding?.fullName || auth?.fullName);

  return (
    <div className="space-y-6">
      {loadErr ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Could not reach the API ({loadErr}). Showing demo medications; start the backend on port 8000.
        </div>
      ) : null}

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          {greet}, {name}{" "}
          <span className="inline-block" aria-hidden>
            👋
          </span>
        </h1>
        <p className="mt-2 text-sm text-slate-600 md:text-base">
          <span className="font-medium text-slate-800">Your health overview:</span>{" "}
          {overviewParts.join(" | ")}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => onNavigate("medicines")}
          className="group rounded-2xl border border-slate-100/80 bg-gradient-to-br from-sky-50 to-white p-5 text-left shadow-card-sm transition hover:shadow-md"
        >
          <div className="text-2xl">💊</div>
          <div className="mt-2 font-semibold text-slate-900">Medicines</div>
          <div className="mt-1 text-sm text-slate-600">Daily medication schedule</div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("reminders")}
          className="group rounded-2xl border border-slate-100/80 bg-gradient-to-br from-emerald-50 to-white p-5 text-left shadow-card-sm transition hover:shadow-md"
        >
          <div className="text-2xl">📅</div>
          <div className="mt-2 font-semibold text-slate-900">Reminders</div>
          <div className="mt-1 text-sm text-slate-600">Upcoming alerts & appointments</div>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("assistant")}
          className="group rounded-2xl border border-slate-100/80 bg-gradient-to-br from-violet-50 to-white p-5 text-left shadow-card-sm transition hover:shadow-md"
        >
          <div className="text-2xl">🤖</div>
          <div className="mt-2 font-semibold text-slate-900">AI chatbot</div>
          <div className="mt-1 text-sm text-slate-600">Ask our health assistant</div>
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Today's medications">
          <div className="space-y-3">
            {sortedMeds.map((m) => (
              <div
                key={m.id}
                className={`flex items-start justify-between gap-3 rounded-xl border px-3 py-3 text-sm ${statusStyles(m.status)}`}
              >
                <div>
                  <div className="font-semibold">
                    {formatHHMM12(m.time_hhmm)} – {m.medicine_name}
                  </div>
                  <div className="mt-0.5 text-xs capitalize opacity-80">{m.status}</div>
                </div>
                {m.status === "missed" ? (
                  <span className="text-lg text-red-500" aria-hidden>
                    ✕
                  </span>
                ) : null}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="mt-4 w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-600"
          >
            Set reminder
          </button>
        </Card>

        <Card title="Pharmacy & refills">
          <div className="rounded-xl border border-amber-100 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
            ⚠️ You need to refill your medications in{" "}
            <strong className="text-heal-leafDark">10 days!</strong>
          </div>
          <div className="mt-4">
            <div className="text-sm font-semibold text-slate-800">Nearby pharmacies</div>
            <PharmacyMiniMap pharmacies={pharmacies.length ? pharmacies : [{ name: "WellCare Pharmacy" }, { name: "HealthPlus Pharmacy" }, { name: "CityMed Pharmacy" }]} />
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              {(pharmacies.length ? pharmacies : [{ name: "WellCare Pharmacy" }, { name: "HealthPlus Pharmacy" }]).slice(0, 3).map((p) => (
                <li key={p.id || p.name} className="flex justify-between gap-2 rounded-lg bg-slate-50 px-2 py-1.5">
                  <span className="font-medium text-slate-800">{p.name}</span>
                  {p.distance_km != null ? <span className="text-slate-500">{p.distance_km} km</span> : null}
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("pharmacies")}
            className="mt-4 w-full rounded-xl bg-heal-leaf py-3 text-sm font-semibold text-white shadow-sm hover:bg-heal-leafDark"
          >
            Refill now
          </button>
        </Card>

        <div className="lg:col-span-1">
          <ChatPanel userId={userId} displayName={name} compact />
        </div>
      </div>

      <ReminderModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        userId={userId}
        onSaved={refresh}
      />
    </div>
  );
}
