import { Router } from "express";
import { getAuth } from "@clerk/express";
import type { UnlockPerspective } from "@soulsync/shared-types";
import { unlockUser } from "../services/unlockService.js";
import { InsufficientCoinsError } from "../services/coinService.js";

export const unlocksRouter = Router();

unlocksRouter.post("/:clerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  // Defaults to "yourSoulmates" (the pre-existing behavior) for any caller that doesn't
  // send it, rather than 400ing — keeps this endpoint tolerant of older clients.
  const perspective: UnlockPerspective = req.body?.perspective === "theirSoulmate" ? "theirSoulmate" : "yourSoulmates";

  try {
    const { coinBalance } = await unlockUser(userId, req.params.clerkId, perspective);
    res.json({ unlocked: true, coinBalance });
  } catch (err) {
    if (err instanceof InsufficientCoinsError) {
      res.status(402).json({ error: "Not enough coins", required: err.required, balance: err.balance });
      return;
    }
    throw err;
  }
});
