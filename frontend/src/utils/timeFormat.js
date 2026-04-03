/** @param {string} hhmm "HH:MM" 24h */
export function formatHHMM12(hhmm) {
  if (!hhmm || typeof hhmm !== "string") return "";
  const parts = hhmm.trim().split(":");
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m)) return hhmm;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function greetingForHour(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

export function apiUserId(auth) {
  return (auth?.email || "user@meditrack.ai").replace(/[^a-zA-Z0-9@._-]/g, "_");
}

export function displayFirstName(full) {
  return (full || "there").trim().split(/\s+/)[0] || "there";
}
