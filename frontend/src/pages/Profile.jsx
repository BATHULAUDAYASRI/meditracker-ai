import { useMemo, useState } from "react";

const FAMILY_MEMBERS = [
  {
    id: "self",
    name: "Demo User",
    relation: "Self",
    age: 29,
    risk: "Moderate",
    meds: 4,
    nextCheckup: "2026-04-12",
  },
  {
    id: "father",
    name: "Ramesh Kumar",
    relation: "Father",
    age: 63,
    risk: "High",
    meds: 6,
    nextCheckup: "2026-04-03",
  },
  {
    id: "mother",
    name: "Sujatha Devi",
    relation: "Mother",
    age: 57,
    risk: "Moderate",
    meds: 3,
    nextCheckup: "2026-04-19",
  },
];

export default function Profile({ user }) {
  const [activeId, setActiveId] = useState("self");
  const activeProfile = useMemo(
    () => FAMILY_MEMBERS.find((m) => m.id === activeId) || FAMILY_MEMBERS[0],
    [activeId]
  );

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Profile</h2>
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-2">
        <div className="text-sm text-slate-400">User</div>
        <div className="font-semibold">{user?.name || "Demo User"}</div>

        <div className="text-sm text-slate-400 mt-4">Demo Notes</div>
        <div className="text-sm text-slate-300">
          This hackathon MVP stores reminders and chat in backend memory.
          Refreshing or restarting the backend resets state.
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4">
        <div className="text-sm text-slate-400 mb-2">Family medication manager</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FAMILY_MEMBERS.map((m) => (
            <button
              key={m.id}
              onClick={() => setActiveId(m.id)}
              className={[
                "text-left rounded-xl border p-3 transition",
                activeId === m.id
                  ? "border-brand-700 bg-brand-900/20"
                  : "border-slate-800 bg-slate-900/40 hover:bg-slate-800/30",
              ].join(" ")}
            >
              <div className="font-medium">{m.name}</div>
              <div className="text-xs text-slate-400 mt-1">{m.relation} · {m.age} yrs</div>
              <div className="text-xs mt-1 text-slate-300">
                Risk: <span className="font-medium">{m.risk}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-3">
          <div className="text-sm font-medium">{activeProfile.name}</div>
          <div className="text-xs text-slate-400 mt-1">
            Active meds: {activeProfile.meds} · Next checkup: {activeProfile.nextCheckup}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-800 text-xs">
              Open reminders
            </button>
            <button className="px-3 py-2 rounded-lg border border-amber-700 bg-amber-900/20 text-xs">
              Refill due meds
            </button>
            <button className="px-3 py-2 rounded-lg border border-brand-700 bg-brand-900/20 text-xs">
              Share summary with caregiver
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

