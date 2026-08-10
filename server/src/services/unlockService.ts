import { UnlockModel } from "../models/Unlock.js";
import { spendCoins, unlockCostForCompatibility } from "./coinService.js";
import { getCompatibilityScore } from "./pairCompatibility.js";

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

  return { coinBalance };
}

export async function getUnlockedClerkIds(viewerClerkId: string): Promise<Set<string>> {
  const docs = await UnlockModel.find({ viewerClerkId }).lean();
  return new Set(docs.map((d) => d.unlockedClerkId));
}
