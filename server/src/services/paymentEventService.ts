import type Stripe from "stripe";
import { PaymentEventModel } from "../models/PaymentEvent.js";

function metaFrom(session: Stripe.Checkout.Session) {
  return {
    clerkId: session.metadata?.clerkId,
    packageId: session.metadata?.packageId,
    coins: session.metadata?.coins ? Number(session.metadata.coins) : undefined,
  };
}

export async function logCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const { clerkId, packageId, coins } = metaFrom(session);
  await PaymentEventModel.create({
    clerkId,
    stripeSessionId: session.id,
    stripeEventType: "checkout.session.completed",
    status: "succeeded",
    amountCents: session.amount_total ?? undefined,
    currency: session.currency ?? undefined,
    packageId,
    coins,
  });
}

export async function logCheckoutExpired(session: Stripe.Checkout.Session): Promise<void> {
  const { clerkId, packageId, coins } = metaFrom(session);
  await PaymentEventModel.create({
    clerkId,
    stripeSessionId: session.id,
    stripeEventType: "checkout.session.expired",
    status: "expired",
    amountCents: session.amount_total ?? undefined,
    currency: session.currency ?? undefined,
    packageId,
    coins,
    failureReason: "Checkout session expired before payment was completed",
  });
}

export async function logPaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  await PaymentEventModel.create({
    stripeEventType: "payment_intent.payment_failed",
    status: "failed",
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency,
    failureReason: paymentIntent.last_payment_error?.message ?? "Payment failed",
  });
}
