import { Router } from "express";
import { getAuth } from "@clerk/express";
import { AlreadyVerifiedError, startVerification } from "../services/verificationService.js";
import { InsufficientCoinsError } from "../services/coinService.js";
import { StripeNotConfiguredError } from "../config/stripe.js";

export const verificationRouter = Router();

verificationRouter.post("/start", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const { url, coinBalance } = await startVerification(userId);
    res.json({ url, coinBalance });
  } catch (err) {
    if (err instanceof InsufficientCoinsError) {
      res.status(402).json({ error: "Not enough coins", required: err.required, balance: err.balance });
      return;
    }
    if (err instanceof AlreadyVerifiedError) {
      res.status(409).json({ error: err.message });
      return;
    }
    if (err instanceof StripeNotConfiguredError) {
      res.status(503).json({ error: "Verification isn't available yet — Stripe isn't configured." });
      return;
    }
    throw err;
  }
});
