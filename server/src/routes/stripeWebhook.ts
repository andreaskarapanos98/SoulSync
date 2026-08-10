import { Router } from "express";
import type Stripe from "stripe";
import { getStripeClient } from "../config/stripe.js";
import { env } from "../config/env.js";
import { creditCoinsForCheckoutSession } from "../services/coinService.js";

export const stripeWebhookRouter = Router();

// Mounted in index.ts with express.raw() BEFORE the global express.json() middleware —
// Stripe's signature verification needs the exact raw request body, not a parsed/re-
// serialized one.
stripeWebhookRouter.post("/", async (req, res) => {
  if (!env.stripeWebhookSecret) {
    res.status(503).json({ error: "Stripe webhook secret not configured" });
    return;
  }

  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event;
  try {
    event = getStripeClient().webhooks.constructEvent(req.body, signature as string, env.stripeWebhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    res.status(400).json({ error: "Invalid signature" });
    return;
  }

  if (event.type === "checkout.session.completed") {
    await creditCoinsForCheckoutSession(event.data.object as Stripe.Checkout.Session);
  }

  res.json({ received: true });
});
