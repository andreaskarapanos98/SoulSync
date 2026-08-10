import { BlockModel } from "../models/Block.js";

export async function blockUser(blockerClerkId: string, blockedClerkId: string): Promise<void> {
  if (blockerClerkId === blockedClerkId) throw new Error("Can't block yourself");
  await BlockModel.updateOne(
    { blockerClerkId, blockedClerkId },
    { $setOnInsert: { blockerClerkId, blockedClerkId } },
    { upsert: true },
  );
}

export async function unblockUser(blockerClerkId: string, blockedClerkId: string): Promise<void> {
  await BlockModel.deleteOne({ blockerClerkId, blockedClerkId });
}

export async function getBlockedClerkIds(blockerClerkId: string): Promise<Set<string>> {
  const docs = await BlockModel.find({ blockerClerkId }).lean();
  return new Set(docs.map((d) => d.blockedClerkId));
}

/** Union of who `clerkId` blocked and who blocked `clerkId` — either direction hides them from matches. */
export async function getMutuallyBlockedClerkIds(clerkId: string): Promise<Set<string>> {
  const docs = await BlockModel.find({ $or: [{ blockerClerkId: clerkId }, { blockedClerkId: clerkId }] }).lean();
  return new Set(docs.map((d) => (d.blockerClerkId === clerkId ? d.blockedClerkId : d.blockerClerkId)));
}

/** True if EITHER side has blocked the other — either direction is enough to cut contact. */
export async function isBlockedEitherDirection(clerkIdA: string, clerkIdB: string): Promise<boolean> {
  const count = await BlockModel.countDocuments({
    $or: [
      { blockerClerkId: clerkIdA, blockedClerkId: clerkIdB },
      { blockerClerkId: clerkIdB, blockedClerkId: clerkIdA },
    ],
  });
  return count > 0;
}
