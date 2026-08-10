import { Router } from "express";
import { getAuth } from "@clerk/express";
import { COIN_PACKAGES, UNLOCK_COST_TIERS, createCheckoutSession } from "../services/coinService.js";
import { StripeNotConfiguredError } from "../config/stripe.js";

export const coinsRouter = Router();

coinsRouter.get("/packages", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ packages: COIN_PACKAGES, unlockCostTiers: UNLOCK_COST_TIERS });
});

coinsRouter.post("/checkout", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { packageId } = req.body as { packageId?: string };
  if (!packageId) {
    res.status(400).json({ error: "packageId is required" });
    return;
  }

  try {
    const { url } = await createCheckoutSession(userId, packageId);
    res.json({ url });
  } catch (err) {
    if (err instanceof StripeNotConfiguredError) {
      res.status(503).json({ error: "Coin purchases aren't available yet — Stripe isn't configured." });
      return;
    }
    throw err;
  }
});
