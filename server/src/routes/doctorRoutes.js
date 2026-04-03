import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { User } from "../models/User.js";
import { Reminder } from "../models/Reminder.js";
import { Prescription } from "../models/Prescription.js";

const router = express.Router();

router.get("/patients", requireAuth, requireRole("doctor"), async (_req, res) => {
  const patients = await User.find({ role: "patient" }).select("name email patientProfile preferredLanguage");
  return res.json({ patients });
});

router.get("/overview", requireAuth, requireRole("doctor"), async (_req, res) => {
  const [patientCount, reminderCount, prescriptionCount] = await Promise.all([
    User.countDocuments({ role: "patient" }),
    Reminder.countDocuments(),
    Prescription.countDocuments(),
  ]);
  return res.json({ patientCount, reminderCount, prescriptionCount });
});

export default router;

