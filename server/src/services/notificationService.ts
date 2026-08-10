import { NotificationModel, notificationTiers } from "../models/Notification.js";
import { firstNameAndPhoto } from "./messageService.js";

export type NotificationTier = (typeof notificationTiers)[number];

// Placeholder copy — the user is supplying the real per-tier notification text; swap
// these templates out once given (this is the only place that needs to change).
const NOTIFICATION_MESSAGES: Record<NotificationTier, (name: string, score: number) => string> = {
  great: (name, score) => `You have a great match — ${name} is ${score}% compatible with you!`,
  excellent: (name, score) => `You have an excellent match — ${name} is ${score}% compatible with you!`,
  near_perfect: (name, score) => `Almost perfect! ${name} is ${score}% compatible with you.`,
  perfect: (name, score) => `🎉 PERFECT MATCH — ${name} is ${score}% compatible with you!`,
};

export function tierFor(score: number): NotificationTier | null {
  if (score >= 100) return "perfect";
  if (score >= 98) return "near_perfect";
  if (score >= 90) return "excellent";
  if (score >= 80) return "great";
  return null;
}

/**
 * Called from getMatches() — creates a notification the first time a viewer/candidate
 * pair crosses into a tier (80-89 / 90-97 / 98-99 / 100). Idempotent via the model's
 * unique (clerkId, otherClerkId, tier) index, so this is safe to call on every matches
 * fetch. There's no background job yet, so a new tier is only detected when the viewer
 * actually visits /matches.
 */
export async function recordMatchNotificationsIfNeeded(
  clerkId: string,
  candidates: { clerkId: string; compatibility: number }[],
): Promise<void> {
  for (const c of candidates) {
    const tier = tierFor(c.compatibility);
    if (!tier) continue;
    await NotificationModel.updateOne(
      { clerkId, otherClerkId: c.clerkId, tier },
      { $setOnInsert: { clerkId, otherClerkId: c.clerkId, tier, compatibility: c.compatibility } },
      { upsert: true },
    );
  }
}

export async function getNotifications(clerkId: string) {
  const docs = await NotificationModel.find({ clerkId }).sort({ createdAt: -1 }).limit(30).lean();
  return Promise.all(
    docs.map(async (n) => {
      const { firstName, photoUrl } = await firstNameAndPhoto(n.otherClerkId);
      return {
        id: String(n._id),
        otherClerkId: n.otherClerkId,
        otherFirstName: firstName,
        otherPhotoUrl: photoUrl,
        tier: n.tier as NotificationTier,
        compatibility: n.compatibility,
        message: NOTIFICATION_MESSAGES[n.tier as NotificationTier](firstName || "Someone", n.compatibility),
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt ? n.readAt.toISOString() : undefined,
      };
    }),
  );
}

export async function getUnreadNotificationCount(clerkId: string): Promise<number> {
  return NotificationModel.countDocuments({ clerkId, readAt: { $exists: false } });
}

export async function markAllNotificationsRead(clerkId: string): Promise<void> {
  await NotificationModel.updateMany({ clerkId, readAt: { $exists: false } }, { $set: { readAt: new Date() } });
}
