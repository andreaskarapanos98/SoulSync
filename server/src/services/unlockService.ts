import { UnlockModel } from "../models/Unlock.js";
import { UNLOCK_COST_COINS, spendCoins } from "./coinService.js";

/** Spends coins and unlocks the profile. Already-unlocked is a free no-op (idempotent). */
export async function unlockUser(viewerClerkId: string, unlockedClerkId: string): Promise<{ coinBalance?: number }> {
  const existing = await UnlockModel.findOne({ viewerClerkId, unlockedClerkId });
  if (existing) return {};

  const { coinBalance } = await spendCoins(viewerClerkId, UNLOCK_COST_COINS, unlockedClerkId);

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
