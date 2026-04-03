import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Reminder } from "../models/Reminder.js";
import { PushSubscription } from "../models/PushSubscription.js";

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  const reminders = await Reminder.find({ patientId: req.user._id }).sort({ createdAt: -1 });
  return res.json({ reminders });
});

router.post("/", requireAuth, async (req, res) => {
  const reminder = await Reminder.create({ ...req.body, patientId: req.user._id });
  return res.status(201).json({ reminder });
});

/** Log "taken" now for all of the patient's reminders (today's medications done). */
router.post("/mark-today-done", requireAuth, async (req, res) => {
  const reminders = await Reminder.find({ patientId: req.user._id, enabled: true });
  const now = new Date();
  for (const r of reminders) {
    r.adherenceLogs.push({ at: now, status: "taken" });
    await r.save();
  }
  return res.json({ ok: true, count: reminders.length });
});

router.put("/:id/log", requireAuth, async (req, res) => {
  const reminder = await Reminder.findOne({ _id: req.params.id, patientId: req.user._id });
  if (!reminder) return res.status(404).json({ error: "Not found" });
  reminder.adherenceLogs.push({ at: new Date(), status: req.body.status || "taken" });
  await reminder.save();
  return res.json({ reminder });
});

router.post("/subscribe", requireAuth, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription) return res.status(400).json({ error: "Subscription required" });
  await PushSubscription.findOneAndUpdate(
    { userId: req.user._id, "subscription.endpoint": subscription.endpoint },
    { userId: req.user._id, subscription },
    { upsert: true, new: true }
  );
  return res.json({ success: true });
});

export default router;

