import app from "./app.js";
import { env } from "./config/env.js";
import { connectDb } from "./config/db.js";
import { startReminderScheduler } from "./services/reminderScheduler.js";
import { initFirebaseAdmin } from "./services/firebaseAdmin.js";

async function start() {
  await connectDb();
  initFirebaseAdmin();
  startReminderScheduler();
  app.listen(env.port, "0.0.0.0", () => {
    console.log(`Server listening on 0.0.0.0:${env.port} (Docker + local)`);
  });
}

start().catch((err) => {
  console.error("Startup failed:", err);
  process.exit(1);
});

