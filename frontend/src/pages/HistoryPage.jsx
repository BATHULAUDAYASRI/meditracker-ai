import Card from "../components/Card.jsx";

export default function HistoryPage({ onboarding }) {
  return (
    <div className="space-y-4">
      <Card title="History">
        <p className="text-sm text-slate-300">
          This section can store visit history, prescriptions, and trends.
          For now, showing onboarding snapshot.
        </p>
      </Card>
      <Card title="Onboarding Snapshot">
        <pre className="text-xs whitespace-pre-wrap bg-slate-950/40 border border-slate-800 rounded-xl p-3">
          {JSON.stringify(onboarding, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

