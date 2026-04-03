import Card from "../components/Card.jsx";

export default function ProfilePage({ auth, onboarding, onNavigate }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
          <p className="text-sm text-slate-600">Your MediTrack details</p>
        </div>
        {onNavigate ? (
          <button
            type="button"
            onClick={() => onNavigate("settings")}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 md:hidden"
          >
            Settings
          </button>
        ) : null}
      </div>

      <Card title="Account">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-slate-500">Name</span>
            <div className="font-semibold text-slate-900">{onboarding.fullName}</div>
          </div>
          <div>
            <span className="text-slate-500">Email</span>
            <div className="font-semibold text-slate-900">{auth.email}</div>
          </div>
          <div>
            <span className="text-slate-500">Gender</span>
            <div className="font-semibold text-slate-900">{onboarding.gender}</div>
          </div>
          <div>
            <span className="text-slate-500">Age</span>
            <div className="font-semibold text-slate-900">{onboarding.age}</div>
          </div>
        </div>
      </Card>

      <Card title="Vitals">
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <span className="text-slate-500">Height / Weight</span>
            <div className="font-semibold text-slate-900">
              {onboarding.heightCm} cm / {onboarding.weightKg} kg
            </div>
          </div>
          <div>
            <span className="text-slate-500">BMI</span>
            <div className="font-semibold text-slate-900">
              {onboarding.bmi} ({onboarding.bmiCategory})
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-slate-500">Date of birth</span>
            <div className="font-semibold text-slate-900">{onboarding.dob}</div>
          </div>
        </div>
      </Card>

      <Card title="Medical notes">
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="text-slate-500">Diabetes:</span> {onboarding.diabetes ? "Yes" : "No"}
          </p>
          <p>
            <span className="text-slate-500">Blood pressure:</span> {onboarding.bpIssues ? "Yes" : "No"}
          </p>
          <p>
            <span className="text-slate-500">Past history:</span> {onboarding.pastHistory || "—"}
          </p>
          <p>
            <span className="text-slate-500">Current meds:</span> {onboarding.currentMeds || "—"}
          </p>
        </div>
      </Card>
    </div>
  );
}
