import type Stripe from "stripe";
import { getStripeClient } from "../config/stripe.js";
import { env } from "../config/env.js";
import { CoinTransactionModel } from "../models/CoinTransaction.js";
import { UserAccountModel } from "../models/UserAccount.js";
import { logAdminAction } from "./adminAuditService.js";
import { track } from "./analyticsService.js";

export interface CoinPackage {
  id: string;
  coins: number;
  priceCents: number;
  currency: "eur";
  label: string;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: "coins_100", coins: 100, priceCents: 499, currency: "eur", label: "100 SoulSync Coins" },
  { id: "coins_250", coins: 250, priceCents: 999, currency: "eur", label: "250 SoulSync Coins" },
  { id: "coins_600", coins: 600, priceCents: 1999, currency: "eur", label: "600 SoulSync Coins" },
  { id: "coins_1500", coins: 1500, priceCents: 3999, currency: "eur", label: "1,500 SoulSync Coins" },
];

export interface UnlockCostTier {
  minCompatibility: number;
  coins: number;
}

// Ordered highest-to-lowest so the first match in unlockCostForCompatibility() wins.
export const UNLOCK_COST_TIERS: UnlockCostTier[] = [
  { minCompatibility: 100, coins: 300 },
  { minCompatibility: 98, coins: 200 },
  { minCompatibility: 95, coins: 160 },
  { minCompatibility: 90, coins: 130 },
  { minCompatibility: 80, coins: 100 },
  { minCompatibility: 70, coins: 70 },
  { minCompatibility: 60, coins: 50 },
  { minCompatibility: 0, coins: 25 },
];

export function unlockCostForCompatibility(compatibility: number): number {
  const tier = UNLOCK_COST_TIERS.find((t) => compatibility >= t.minCompatibility);
  return tier?.coins ?? UNLOCK_COST_TIERS[UNLOCK_COST_TIERS.length - 1].coins;
}

export class InsufficientCoinsError extends Error {
  constructor(public required: number, public balance: number) {
    super(`Insufficient coins: need ${required}, have ${balance}`);
  }
}

function getPackage(packageId: string): CoinPackage {
  const pkg = COIN_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) throw new Error(`Unknown coin package: ${packageId}`);
  return pkg;
}

/**
 * Creates a Stripe Checkout Session for the given package. The price is always looked up
 * server-side from COIN_PACKAGES — packageId is the only client input trusted here.
 */
export async function createCheckoutSession(clerkId: string, packageId: string): Promise<{ url: string }> {
  const pkg = getPackage(packageId);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: pkg.currency,
          product_data: { name: pkg.label },
          unit_amount: pkg.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { clerkId, packageId: pkg.id, coins: String(pkg.coins) },
    success_url: `${env.clientUrl}/coins/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.clientUrl}/coins/cancel`,
  });

  if (!session.url) throw new Error("Stripe did not return a Checkout Session URL");
  await track(clerkId, "coin_purchase_started", { packageId: pkg.id, coins: pkg.coins, priceCents: pkg.priceCents });
  return { url: session.url };
}

/**
 * Credits coins for a completed Checkout Session. Idempotent: the unique index on
 * CoinTransaction.stripeSessionId means a retried webhook delivery (Stripe's guaranteed
 * "at least once" behavior) can never double-credit the same session.
 */
export async function creditCoinsForCheckoutSession(session: Stripe.Checkout.Session): Promise<void> {
  const clerkId = session.metadata?.clerkId;
  const coins = Number(session.metadata?.coins);
  if (!clerkId || !Number.isFinite(coins) || coins <= 0) {
    console.error("Checkout session missing/invalid metadata, skipping credit", session.id);
    return;
  }

  try {
    await CoinTransactionModel.create({
      clerkId,
      type: "purchase",
      amount: coins,
      stripeSessionId: session.id,
    });
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code?: number }).code === 11000) {
      return; // Already credited for this session.
    }
    throw err;
  }

  await UserAccountModel.updateOne({ clerkId }, { $inc: { coinBalance: coins } }, { upsert: true });
  await track(clerkId, "coin_purchase_completed", { coins, stripeSessionId: session.id });
}

/**
 * Atomically spends coins if the balance covers it. Throws InsufficientCoinsError otherwise.
 */
export async function spendCoins(
  clerkId: string,
  amount: number,
  relatedClerkId?: string,
): Promise<{ coinBalance: number }> {
  const updated = await UserAccountModel.findOneAndUpdate(
    { clerkId, coinBalance: { $gte: amount } },
    { $inc: { coinBalance: -amount } },
    { returnDocument: "after" },
  );

  if (!updated) {
    const account = await UserAccountModel.findOne({ clerkId });
    throw new InsufficientCoinsError(amount, account?.coinBalance ?? 0);
  }

  await CoinTransactionModel.create({
    clerkId,
    type: "unlock_spend",
    amount: -amount,
    relatedClerkId,
  });

  return { coinBalance: updated.coinBalance };
}

/**
 * Admin-only credit/debit outside the normal purchase/spend flows (goodwill credit,
 * correcting a support issue, etc.) — amount can be positive or negative. Allows going
 * negative only if the admin explicitly debits more than the balance holds; that's a
 * deliberate admin override, not a user-facing spend, so no InsufficientCoinsError here.
 */
export async function adjustCoinsByAdmin(
  adminClerkId: string,
  targetClerkId: string,
  amount: number,
  reason: string,
): Promise<{ coinBalance: number }> {
  const updated = await UserAccountModel.findOneAndUpdate(
    { clerkId: targetClerkId },
    { $inc: { coinBalance: amount } },
    { returnDocument: "after" },
  );
  if (!updated) throw new Error("User not found");

  await CoinTransactionModel.create({
    clerkId: targetClerkId,
    type: "admin_adjustment",
    amount,
    adminClerkId,
    reason,
  });

  await logAdminAction(adminClerkId, "coins.adjust", targetClerkId, { amount, reason, newBalance: updated.coinBalance });

  return { coinBalance: updated.coinBalance };
}
