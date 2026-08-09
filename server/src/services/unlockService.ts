import { UnlockModel } from "../models/Unlock.js";

/** No payment gate yet — unlocking is free for now, for testing. */
export async function unlockUser(viewerClerkId: string, unlockedClerkId: string): Promise<void> {
  await UnlockModel.updateOne(
    { viewerClerkId, unlockedClerkId },
    { $setOnInsert: { viewerClerkId, unlockedClerkId } },
    { upsert: true },
  );
}

export async function getUnlockedClerkIds(viewerClerkId: string): Promise<Set<string>> {
  const docs = await UnlockModel.find({ viewerClerkId }).lean();
  return new Set(docs.map((d) => d.unlockedClerkId));
}
