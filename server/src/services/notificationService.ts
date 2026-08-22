import { NotificationModel, notificationTypes, matchNotificationTiers } from "../models/Notification.js";
import { firstNameAndPhoto } from "./messageService.js";
import { track } from "./analyticsService.js";
import { sendPushToUser } from "./pushService.js";

export type NotificationType = (typeof notificationTypes)[number];
export type MatchNotificationTier = (typeof matchNotificationTiers)[number];

const MATCH_COPY: Record<MatchNotificationTier, { title: string; body: (score: number) => string }> = {
  // Placeholder — no copy was given for the plain "you have a new match" case (only the
  // four high-compatibility tiers had text supplied); adjust here if you want something else.
  new_match: {
    title: "✨ You have a new match!",
    body: (score) => `Someone new could be a fit — ${score}% compatible with you. Take a look.`,
  },
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

export function tierFor(score: number): MatchNotificationTier {
  if (score >= 100) return "perfect";
  if (score >= 98) return "near_perfect";
  if (score >= 90) return "excellent";
  if (score >= 80) return "great";
  return "new_match";
}

/**
 * Called from getMatches() — creates a notification the first time a viewer/candidate
 * pair is seen, and again each time it crosses into a higher tier (80-89 / 90-97 /
 * 98-99 / 100). Idempotent via the model's unique (clerkId, otherClerkId, tier) index
 * (partial, type "match"), so this is safe to call on every matches fetch. There's no
 * background job yet, so a new tier is only detected when the viewer visits /matches.
 */
export async function recordMatchNotificationsIfNeeded(
  clerkId: string,
  candidates: { clerkId: string; compatibility: number }[],
): Promise<void> {
  for (const c of candidates) {
    const tier = tierFor(c.compatibility);
    const copy = MATCH_COPY[tier];
    const result = await NotificationModel.updateOne(
      { clerkId, otherClerkId: c.clerkId, tier },
      {
        $setOnInsert: {
          clerkId,
          otherClerkId: c.clerkId,
          type: "match",
          tier,
          compatibility: c.compatibility,
          title: copy.title,
          message: copy.body(c.compatibility),
        },
      },
      { upsert: true },
    );
    // Only on a genuinely new insert — otherwise this fires on every /matches poll.
    if (result.upsertedCount > 0) {
      sendPushToUser(clerkId, { title: copy.title, body: copy.body(c.compatibility) }).catch(() => {});
      if (tier === "perfect") {
        await track(clerkId, "hundred_percent_match_discovered", { otherClerkId: c.clerkId });
      }
    }
  }
}

/** Notifies the person who WAS unlocked (not the unlocker) — a one-off event, no dedup needed. */
export async function createProfileUnlockedNotification(unlockedClerkId: string, unlockerClerkId: string): Promise<void> {
  const { firstName } = await firstNameAndPhoto(unlockerClerkId);
  const title = "🔓 Someone unlocked your profile!";
  const message = `${firstName || "Someone"} just unlocked your profile and can now message you.`;
  await NotificationModel.create({ clerkId: unlockedClerkId, type: "profile_unlocked", otherClerkId: unlockerClerkId, title, message });
  sendPushToUser(unlockedClerkId, { title, body: message }).catch(() => {});
}

/** Generic account-level notice (e.g. a status change) — no otherClerkId, not deduped. */
export async function createAccountNotification(clerkId: string, title: string, message: string): Promise<void> {
  await NotificationModel.create({ clerkId, type: "account", title, message });
  sendPushToUser(clerkId, { title, body: message }).catch(() => {});
}

export async function getNotifications(clerkId: string) {
  const docs = await NotificationModel.find({ clerkId }).sort({ createdAt: -1 }).limit(30).lean();
  return Promise.all(
    docs.map(async (n) => {
      const other = n.otherClerkId ? await firstNameAndPhoto(n.otherClerkId) : undefined;
      return {
        id: String(n._id),
        type: n.type as NotificationType,
        otherClerkId: n.otherClerkId,
        otherFirstName: other?.firstName,
        otherPhotoUrl: other?.photoUrl,
        tier: n.tier as MatchNotificationTier | undefined,
        compatibility: n.compatibility,
        title: n.title,
        message: n.message,
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
