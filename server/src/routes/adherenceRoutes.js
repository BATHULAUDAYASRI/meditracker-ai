import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { Reminder } from "../models/Reminder.js";

const router = express.Router();

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function localDayKey(d) {
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

router.get("/daily", requireAuth, async (req, res) => {
  const reminders = await Reminder.find({ patientId: req.user._id });
  const today = startOfDay(new Date());
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = localDayKey(day);
    days.push({ date: key, taken: 0, missed: 0 });
  }

  const dayIndex = (date) => days.findIndex((d) => d.date === localDayKey(date));

  for (const r of reminders) {
    for (const log of r.adherenceLogs || []) {
      const idx = dayIndex(new Date(log.at));
      if (idx < 0) continue;
      if (log.status === "taken") days[idx].taken += 1;
      else if (log.status === "missed") days[idx].missed += 1;
    }
  }

  const withRate = days.map((d) => {
    const total = d.taken + d.missed;
    const rate = total === 0 ? null : Math.round((d.taken / total) * 100);
    return { ...d, rate };
  });

  const last7 = withRate;
  const totalTaken = last7.reduce((s, d) => s + d.taken, 0);
  const totalMissed = last7.reduce((s, d) => s + d.missed, 0);
  const overall = totalTaken + totalMissed === 0 ? null : Math.round((totalTaken / (totalTaken + totalMissed)) * 100);

  return res.json({ days: withRate, overallConsistency: overall, activeReminders: reminders.length });
});

export default router;
