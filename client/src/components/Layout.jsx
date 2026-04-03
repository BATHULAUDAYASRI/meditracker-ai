import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import ChatPanel from "./ChatPanel";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
  }`;

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const isPatient = user?.role === "patient";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to="/" className="text-lg font-semibold tracking-tight text-slate-900">
            MediTrack AI
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-600 sm:inline">{user?.name}</span>
            {isPatient && (
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-800 shadow-sm lg:hidden"
              >
                Chat
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-4 px-4 py-6">
        <aside className="hidden w-52 shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            {isPatient ? (
              <>
                <NavLink to="/prescriptions" className={linkClass}>
                  Prescriptions
                </NavLink>
                <NavLink to="/reminders" className={linkClass}>
                  Daily meds & reminders
                </NavLink>
                <NavLink to="/pharmacies" className={linkClass}>
                  Pharmacies & refill
                </NavLink>
                <NavLink to="/profile" className={linkClass}>
                  Profile
                </NavLink>
              </>
            ) : (
              <NavLink to="/doctor" className={linkClass}>
                Doctor hub
              </NavLink>
            )}
          </nav>
        </aside>

        <main className={`min-w-0 flex-1 pb-24 lg:pb-8 ${isPatient ? "" : "max-w-4xl"}`}>{children}</main>

        {isPatient && (
          <aside className="hidden w-[min(100%,22rem)] shrink-0 lg:block">
            <div className="sticky top-24 h-[calc(100vh-7rem)]">
              <ChatPanel />
            </div>
          </aside>
        )}
      </div>

      {chatOpen && isPatient && (
        <div
          className="fixed inset-0 z-40 flex flex-col bg-black/40 p-4 lg:hidden"
          role="dialog"
          onClick={() => setChatOpen(false)}
        >
          <div
            className="ml-auto flex h-full max-h-[85vh] w-full max-w-md flex-col rounded-2xl bg-white p-2 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end border-b border-slate-100 pb-2">
              <button
                type="button"
                className="rounded-lg px-3 py-1 text-sm text-slate-600"
                onClick={() => setChatOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-hidden">
              <ChatPanel />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
