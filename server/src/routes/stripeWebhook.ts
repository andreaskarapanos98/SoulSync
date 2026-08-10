import { Router } from "express";
import type Stripe from "stripe";
import { getStripeClient } from "../config/stripe.js";
import { env } from "../config/env.js";
import { creditCoinsForCheckoutSession } from "../services/coinService.js";
import { logCheckoutCompleted, logCheckoutExpired, logPaymentIntentFailed } from "../services/paymentEventService.js";

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

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await creditCoinsForCheckoutSession(session);
      await logCheckoutCompleted(session);
      break;
    }
    case "checkout.session.expired":
      await logCheckoutExpired(event.data.object as Stripe.Checkout.Session);
      break;
    case "payment_intent.payment_failed":
      await logPaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
      break;
  }

  res.json({ received: true });
});
