import { NotificationModel, notificationTiers } from "../models/Notification.js";
import { firstNameAndPhoto } from "./messageService.js";

export type NotificationTier = (typeof notificationTiers)[number];

const NOTIFICATION_COPY: Record<NotificationTier, { title: string; body: (score: number) => string }> = {
  great: {
    title: "❤️ We found a strong match!",
    body: (score) => `Someone new is waiting for you with an ${score}% compatibility. Take a look and see where the connection leads.`,
  },
  excellent: {
    title: "🔥 This could be something special...",
    body: (score) => `You have a ${score}% compatibility with someone new. That's an exceptionally strong match. 👀`,
  },
  near_perfect: {
    title: "💘 Almost perfect!",
    body: (score) => `Someone new is ${score}% compatible with you. You're incredibly close to a perfect match. Don't miss this one.`,
  },
  perfect: {
    title: "❤️‍🔥 WE FOUND YOUR PERFECT MATCH!",
    body: () => `You have a 100% compatibility with someone. Every answer matched perfectly. Is this the one? 👀❤️`,
  },
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
      const copy = NOTIFICATION_COPY[n.tier as NotificationTier];
      return {
        id: String(n._id),
        otherClerkId: n.otherClerkId,
        otherFirstName: firstName,
        otherPhotoUrl: photoUrl,
        tier: n.tier as NotificationTier,
        compatibility: n.compatibility,
        title: copy.title,
        message: copy.body(n.compatibility),
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
