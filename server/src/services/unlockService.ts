import type { UnlockPerspective } from "@soulsync/shared-types";
import { UnlockModel } from "../models/Unlock.js";
import { spendCoins, unlockCostForCompatibility } from "./coinService.js";
import { getCompatibilityScore } from "./pairCompatibility.js";
import { createProfileUnlockedNotification } from "./notificationService.js";
import { track } from "./analyticsService.js";

/**
 * Spends coins and unlocks the profile. Free no-op (idempotent) once either side has
 * already unlocked the other — that already grants both full profile access and chat
 * (see isUnlockedEitherDirection), so charging the second person for their own direction's
 * record would just be paying again for access they already have.
 */
export async function unlockUser(
  viewerClerkId: string,
  unlockedClerkId: string,
  perspective: UnlockPerspective,
): Promise<{ coinBalance?: number }> {
  if (await isUnlockedEitherDirection(viewerClerkId, unlockedClerkId)) return {};

  // Recomputed server-side, never trusted from the client — but which of the two
  // directional scores to recompute *is* taken from the client, because "yourSoulmates"
  // vs "theirSoulmate" reflects which tab/card the user actually clicked unlock on, and
  // billing the other direction's score silently charges a different price than the one
  // shown on screen. `perspective` only selects which formula runs; the resulting number
  // is still computed fresh from the DB, not trusted as a raw value from the client.
  const compatibility =
    perspective === "theirSoulmate"
      ? await getCompatibilityScore(unlockedClerkId, viewerClerkId)
      : await getCompatibilityScore(viewerClerkId, unlockedClerkId);
  const cost = unlockCostForCompatibility(compatibility);
  const { coinBalance } = await spendCoins(viewerClerkId, cost, unlockedClerkId);

  await UnlockModel.updateOne(
    { viewerClerkId, unlockedClerkId },
    { $setOnInsert: { viewerClerkId, unlockedClerkId } },
    { upsert: true },
  );

  await createProfileUnlockedNotification(unlockedClerkId, viewerClerkId);
  await track(viewerClerkId, "profile_unlocked", { unlockedClerkId, compatibility, cost });

  return { coinBalance };
}

/**
 * Every clerkId that counts as "unlocked" for this viewer, in either direction — used to
 * decide whether a match card still shows a paid "Unlock" CTA. A candidate who already
 * unlocked the viewer belongs here too, since that already grants full mutual access.
 */
export async function getUnlockedEitherDirectionClerkIds(clerkId: string): Promise<Set<string>> {
  const docs = await UnlockModel.find({ $or: [{ viewerClerkId: clerkId }, { unlockedClerkId: clerkId }] }).lean();
  const ids = new Set<string>();
  for (const d of docs) ids.add(d.viewerClerkId === clerkId ? d.unlockedClerkId : d.viewerClerkId);
  return ids;
}

export async function isUnlocked(viewerClerkId: string, targetClerkId: string): Promise<boolean> {
  return Boolean(await UnlockModel.exists({ viewerClerkId, unlockedClerkId: targetClerkId }));
}

/** Either side having unlocked the other is enough to message — lets the unlocked party reply for free. */
export async function isUnlockedEitherDirection(clerkIdA: string, clerkIdB: string): Promise<boolean> {
  const [aUnlockedB, bUnlockedA] = await Promise.all([isUnlocked(clerkIdA, clerkIdB), isUnlocked(clerkIdB, clerkIdA)]);
  return aUnlockedB || bUnlockedA;
}
