import Card from "../components/Card.jsx";

export default function SettingsPage({ auth, onboarding, onResetOnboarding }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-600">Account and preferences</p>
      </div>

      <Card title="Account">
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="text-slate-500">Sign-in:</span> {auth.provider}
          </p>
          <p>
            <span className="text-slate-500">Email:</span> {auth.email}
          </p>
        </div>
      </Card>

      <Card title="Health preferences">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="text-slate-500">Exercise</div>
            <div className="mt-1 font-semibold text-slate-900">
              {onboarding.exercise ? "Regular" : "Not regular"}
            </div>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3">
            <div className="text-slate-500">Lifestyle</div>
            <div className="mt-1 font-semibold text-slate-900">
              {onboarding.smoke || onboarding.alcohol ? "Review with clinician" : "Low concern"}
            </div>
          </div>
        </div>
      </Card>

      <Card title="Data & onboarding">
        <p className="mb-3 text-sm text-slate-600">
          Re-run the onboarding questionnaire to update height, weight, and history.
        </p>
        <button
          type="button"
          onClick={onResetOnboarding}
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100"
        >
          Reset onboarding
        </button>
      </Card>
    </div>
  );
}
