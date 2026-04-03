import axios from "axios";

/**
 * Production: always call the API on the same host you opened (e.g. :5173/api → nginx → Node).
 * Development: optional VITE_API_URL override; otherwise same-origin + Vite proxy.
 */
function resolveApiBase() {
  const fromEnv = import.meta.env.VITE_API_URL;
  const trimmed = fromEnv && String(fromEnv).trim();

  if (import.meta.env.PROD && typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  if (!import.meta.env.PROD && trimmed) return trimmed;
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/api`;
  }
  return trimmed || "/api";
}

const api = axios.create({
  baseURL: resolveApiBase(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("meditrack_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
