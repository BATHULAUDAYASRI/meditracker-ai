import express from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth.js";
import { Prescription } from "../models/Prescription.js";
import { Reminder } from "../models/Reminder.js";
import { analyzePrescriptionText } from "../services/openaiService.js";
import { extractPrescriptionText } from "../services/ocrService.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

function inferTimeSlot(timing) {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(timing || ""));
  if (!m) return "";
  const h = Number(m[1]);
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  if (req.user.role !== "patient") return res.status(403).json({ error: "Only patients can upload" });
  const fileText = await extractPrescriptionText(req.file?.path, req.file?.mimetype || "");
  const rawText = (req.body.rawText || fileText || "").trim();
  if (!rawText) return res.status(400).json({ error: "No prescription text found. Upload a clearer file or provide rawText." });
  const language = req.body.language || req.user.preferredLanguage || "en";
  const analysis = await analyzePrescriptionText(rawText, language);
  const nextCheckup = new Date();
  nextCheckup.setDate(nextCheckup.getDate() + Number(analysis.nextCheckupInDays || 30));

  const prescription = await Prescription.create({
    patientId: req.user._id,
    fileName: req.file?.originalname || "manual-entry.txt",
    fileUrl: req.file?.path || "",
    extractedText: rawText,
    medications: analysis.medications || [],
    aiSummary: analysis.summary || "",
    suggestedNextCheckup: nextCheckup,
  });

  for (const med of prescription.medications) {
    if (!med.timing) continue;
    await Reminder.create({
      patientId: req.user._id,
      medicineName: med.name,
      dosage: med.dosage,
      scheduleTime: med.timing,
      timeSlot: inferTimeSlot(med.timing),
      scheduleLabel: "from_prescription",
      enabled: true,
    });
  }

  return res.json({ prescription, autoRemindersCreated: prescription.medications.length });
});

router.get("/", requireAuth, async (req, res) => {
  if (req.user.role === "doctor") {
    const all = await Prescription.find().populate("patientId", "name email");
    return res.json({ prescriptions: all });
  }
  const mine = await Prescription.find({ patientId: req.user._id });
  return res.json({ prescriptions: mine });
});

export default router;

