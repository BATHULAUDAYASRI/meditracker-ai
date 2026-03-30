import { useEffect, useMemo, useState } from "react";
import { getPharmacies, orderMedicine } from "../services/api.js";

export default function Pharmacy({ reminders, pushToast }) {
  const [pharmacies, setPharmacies] = useState([]);
  const [busy, setBusy] = useState(null);
  const [geoBusy, setGeoBusy] = useState(false);
  const [radiusKm, setRadiusKm] = useState(5.0);
  const [sortBy, setSortBy] = useState("distance");

  const meds = useMemo(() => {
    const s = new Set((reminders || []).map((r) => r.medicine_name));
    return [...s].sort();
  }, [reminders]);

  const refillCandidates = useMemo(() => {
    return reminders
      .filter((r) => r.about_to_finish)
      .map((r) => r.medicine_name);
  }, [reminders]);

  const [selectedMedication, setSelectedMedication] = useState(
    meds[0] || "Metformin"
  );

  useEffect(() => {
    if (meds.length && !meds.includes(selectedMedication)) {
      setSelectedMedication(meds[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meds]);

  const fetchNearby = async (coords) => {
    setBusy("loading-pharmacies");
    try {
      const rows = await getPharmacies({
        lat: coords?.lat,
        lng: coords?.lng,
        radius_km: radiusKm,
      });
      setPharmacies(rows);
      pushToast?.("success", `Found ${rows.length} nearby pharmacies.`);
    } catch (e) {
      pushToast?.("error", e?.message || "Failed to load pharmacies");
    } finally {
      setBusy(null);
    }
  };

  const handleUseLocation = async () => {
    setGeoBusy(true);
    try {
      if (!navigator.geolocation) throw new Error("Geolocation not supported");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          fetchNearby({ lat: pos.coords.latitude, lng: pos.coords.longitude }).finally(
            () => setGeoBusy(false)
          );
        },
        (err) => {
          pushToast?.("error", err?.message || "Location permission denied");
          setGeoBusy(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (e) {
      pushToast?.("error", e?.message || "Failed to get location");
      setGeoBusy(false);
    }
  };

  const doOrder = async ({ pharmacyId, refill }) => {
    if (!selectedMedication) {
      pushToast?.("warning", "Choose a medication first");
      return;
    }
    setBusy(`order-${pharmacyId}-${refill ? "refill" : "buy"}`);
    try {
      const r = await orderMedicine({
        medication_name: selectedMedication,
        pharmacy_id: pharmacyId,
        quantity: 30,
        refill,
      });
      pushToast?.(
        "success",
        `Order placed: ${selectedMedication} (${refill ? "refill" : "new"}) · ETA: ${r.estimated_delivery}`
      );
    } catch (e) {
      pushToast?.("error", e?.message || "Order failed");
    } finally {
      setBusy(null);
    }
  };

  const sortedPharmacies = useMemo(() => {
    const rows = [...pharmacies];
    if (sortBy === "rating") {
      rows.sort((a, b) => b.rating - a.rating);
    } else {
      rows.sort((a, b) => a.distance_km - b.distance_km);
    }
    return rows;
  }, [pharmacies, sortBy]);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Pharmacy</h2>
        <div className="text-sm text-slate-400">
          Find nearby pharmacies and place refill orders (mock).
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 block">Medication</label>
              <select
                className="mt-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm"
                value={selectedMedication}
                onChange={(e) => setSelectedMedication(e.target.value)}
              >
                {meds.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                {!meds.length ? (
                  <option value={selectedMedication}>{selectedMedication}</option>
                ) : null}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block">Radius (km)</label>
              <input
                type="number"
                min="1"
                step="0.5"
                value={radiusKm}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="mt-1 w-28 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm"
            >
              <option value="distance">Sort by distance</option>
              <option value="rating">Sort by rating</option>
            </select>
            <button
              className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-750 transition text-sm disabled:opacity-50"
              onClick={handleUseLocation}
              disabled={geoBusy}
            >
              {geoBusy ? "Getting location..." : "Use my location"}
            </button>
          </div>
        </div>
        {busy === "loading-pharmacies" ? (
          <div className="text-sm text-slate-300">Loading pharmacies...</div>
        ) : null}
        {!!refillCandidates.length ? (
          <div className="text-xs text-amber-200">
            Refill suggestion: {Array.from(new Set(refillCandidates)).join(", ")}
          </div>
        ) : (
          <div className="text-xs text-slate-400">
            No refill urgency detected from reminders yet.
          </div>
        )}
      </div>

      {!pharmacies.length ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4 text-sm text-slate-300">
          Click “Use my location” to load nearby pharmacies (mock results).
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sortedPharmacies.map((p) => (
          <div
            key={p.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/30 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{p.name}</div>
                <div className="text-sm text-slate-300 mt-1">{p.address}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">Distance</div>
                <div className="font-semibold">{p.distance_km} km</div>
                <div className="text-xs text-slate-400 mt-1">Rating</div>
                <div className="font-semibold">{p.rating.toFixed(1)} / 5</div>
              </div>
            </div>

            <div className="flex gap-2 mt-4 flex-wrap">
              <button
                className="px-3 py-2 rounded-xl bg-brand-900 border border-brand-800 hover:bg-brand-900 transition text-xs disabled:opacity-50"
                onClick={() => doOrder({ pharmacyId: p.id, refill: false })}
                disabled={busy === `order-${p.id}-buy`}
              >
                {busy === `order-${p.id}-buy` ? "Ordering..." : "Order Medicine"}
              </button>
              <button
                className="px-3 py-2 rounded-xl bg-emerald-950/40 border border-emerald-800 hover:bg-emerald-950 transition text-xs disabled:opacity-50"
                onClick={() => doOrder({ pharmacyId: p.id, refill: true })}
                disabled={busy === `order-${p.id}-refill`}
              >
                {busy === `order-${p.id}-refill` ? "Refilling..." : "Refill Prescription"}
              </button>
              <a
                className="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 transition text-xs"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`}
                target="_blank"
                rel="noreferrer"
              >
                Open in Maps
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

