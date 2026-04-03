const NAV_MAIN = [
  { key: "dashboard", label: "Dashboard", short: "Home", icon: "grid" },
  { key: "medicines", label: "Medicines", short: "Meds", icon: "pill" },
  { key: "reminders", label: "Reminders", short: "Alerts", icon: "clock" },
  { key: "pharmacies", label: "Pharmacies", short: "Pharm", icon: "cross" },
  { key: "assistant", label: "AI Assistant", short: "AI", icon: "bot" },
];

const NAV_BOTTOM = [
  { key: "profile", label: "Profile", icon: "user" },
  { key: "settings", label: "Settings", icon: "gear" },
];

function Icon({ name, className = "h-5 w-5" }) {
  const c = `shrink-0 ${className}`;
  switch (name) {
    case "grid":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" d="M4 5h7v7H4V5zm9 0h7v7h-7V5zM4 14h7v7H4v-7zm9 0h7v7h-7v-7z" />
        </svg>
      );
    case "pill":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.5 12.5l7-7a3.5 3.5 0 014.95 4.95l-7 7a3.5 3.5 0 01-4.95-4.95z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 8.5l7 7" />
        </svg>
      );
    case "clock":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case "cross":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-4-4.2-6-8.2S4.5 6.5 8 5c1.8-.8 4 0 4 2.2 0-2.2 2.2-3 4-2.2 3.5 1.5 2 7.8-4 13.8z" />
        </svg>
      );
    case "bot":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.5 10.5h.01M14.5 10.5h.01M8 16c2 1.5 4 1.5 6 0M7 6V4m10 2V4M5 8h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z"
          />
        </svg>
      );
    case "user":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0v1H4v-1z" />
        </svg>
      );
    case "gear":
      return (
        <svg className={c} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM19.4 15a7.96 7.96 0 002-3.4l-2-1.2a6.04 6.04 0 000-2.8l2-1.2a8.1 8.1 0 00-2-3.4l-2.3.6a6 6 0 00-2.4-1.4L14.2 2h-4.4l-.5 2.3a6 6 0 00-2.4 1.4l-2.3-.6a8.1 8.1 0 00-2 3.4l2 1.2a6.04 6.04 0 000 2.8l-2 1.2a7.96 7.96 0 002 3.4l2.3-.6a6 6 0 002.4 1.4l.5 2.3h4.4l.5-2.3a6 6 0 002.4-1.4l2.3.6z"
          />
        </svg>
      );
    default:
      return null;
  }
}

function NavButton({ item, active, onClick }) {
  const is = active === item.key;
  return (
    <button
      type="button"
      onClick={() => onClick(item.key)}
      className={[
        "relative flex w-full items-center gap-3 rounded-xl py-2.5 pl-3 pr-3 text-left text-sm font-medium transition md:pl-4",
        is
          ? "bg-brand-50 text-brand-700 shadow-sm"
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
      ].join(" ")}
    >
      {is ? (
        <span className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />
      ) : null}
      <span className={is ? "text-brand-600" : "text-slate-400"}>
        <Icon name={item.icon} />
      </span>
      {item.label}
    </button>
  );
}

export default function AppShell({ activeNav, onNavChange, auth, onboarding, onLogout, children }) {
  const displayName = String(onboarding?.fullName || auth?.fullName || "U").trim() || "U";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-heal-bg text-slate-800">
      <div className="mx-auto flex max-w-[1440px] gap-0 md:gap-6 md:p-6">
        <aside className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-slate-200/80 bg-white px-2 py-2 md:static md:z-auto md:w-64 md:flex-col md:border-0 md:bg-transparent md:p-0 md:px-0">
          <div className="hidden flex-1 rounded-2xl border border-slate-100/80 bg-white p-4 shadow-card-sm md:flex md:flex-col">
            <div className="mb-8 flex items-center gap-3 px-1">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-heal-leaf to-emerald-600 text-white shadow-md">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21s-8-4.5-8-11a8 8 0 0116 0c0 6.5-8 11-8 11z" />
                </svg>
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-slate-900">MediTrack AI</div>
                <div className="text-xs text-slate-500">Your health companion</div>
              </div>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {NAV_MAIN.map((item) => (
                <NavButton key={item.key} item={item} active={activeNav} onClick={onNavChange} />
              ))}
              <div className="my-3 border-t border-slate-100" />
              {NAV_BOTTOM.map((item) => (
                <NavButton key={item.key} item={item} active={activeNav} onClick={onNavChange} />
              ))}
            </nav>
            <button
              type="button"
              onClick={onLogout}
              className="mt-4 w-full rounded-xl border border-red-100 bg-red-50/80 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100"
            >
              Log out
            </button>
          </div>

          <div className="flex w-full justify-between gap-1 overflow-x-auto px-1 pb-[env(safe-area-inset-bottom)] md:hidden">
            {NAV_MAIN.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => onNavChange(item.key)}
                className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold ${
                  activeNav === item.key ? "text-brand-600" : "text-slate-500"
                }`}
              >
                <span className={activeNav === item.key ? "text-brand-600" : "text-slate-400"}>
                  <Icon name={item.icon} className="h-5 w-5" />
                </span>
                {item.short}
              </button>
            ))}
            <button
              type="button"
              onClick={() => onNavChange("profile")}
              className={`flex min-w-[56px] flex-col items-center gap-0.5 rounded-xl px-2 py-2 text-[10px] font-semibold ${
                activeNav === "profile" || activeNav === "settings"
                  ? "text-brand-600"
                  : "text-slate-500"
              }`}
            >
              <span
                className={
                  activeNav === "profile" || activeNav === "settings"
                    ? "text-brand-600"
                    : "text-slate-400"
                }
              >
                <Icon name="user" className="h-5 w-5" />
              </span>
              Me
            </button>
          </div>
        </aside>

        <div className="min-h-screen flex-1 pb-20 md:min-h-0 md:pb-0">
          <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-heal-bg/90 px-4 py-4 backdrop-blur-md md:rounded-t-2xl md:border-0 md:bg-white/80 md:px-6 md:shadow-card-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0 md:hidden">
                <div className="truncate text-base font-bold text-slate-900">MediTrack AI</div>
              </div>
              <div className="hidden md:block" />
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-100 bg-white p-2.5 text-slate-500 shadow-sm hover:bg-slate-50"
                  aria-label="Notifications"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className="hidden rounded-full border border-slate-100 bg-white px-2.5 py-2 text-sm font-semibold text-brand-600 shadow-sm sm:block"
                  title="Points"
                >
                  P
                </button>
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-600 text-sm font-bold text-white shadow-md ring-2 ring-white"
                  title={auth?.fullName}
                >
                  {initial}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 md:px-6 md:py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
