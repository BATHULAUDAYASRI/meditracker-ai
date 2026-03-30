import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import ToastCenter from "./components/ToastCenter.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Prescriptions from "./pages/Prescriptions.jsx";
import Reminders from "./pages/Reminders.jsx";
import Pharmacy from "./pages/Pharmacy.jsx";
import Chatbot from "./pages/Chatbot.jsx";
import Profile from "./pages/Profile.jsx";

import { getReminders, recordDose, setReminder } from "./services/api.js";

const USER_ID = "demo_user";

function nowKey() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function App() {
  const [active, setActive] = useState("dashboard");
  const [user] = useState({ name: "Demo User" });

  const [reminders, setReminders] = useState([]);
  const [lastReminderSnapshot, setLastReminderSnapshot] = useState({});
  const [toasts, setToasts] = useState([]);
  const [seeded, setSeeded] = useState(false);

  const missedCount = useMemo(() => {
    return reminders.filter((r) => r.status === "missed").length;
  }, [reminders]);

  const pushToast = (kind, message) => {
    const t = { id: nowKey(), kind, message, createdAt: Date.now() };
    setToasts((prev) => [...prev, t].slice(-4));
  };

  const dismissToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

  async function refreshReminders({ silent = false } = {}) {
    try {
      const rows = await getReminders(USER_ID);
      setReminders(rows);
      if (!silent) {
        // toast logic handled in effect
      }
      return rows;
    } catch (e) {
      if (!silent) pushToast("error", e?.message || "Failed to load reminders");
      return [];
    }
  }

  useEffect(() => {
    refreshReminders({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Auto-seed demo reminders once so dashboard is never empty.
    if (seeded) return;
    if (reminders.length > 0) {
      setSeeded(true);
      return;
    }

    (async () => {
      try {
        await Promise.all([
          setReminder({
            user_id: USER_ID,
            medicine_name: "Metformin",
            time_hhmm: "08:00",
            duration_days: 30,
            priority: 7,
            enabled: true,
          }),
          setReminder({
            user_id: USER_ID,
            medicine_name: "Atorvastatin",
            time_hhmm: "21:00",
            duration_days: 60,
            priority: 6,
            enabled: true,
          }),
          setReminder({
            user_id: USER_ID,
            medicine_name: "Vitamin D3",
            time_hhmm: "12:00",
            duration_days: 10,
            priority: 3,
            enabled: true,
          }),
        ]);

        const rows = await getReminders(USER_ID);
        // Mark the first reminder as taken to produce realistic distribution.
        if (rows.length) {
          await recordDose(
            rows[0].id,
            new Date(rows[0].due_at).toISOString(),
            "taken",
            USER_ID
          );
        }
        await refreshReminders({ silent: true });
        pushToast("info", "Demo reminder data loaded.");
      } catch {
        // ignore; manual setup still available in pages
      } finally {
        setSeeded(true);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders, seeded]);

  useEffect(() => {
    // Notification toasts for missed + about-to-finish.
    const nextSnapshot = {};
    for (const r of reminders) {
      nextSnapshot[r.id] = { status: r.status, aboutToFinish: !!r.about_to_finish };
      const prev = lastReminderSnapshot[r.id];
      if (!prev) continue;

      if (prev.status !== r.status && r.status === "missed") {
        pushToast("error", `Missed dose: ${r.medicine_name} (${r.time_hhmm})`);
      }
      if (!prev.aboutToFinish && r.about_to_finish) {
        pushToast("warning", `About to finish: ${r.medicine_name}`);
      }
    }
    setLastReminderSnapshot(nextSnapshot);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reminders]);

  useEffect(() => {
    const t = setInterval(() => refreshReminders({ silent: true }), 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageProps = {
    user,
    reminders,
    refreshReminders: () => refreshReminders({ silent: false }),
    setActive,
    pushToast,
    USER_ID,
  };

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex items-start gap-4">
          <Sidebar active={active} onChange={setActive} />

          <main className="flex-1">
            <Topbar
              user={user}
              missedCount={missedCount}
              onRefresh={() => refreshReminders({ silent: false })}
            />

            <div className="mt-4">
              {active === "dashboard" && <Dashboard {...pageProps} />}
              {active === "prescriptions" && <Prescriptions {...pageProps} />}
              {active === "reminders" && <Reminders {...pageProps} />}
              {active === "pharmacy" && <Pharmacy {...pageProps} />}
              {active === "chatbot" && <Chatbot {...pageProps} />}
              {active === "profile" && <Profile {...pageProps} />}
            </div>
          </main>
        </div>
      </div>

      <ToastCenter toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

