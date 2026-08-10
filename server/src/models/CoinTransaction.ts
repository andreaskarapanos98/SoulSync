import { Schema, model, type InferSchemaType } from "mongoose";

const coinTransactionTypes = ["purchase", "unlock_spend", "admin_adjustment"] as const;

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
    // unlock_spend only: who got unlocked.
    relatedClerkId: { type: String },
    // admin_adjustment only.
    adminClerkId: { type: String },
    reason: { type: String },
  },
  { timestamps: true },
);

export type CoinTransaction = InferSchemaType<typeof coinTransactionSchema>;
export const CoinTransactionModel = model("CoinTransaction", coinTransactionSchema);
