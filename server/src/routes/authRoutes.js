import express from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../utils/token.js";
import { calculateBmi, classifyBmi, getHealthFlags } from "../utils/bmi.js";
import { requireAuth } from "../middleware/auth.js";
import { verifyFirebaseIdToken } from "../services/firebaseAdmin.js";

const router = express.Router();

function buildInitialPatientProfile(body) {
  const smoke = body.smoke === true || body.smoke === "yes";
  const drink = body.drink === true || body.drink === "yes";
  const diabetes = body.diabetes === true || body.diabetes === "yes";
  const pastMedicalHistory = String(body.pastMedicalHistory || "").trim();
  const profile = {
    smoke,
    drink,
    diabetes,
    pastMedicalHistory,
  };
  profile.healthRiskFlags = getHealthFlags(profile);
  return profile;
}

router.post("/register", async (req, res) => {
  const { role, name, email, password, preferredLanguage } = req.body;
  if (!role || !name || !email || !password) return res.status(400).json({ error: "Missing fields" });
  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email already used" });

  const passwordHash = await bcrypt.hash(password, 10);
  const doc = { role, name, email, passwordHash, preferredLanguage: preferredLanguage || "en" };
  if (role === "patient") {
    doc.patientProfile = buildInitialPatientProfile(req.body);
  }

  const user = await User.create(doc);
  const token = signToken(user);
  return res.json({ token, user });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });
  const token = signToken(user);
  return res.json({ token, user });
});

router.post("/google-mock", async (req, res) => {
  const { email, name, role = "patient", preferredLanguage = "en" } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });
  let user = await User.findOne({ email });
  if (!user) {
    const doc = { email, name: name || email.split("@")[0], role, authProvider: "google", preferredLanguage };
    if (role === "patient") doc.patientProfile = buildInitialPatientProfile(req.body);
    user = await User.create(doc);
  }
  const token = signToken(user);
  return res.json({ token, user });
});

router.post("/google-firebase", async (req, res) => {
  const { idToken, role = "patient", preferredLanguage = "en" } = req.body;
  if (!idToken) return res.status(400).json({ error: "idToken required" });
  const decoded = await verifyFirebaseIdToken(idToken);
  if (!decoded?.email) return res.status(401).json({ error: "Invalid Firebase token or Firebase not configured" });

  let user = await User.findOne({ email: decoded.email });
  if (!user) {
    const doc = {
      email: decoded.email,
      name: decoded.name || decoded.email.split("@")[0],
      role,
      preferredLanguage,
      authProvider: "google",
    };
    if (role === "patient") doc.patientProfile = buildInitialPatientProfile(req.body);
    user = await User.create(doc);
  } else {
    user.preferredLanguage = preferredLanguage || user.preferredLanguage;
    await user.save();
  }

  const token = signToken(user);
  return res.json({ token, user });
});

router.get("/me", requireAuth, async (req, res) => res.json({ user: req.user }));

router.put("/profile", requireAuth, async (req, res) => {
  if (req.user.role !== "patient") return res.status(403).json({ error: "Only patients" });
  const { name, phone, patientProfile } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = String(phone);
  if (patientProfile && typeof patientProfile === "object") {
    const prev = req.user.patientProfile ? req.user.patientProfile.toObject?.() ?? { ...req.user.patientProfile } : {};
    const merged = { ...prev, ...patientProfile };
    const bmi = calculateBmi(merged.weightKg, merged.heightCm);
    merged.bmi = bmi;
    merged.bmiCategory = classifyBmi(bmi);
    merged.healthRiskFlags = getHealthFlags(merged);
    req.user.patientProfile = merged;
  }
  await req.user.save();
  return res.json({ user: req.user });
});

router.put("/onboarding", requireAuth, async (req, res) => {
  if (req.user.role !== "patient") return res.status(403).json({ error: "Only patients can onboard" });
  const profile = req.body || {};
  const bmi = calculateBmi(profile.weightKg, profile.heightCm);
  const bmiCategory = classifyBmi(bmi);
  const patientProfile = { ...profile, bmi, bmiCategory };
  patientProfile.healthRiskFlags = getHealthFlags(patientProfile);
  req.user.patientProfile = patientProfile;
  await req.user.save();
  return res.json({ user: req.user });
});

export default router;

