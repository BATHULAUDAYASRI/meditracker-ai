import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { chatWithHealthAssistant } from "../services/openaiService.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const { message, language } = req.body;
  if (!message) return res.status(400).json({ error: "message is required" });
  const reply = await chatWithHealthAssistant(message, language || req.user.preferredLanguage || "en");
  return res.json({ reply });
});

export default router;

