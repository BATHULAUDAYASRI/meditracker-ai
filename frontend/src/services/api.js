const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

async function jsonOrText(res) {
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}

export async function uploadPrescription(file, user_id = "demo_user") {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(
    `${API_BASE_URL}/upload-prescription?user_id=${encodeURIComponent(user_id)}`,
    {
    method: "POST",
    body: form,
    }
  );
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function analyzePrescription(extracted_text, user_id = "demo_user") {
  const res = await fetch(`${API_BASE_URL}/analyze-prescription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ extracted_text, user_id }),
  });
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function getReminders(user_id = "demo_user") {
  const res = await fetch(`${API_BASE_URL}/reminders?user_id=${encodeURIComponent(user_id)}`);
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function setReminder(payload) {
  const res = await fetch(`${API_BASE_URL}/set-reminder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function toggleReminder(reminder_id, enabled, user_id = "demo_user") {
  const res = await fetch(`${API_BASE_URL}/reminders/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reminder_id, enabled, user_id }),
  });
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function recordDose(reminder_id, due_at_iso, status, user_id = "demo_user") {
  const res = await fetch(`${API_BASE_URL}/reminders/record-dose`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reminder_id, due_at: due_at_iso, status, user_id }),
  });
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function getPharmacies(params) {
  const qs = new URLSearchParams();
  if (params?.lat != null) qs.set("lat", String(params.lat));
  if (params?.lng != null) qs.set("lng", String(params.lng));
  if (params?.radius_km != null) qs.set("radius_km", String(params.radius_km));
  const res = await fetch(`${API_BASE_URL}/pharmacies?${qs.toString()}`);
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function orderMedicine({ medication_name, pharmacy_id, quantity = 30, refill = false, user_id = "demo_user" }) {
  const res = await fetch(`${API_BASE_URL}/order-medicine`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, medication_name, pharmacy_id, quantity, refill }),
  });
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function chat({ message, session_id = "default", user_id = "demo_user" }) {
  const res = await fetch(`${API_BASE_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id, session_id, message }),
  });
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

export async function chatHistory({ session_id = "default", user_id = "demo_user" }) {
  const res = await fetch(
    `${API_BASE_URL}/chat/history?session_id=${encodeURIComponent(session_id)}&user_id=${encodeURIComponent(user_id)}`
  );
  if (!res.ok) throw new Error(await jsonOrText(res));
  return res.json();
}

