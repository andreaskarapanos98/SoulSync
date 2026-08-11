import type Stripe from "stripe";
import { getStripeClient } from "../config/stripe.js";
import { env } from "../config/env.js";
import { UserAccountModel } from "../models/UserAccount.js";
import { InsufficientCoinsError, VERIFICATION_COST_COINS, spendCoinsForVerification } from "./coinService.js";
import { createAccountNotification } from "./notificationService.js";
import { track } from "./analyticsService.js";

export class AlreadyVerifiedError extends Error {
  constructor() {
    super("This account is already verified");
  }
}

/**
 * Starts a Stripe Identity verification: creates the hosted session first, and only
 * spends coins once that succeeds — a Stripe/infra failure here must never cost the user
 * coins. The 60 coins buy the *ability* to get verified, not a single attempt — once
 * `verificationPaid` is true, every future call here is free, no matter how many times a
 * check comes back failed. That's the point of paying: a bad document scan shouldn't cost
 * more coins to fix.
 */
export async function startVerification(clerkId: string): Promise<{ url: string; coinBalance?: number }> {
  const account = await UserAccountModel.findOne({ clerkId });
  if (account?.verificationStatus === "verified") throw new AlreadyVerifiedError();

  const alreadyPaid = account?.verificationPaid ?? false;
  if (!alreadyPaid) {
    // Cheap pre-check so we don't create — and have Stripe potentially bill us for — a
    // session for someone who can't pay for it. spendCoinsForVerification() below is
    // still the real (atomic) guard against a balance race between this check and the
    // debit.
    if ((account?.coinBalance ?? 0) < VERIFICATION_COST_COINS) {
      throw new InsufficientCoinsError(VERIFICATION_COST_COINS, account?.coinBalance ?? 0);
    }
  }

  const stripe = getStripeClient();
  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    metadata: { clerkId },
    return_url: `${env.clientUrl}/verification/return`,
  });
  if (!session.url) throw new Error("Stripe did not return a Verification Session URL");

  const coinBalance = alreadyPaid ? undefined : (await spendCoinsForVerification(clerkId)).coinBalance;

  await UserAccountModel.updateOne(
    { clerkId },
    {
      verificationStatus: "pending",
      verificationSessionId: session.id,
      verificationPendingAt: new Date(),
      verificationPaid: true,
    },
  );

  await track(clerkId, "verification_started", { free_retry: alreadyPaid });
  return { url: session.url, coinBalance };
}

type VerificationOutcome = "verified" | "requires_input" | "canceled";

/**
 * Applies a webhook-reported outcome. Only acts if the session still matches the
 * account's current attempt — otherwise a delayed event from an old, already-superseded
 * attempt could regress an account that already succeeded on a later retry.
 */
export async function handleVerificationEvent(
  session: Stripe.Identity.VerificationSession,
  outcome: VerificationOutcome,
): Promise<void> {
  const clerkId = session.metadata?.clerkId;
  if (!clerkId) {
    console.error("Verification session missing clerkId metadata, skipping", session.id);
    return;
  }

  const account = await UserAccountModel.findOne({ clerkId });
  if (!account || account.verificationSessionId !== session.id) {
    return; // Stale/out-of-order event from a superseded attempt.
  }

  if (outcome === "verified") {
    await UserAccountModel.updateOne({ clerkId }, { verificationStatus: "verified", verifiedAt: new Date() });
    await track(clerkId, "verification_completed");
    await createAccountNotification(clerkId, "✅ You're verified!", "Your identity has been verified — a checkmark now shows on your profile.");
  } else {
    await UserAccountModel.updateOne({ clerkId }, { verificationStatus: "failed" });
    await track(clerkId, "verification_failed", { reason: outcome });
  }
}
