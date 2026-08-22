import { cert, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { env } from "../config/env.js";
import { DeviceTokenModel } from "../models/DeviceToken.js";

const serviceAccount = JSON.parse(Buffer.from(env.firebaseServiceAccountB64, "base64").toString("utf8"));
const app = initializeApp({ credential: cert(serviceAccount) });
const messaging = getMessaging(app);

/**
 * Sends a system-tray push to every device registered for clerkId. Uses a "notification"
 * payload (title/body) rather than data-only — Android shows this in the tray by itself
 * only while the app is backgrounded/closed; in the foreground the app already has the
 * update live via Socket.IO, so no extra suppression logic is needed on either side.
 */
export async function sendPushToUser(
  clerkId: string,
  { title, body, data }: { title: string; body: string; data?: Record<string, string> },
): Promise<void> {
  const tokens = await DeviceTokenModel.find({ clerkId }).lean();
  if (tokens.length === 0) return;

  const result = await messaging.sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    notification: { title, body },
    data,
    android: { priority: "high" },
  });

  const deadTokens = result.responses
    .map((r, i) => (!r.success && isUnregistered(r.error?.code) ? tokens[i].token : undefined))
    .filter((t): t is string => !!t);
  if (deadTokens.length > 0) {
    await DeviceTokenModel.deleteMany({ token: { $in: deadTokens } });
  }
}

function isUnregistered(code: string | undefined): boolean {
  return code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
}

export async function registerDeviceToken(clerkId: string, token: string): Promise<void> {
  // Same physical device can hand back the same FCM token under a different signed-in
  // user (e.g. sign out, sign in as someone else) — move it rather than leaving a stale
  // duplicate pointed at the old owner.
  await DeviceTokenModel.updateOne({ token }, { $set: { clerkId, platform: "android" } }, { upsert: true });
}

export async function unregisterDeviceToken(token: string): Promise<void> {
  await DeviceTokenModel.deleteOne({ token });
}
