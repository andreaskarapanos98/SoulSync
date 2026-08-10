import { Router } from "express";
import { getAuth } from "@clerk/express";
import { blockUser, getBlockedClerkIds, unblockUser } from "../services/blockService.js";

export const blocksRouter = Router();

blocksRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const blocked = await getBlockedClerkIds(userId);
  res.json({ blockedClerkIds: [...blocked] });
});

blocksRouter.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { blockedClerkId } = req.body as { blockedClerkId?: string };
  if (!blockedClerkId) {
    res.status(400).json({ error: "blockedClerkId is required" });
    return;
  }
  try {
    await blockUser(userId, blockedClerkId);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to block user" });
  }
});

blocksRouter.delete("/:blockedClerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await unblockUser(userId, req.params.blockedClerkId);
  res.json({ ok: true });
});
