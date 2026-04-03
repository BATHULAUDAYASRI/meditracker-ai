import cron from "node-cron";
import webpush from "web-push";
import { env } from "../config/env.js";
import { Reminder } from "../models/Reminder.js";
import { PushSubscription } from "../models/PushSubscription.js";

if (env.webPushPublicKey && env.webPushPrivateKey) {
  webpush.setVapidDetails(env.webPushSubject, env.webPushPublicKey, env.webPushPrivateKey);
}

export function startReminderScheduler() {
  cron.schedule("*/1 * * * *", async () => {
    const now = new Date();
    const hhmm = now.toTimeString().slice(0, 5);
    const due = await Reminder.find({ enabled: true, scheduleTime: hhmm });
    for (const r of due) {
      const alreadySent = r.lastNotifiedAt && r.lastNotifiedAt.toISOString().slice(0, 16) === now.toISOString().slice(0, 16);
      if (alreadySent) continue;

      const subs = await PushSubscription.find({ userId: r.patientId });
      for (const s of subs) {
        if (!env.webPushPublicKey || !env.webPushPrivateKey) continue;
        try {
          await webpush.sendNotification(
            s.subscription,
            JSON.stringify({ title: "Medication Reminder", body: `Take ${r.medicineName} (${r.dosage})` })
          );
        } catch {
          // Ignore invalid subscriptions in demo build.
        }
      }

      r.lastNotifiedAt = now;
      await r.save();
    }
  });
}
