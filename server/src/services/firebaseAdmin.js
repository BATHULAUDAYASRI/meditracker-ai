import admin from "firebase-admin";

let initialized = false;

function fromEnv() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKeyRaw) return null;
  return {
    projectId,
    clientEmail,
    privateKey: privateKeyRaw.replace(/\\n/g, "\n"),
  };
}

export function initFirebaseAdmin() {
  if (initialized) return;
  const credentialPayload = fromEnv();
  if (!credentialPayload) return;
  admin.initializeApp({
    credential: admin.credential.cert(credentialPayload),
  });
  initialized = true;
}

export async function verifyFirebaseIdToken(idToken) {
  if (!initialized) return null;
  try {
    return await admin.auth().verifyIdToken(idToken);
  } catch {
    return null;
  }
}

