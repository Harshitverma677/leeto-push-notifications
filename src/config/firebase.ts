import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "./env.js";

function parseServiceAccount() {
  try {
    const account: unknown = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    if (!account || typeof account !== "object" || !("client_email" in account) || !("private_key" in account)) {
      throw new Error("Service account JSON is missing client_email or private_key.");
    }
    return account as { project_id?: string; client_email: string; private_key: string };
  } catch (error) {
    throw new Error(`FIREBASE_SERVICE_ACCOUNT_JSON is not valid service account JSON: ${String(error)}`);
  }
}

const serviceAccount = parseServiceAccount();
if (serviceAccount.project_id && serviceAccount.project_id !== env.FIREBASE_PROJECT_ID) {
  throw new Error("Service account project_id does not match FIREBASE_PROJECT_ID.");
}

const app = getApps()[0] ?? initializeApp({
  credential: cert({ ...serviceAccount, projectId: env.FIREBASE_PROJECT_ID })
});

export const db = getFirestore(app);
export const messaging = getMessaging(app);
