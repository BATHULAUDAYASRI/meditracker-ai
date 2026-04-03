import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { fetchNearbyPharmacies } from "../services/placesService.js";

const router = express.Router();

router.get("/nearby", requireAuth, async (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  const radiusM = Math.min(Number(req.query.radius) || 5000, 50000);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return res.status(400).json({ error: "Missing or invalid lat/lng" });
  }

  try {
    const out = await fetchNearbyPharmacies(lat, lng, radiusM);
    return res.json(out);
  } catch (e) {
    return res.status(502).json({ error: e.message || "Pharmacy lookup failed" });
  }
});

export default router;
