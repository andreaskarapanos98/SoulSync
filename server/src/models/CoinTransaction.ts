import { Schema, model, type InferSchemaType } from "mongoose";

const coinTransactionTypes = ["purchase", "unlock_spend", "admin_adjustment", "verification_spend", "gift_spend"] as const;

const coinTransactionSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    type: { type: String, enum: coinTransactionTypes, required: true },
    // Positive for purchase/credit, negative for spend/debit — coinBalance is always the
    // sum of this ledger.
    amount: { type: Number, required: true },
    // purchase only: the Stripe Checkout Session id. Unique+sparse so a retried/duplicate
    // webhook delivery can never credit the same purchase twice.
    stripeSessionId: { type: String, unique: true, sparse: true },
    // unlock_spend/gift_spend only: who got unlocked / who received the gift.
    relatedClerkId: { type: String },
    // gift_spend only: which catalog gift was sent.
    giftId: { type: String },
    // admin_adjustment only.
    adminClerkId: { type: String },
    // admin_adjustment (why) and verification_spend (fixed descriptive text).
    reason: { type: String },
  },
  { timestamps: true },
);

export type CoinTransaction = InferSchemaType<typeof coinTransactionSchema>;
export const CoinTransactionModel = model("CoinTransaction", coinTransactionSchema);
