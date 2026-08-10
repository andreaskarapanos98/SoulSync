import Stripe from "stripe";
import { env } from "./env.js";

let client: Stripe | null = null;

export class StripeNotConfiguredError extends Error {
  constructor() {
    super("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  }
}

export function getStripeClient(): Stripe {
  if (!env.stripeSecretKey) throw new StripeNotConfiguredError();
  if (!client) client = new Stripe(env.stripeSecretKey);
  return client;
}
