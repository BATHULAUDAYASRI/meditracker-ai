import express from "express";
import path from "path";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import prescriptionRoutes from "./routes/prescriptionRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import doctorRoutes from "./routes/doctorRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import pharmacyRoutes from "./routes/pharmacyRoutes.js";
import adherenceRoutes from "./routes/adherenceRoutes.js";
import { resolveStaticDir } from "./staticServe.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use("/uploads", express.static("uploads"));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/doctor", doctorRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/pharmacy", pharmacyRoutes);
app.use("/api/adherence", adherenceRoutes);

const staticDir = resolveStaticDir();
if (staticDir) {
  app.use(express.static(staticDir));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.join(staticDir, "index.html"));
  });
} else {
  app.get("/", (_req, res) => {
    res.json({
      service: "MediTrack AI API",
      mode: "api-only",
      hint: "No React build found. From repo root: cd client && npm run build, or use Docker Dockerfile.node.",
      health: "/api/health",
    });
  });
}

export default app;
