export default function Topbar({ user, missedCount, onRefresh }) {
  return (
    <header className="flex items-center justify-between gap-3 bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
      <div>
        <div className="text-sm text-slate-400">Welcome back</div>
        <div className="font-semibold">{user?.name || "Demo User"}</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:block text-right">
          <div className="text-xs text-slate-400">Notifications</div>
          <div className="font-semibold">
            Missed: <span className="text-amber-300">{missedCount}</span>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 transition text-sm"
        >
          Refresh
        </button>
      </div>
    </header>
  );
}

