import { useState } from "react";
import api from "../services/api";

export default function PharmaciesPage() {
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [source, setSource] = useState("");
  const [pharmacies, setPharmacies] = useState([]);

  const useMyLocation = () => {
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation is not supported in this browser.");
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude.toFixed(5)));
        setLng(String(pos.coords.longitude.toFixed(5)));
        setLoading(false);
      },
      () => {
        setLoading(false);
        setError("Could not read your location. Allow location access or enter coordinates manually.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  };

  const search = async () => {
    setError("");
    const la = Number(lat);
    const ln = Number(lng);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) {
      setError("Enter valid latitude and longitude, or use “Use my location”.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get("/pharmacy/nearby", { params: { lat: la, lng: ln, radius: 5000 } });
      setSource(data.source || "");
      setPharmacies(data.pharmacies || []);
      if (!data.pharmacies?.length) setError("No pharmacies found nearby. Try a larger city area.");
    } catch (e) {
      setError(e.response?.data?.error || "Failed to load pharmacies.");
      setPharmacies([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Nearby pharmacies</h2>
        <p className="mt-1 text-sm text-slate-600">
          Uses Google Places (server-side) when <code className="rounded bg-slate-100 px-1">GOOGLE_MAPS_API_KEY</code> is set;
          otherwise shows a demo entry. Open a location in Google Maps to navigate for refills.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={useMyLocation}
            className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white"
          >
            Use my location
          </button>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Latitude"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
          />
          <input
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
            placeholder="Longitude"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={search}
          disabled={loading}
          className="mt-3 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Searching…" : "Find pharmacies for refill"}
        </button>
        {source && (
          <p className="mt-2 text-xs text-slate-500">Data source: {source}</p>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {pharmacies.map((p) => (
          <div key={p.id || p.name} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-slate-900">{p.name}</h3>
                {p.address && <p className="mt-1 text-sm text-slate-600">{p.address}</p>}
              </div>
              {p.distanceKm != null && (
                <span className="shrink-0 rounded-full bg-sky-50 px-2 py-1 text-xs font-medium text-sky-800">
                  {p.distanceKm} km
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
              {p.rating != null && <span>★ {p.rating}</span>}
              {p.userRatingsTotal != null && <span>({p.userRatingsTotal} reviews)</span>}
              {p.openNow === true && <span className="text-emerald-600">Open now</span>}
              {p.openNow === false && <span className="text-amber-600">May be closed</span>}
            </div>
            {p.mapsUrl && (
              <a
                href={p.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
              >
                Open in Google Maps — refill
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
