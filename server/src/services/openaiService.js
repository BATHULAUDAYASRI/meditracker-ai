import OpenAI from "openai";
import { env } from "../config/env.js";

const client = env.openaiApiKey
  ? new OpenAI({ apiKey: env.openaiApiKey, baseURL: env.apiBaseUrl })
  : null;

export async function analyzePrescriptionText(rawText, language = "en") {
  if (!client) {
    return {
      summary: "OpenAI key missing. Add OPENAI_API_KEY in server .env.",
      medications: [],
      nextCheckupInDays: 30,
    };
  }

  const prompt = `Extract medicines from this prescription text and respond as JSON with keys summary, medications[{name,dosage,timing,durationDays}], nextCheckupInDays. Output summary in language: ${language}. Text: ${rawText}`;

  const response = await client.chat.completions.create({
    model: env.modelName,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    response_format: { type: "json_object" },
  });

  const content = response.choices[0]?.message?.content || "{}";
  try {
    const parsed = JSON.parse(content);
    return {
      summary: parsed.summary || "",
      medications: Array.isArray(parsed.medications) ? parsed.medications : [],
      nextCheckupInDays: Number(parsed.nextCheckupInDays || 30),
    };
  } catch {
    return { summary: content, medications: [], nextCheckupInDays: 30 };
  }
}

export async function chatWithHealthAssistant(message, language = "en") {
  if (!client) {
    return `OpenAI key missing. Please configure OPENAI_API_KEY. (${language})`;
  }
  const response = await client.chat.completions.create({
    model: env.modelName,
    messages: [
      { role: "system", content: "You are a safe healthcare assistant. Avoid diagnosis certainty." },
      { role: "user", content: `Reply in ${language}. User message: ${message}` },
    ],
    temperature: 0.4,
  });
  return response.choices[0]?.message?.content || "I could not generate a response.";
}
