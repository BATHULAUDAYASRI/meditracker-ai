import { useEffect, useState } from "react";
import api from "../services/api";

export default function DoctorPage() {
  const [overview, setOverview] = useState(null);
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    (async () => {
      const [o, p] = await Promise.all([api.get("/doctor/overview"), api.get("/doctor/patients")]);
      setOverview(o.data);
      setPatients(p.data.patients || []);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Doctor Overview</h3>
        <pre className="text-sm">{JSON.stringify(overview, null, 2)}</pre>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Patients</h3>
        {patients.map((p) => (
          <div key={p._id} className="mt-2 rounded border p-2">
            <div className="font-medium">{p.name}</div>
            <div className="text-sm text-slate-500">{p.email}</div>
            <div className="text-sm">{(p.patientProfile?.healthRiskFlags || []).join(", ")}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

