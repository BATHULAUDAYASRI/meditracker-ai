import { useState } from "react";
import Card from "../components/Card.jsx";

export default function AuthPage({ onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const doGoogle = () => {
    onLogin({
      role: "patient",
      fullName: name.trim() || "Sarah Johnson",
      email: "sarah@meditrack.app",
      provider: "google",
    });
  };

  const doEmail = (e) => {
    e.preventDefault();
    const em = email.trim() || "user@meditrack.ai";
    onLogin({
      role: "patient",
      fullName: name.trim() || em.split("@")[0].replace(/\./g, " ") || "MediTrack User",
      email: em,
      provider: "email",
    });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#e8f2ff] via-heal-bg to-[#e6faf0]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(59,130,246,0.12),_transparent_50%),radial-gradient(ellipse_at_bottom_left,_rgba(34,197,94,0.1),_transparent_45%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-heal-leaf to-emerald-600 text-white shadow-lg">
            <svg className="h-9 w-9" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21s-8-4.5-8-11a8 8 0 0116 0c0 6.5-8 11-8 11z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">MediTrack AI</h1>
          <p className="mt-2 text-sm text-slate-600">
            Smart reminders, refills, and guidance in one calm dashboard.
          </p>
        </div>

        <Card title="Sign in" className="shadow-card">
          <div className="space-y-4">
            <button
              type="button"
              onClick={doGoogle}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </button>

            <div className="relative py-2 text-center text-xs text-slate-400">
              <span className="relative z-10 bg-white px-2">or continue with email</span>
              <span className="absolute inset-x-0 top-1/2 z-0 h-px -translate-y-1/2 bg-slate-200" />
            </div>

            <form onSubmit={doEmail} className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Full name (optional)</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-slate-900 outline-none ring-brand-500/20 focus:ring-2"
                  placeholder="Sarah Johnson"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-slate-900 outline-none ring-brand-500/20 focus:ring-2"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-slate-900 outline-none ring-brand-500/20 focus:ring-2"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-500 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-600"
              >
                Sign in
              </button>
            </form>

            <p className="text-center text-xs text-slate-500">
              Demo mode: sign-in is local only. Replace with real OAuth and auth API when ready.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
