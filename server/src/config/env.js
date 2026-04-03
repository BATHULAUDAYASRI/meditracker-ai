import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/meditrack_ai",
  jwtSecret: process.env.JWT_SECRET || "change-me-super-secret",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  apiBaseUrl: process.env.API_BASE_URL || "https://api.openai.com/v1",
  modelName: process.env.MODEL_NAME || "gpt-4o-mini",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  webPushPublicKey: process.env.WEB_PUSH_PUBLIC_KEY || "",
  webPushPrivateKey: process.env.WEB_PUSH_PRIVATE_KEY || "",
  webPushSubject: process.env.WEB_PUSH_SUBJECT || "mailto:you@example.com",
  /** Google Cloud: enable "Places API" and use same key for Places Nearby Search (legacy) */
  googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || "",
};

