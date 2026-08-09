import { Router } from "express";
import { getAuth } from "@clerk/express";
import { unlockUser } from "../services/unlockService.js";

export const unlocksRouter = Router();

unlocksRouter.post("/:clerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await unlockUser(userId, req.params.clerkId);
  res.json({ unlocked: true });
});
