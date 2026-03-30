export default function Sidebar({ active, onChange }) {
  const items = [
    { key: "dashboard", label: "Dashboard" },
    { key: "prescriptions", label: "Prescriptions" },
    { key: "reminders", label: "Reminders" },
    { key: "pharmacy", label: "Pharmacy" },
    { key: "chatbot", label: "Chatbot" },
    { key: "profile", label: "Profile" },
  ];

  return (
    <aside className="hidden md:flex md:flex-col md:w-64 bg-slate-900/60 border-r border-slate-800 p-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-brand-900 border border-slate-700 flex items-center justify-center font-bold">
          💊
        </div>
        <div>
          <div className="font-semibold">MediTracker AI</div>
          <div className="text-xs text-slate-400">Medication & health reminders</div>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <button
            key={it.key}
            onClick={() => onChange(it.key)}
            className={[
              "text-left px-3 py-2 rounded-lg border transition",
              it.key === active
                ? "bg-brand-900 border-brand-700 text-brand-200"
                : "bg-transparent border-transparent text-slate-200 hover:border-slate-700 hover:bg-slate-800/20",
            ].join(" ")}
          >
            {it.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}

