import { UnlockModel } from "../models/Unlock.js";
import { spendCoins, unlockCostForCompatibility } from "./coinService.js";
import { getCompatibilityScore } from "./pairCompatibility.js";
import { createProfileUnlockedNotification } from "./notificationService.js";

/** Spends coins and unlocks the profile. Already-unlocked is a free no-op (idempotent). */
export async function unlockUser(viewerClerkId: string, unlockedClerkId: string): Promise<{ coinBalance?: number }> {
  const existing = await UnlockModel.findOne({ viewerClerkId, unlockedClerkId });
  if (existing) return {};

  // Recomputed server-side, never trusted from the client — the cost tier is keyed to
  // the real compatibility score, not whatever number happened to be shown in the UI.
  const compatibility = await getCompatibilityScore(viewerClerkId, unlockedClerkId);
  const cost = unlockCostForCompatibility(compatibility);
  const { coinBalance } = await spendCoins(viewerClerkId, cost, unlockedClerkId);

  await UnlockModel.updateOne(
    { viewerClerkId, unlockedClerkId },
    { $setOnInsert: { viewerClerkId, unlockedClerkId } },
    { upsert: true },
  );

  await createProfileUnlockedNotification(unlockedClerkId, viewerClerkId);

  return { coinBalance };
}

export async function getUnlockedClerkIds(viewerClerkId: string): Promise<Set<string>> {
  const docs = await UnlockModel.find({ viewerClerkId }).lean();
  return new Set(docs.map((d) => d.unlockedClerkId));
}

export async function isUnlocked(viewerClerkId: string, targetClerkId: string): Promise<boolean> {
  return Boolean(await UnlockModel.exists({ viewerClerkId, unlockedClerkId: targetClerkId }));
}

/** Either side having unlocked the other is enough to message — lets the unlocked party reply for free. */
export async function isUnlockedEitherDirection(clerkIdA: string, clerkIdB: string): Promise<boolean> {
  const [aUnlockedB, bUnlockedA] = await Promise.all([isUnlocked(clerkIdA, clerkIdB), isUnlocked(clerkIdB, clerkIdA)]);
  return aUnlockedB || bUnlockedA;
}
