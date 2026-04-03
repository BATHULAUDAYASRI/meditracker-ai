import { useEffect, useState } from "react";
import Card from "../components/Card.jsx";
import { getPharmacies, orderMedicine } from "../services/api.js";
import { apiUserId } from "../utils/timeFormat.js";

export default function PharmaciesPage({ auth }) {
  const userId = apiUserId(auth);
  const [list, setList] = useState([]);
  const [err, setErr] = useState("");
  const [orderMsg, setOrderMsg] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const p = await getPharmacies({ lat: 12.97, lng: 77.59, radius_km: 10 });
        setList(Array.isArray(p) ? p : []);
      } catch (e) {
        setErr(String(e.message || e));
      }
    })();
  }, []);

  const refill = async (pharmacyId) => {
    setOrderMsg("");
    try {
      const res = await orderMedicine({
        user_id: userId,
        medication_name: "Ongoing prescription",
        pharmacy_id: pharmacyId,
        quantity: 30,
        refill: true,
      });
      setOrderMsg(`Order ${res.order_id}: ${res.status}`);
    } catch (e) {
      setOrderMsg(String(e.message || e));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Pharmacies</h1>
        <p className="text-sm text-slate-600">Refills and nearby options</p>
      </div>

      <div className="rounded-2xl border border-amber-100 bg-amber-50/90 px-5 py-4 text-sm text-amber-950 shadow-card-sm">
        ⚠️ You will run out of medicines in about <strong className="text-heal-leafDark">10 days</strong>. Plan a
        refill soon.
      </div>

      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      {orderMsg ? <p className="text-sm text-brand-700">{orderMsg}</p> : null}

      <Card title="Map view">
        <div className="relative h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-sky-100 via-slate-50 to-emerald-50">
          <div className="absolute inset-8 rounded-3xl border border-white/60 bg-white/40 backdrop-blur-sm" />
          {list.slice(0, 4).map((p, i) => (
            <div
              key={p.id}
              className="absolute flex flex-col items-center"
              style={{ left: `${20 + i * 18}%`, top: `${25 + (i % 2) * 28}%` }}
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-white text-sm shadow-lg ${
                  i % 2 === 0 ? "bg-red-500 text-white" : "bg-heal-leaf text-white"
                }`}
              >
                +
              </span>
              <span className="mt-1 max-w-[100px] truncate rounded-lg bg-white/95 px-2 py-0.5 text-center text-[10px] font-semibold text-slate-800 shadow">
                {p.name}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Nearby">
        <ul className="divide-y divide-slate-100">
          {list.map((p) => (
            <li key={p.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-slate-900">{p.name}</div>
                <div className="text-sm text-slate-500">
                  {p.address} · {p.distance_km != null ? `${p.distance_km} km` : ""} · ★ {p.rating}
                </div>
                <div className="text-xs text-slate-400">Availability: likely in stock (demo)</div>
              </div>
              <button
                type="button"
                onClick={() => refill(p.id)}
                className="rounded-xl bg-heal-leaf px-4 py-2 text-sm font-semibold text-white hover:bg-heal-leafDark"
              >
                Refill
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
