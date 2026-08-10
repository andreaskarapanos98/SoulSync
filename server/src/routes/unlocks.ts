import { Router } from "express";
import { getAuth } from "@clerk/express";
import { unlockUser } from "../services/unlockService.js";
import { InsufficientCoinsError } from "../services/coinService.js";

export const unlocksRouter = Router();

unlocksRouter.post("/:clerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { coinBalance } = await unlockUser(userId, req.params.clerkId);
    res.json({ unlocked: true, coinBalance });
  } catch (err) {
    if (err instanceof InsufficientCoinsError) {
      res.status(402).json({ error: "Not enough coins", required: err.required, balance: err.balance });
      return;
    }
    throw err;
  }
});
