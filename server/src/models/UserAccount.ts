import { Schema, model, type InferSchemaType } from "mongoose";

const onboardingStatuses = [
  "not_started",
  "about_me",
  "preferences",
  "profile",
  "complete",
] as const;

const accountStatuses = ["active", "suspended", "deleted"] as const;

const userAccountSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true },
    onboardingStatus: {
      type: String,
      enum: onboardingStatuses,
      default: "not_started",
    },
    // Cached projection of the CoinTransaction ledger (added in a later phase).
    // Never written to directly outside of that reconciliation logic.
    coinBalance: { type: Number, default: 0 },
    status: {
      type: String,
      enum: accountStatuses,
      default: "active",
    },
  },
  { timestamps: true },
);

export type UserAccount = InferSchemaType<typeof userAccountSchema>;

export const UserAccountModel = model("UserAccount", userAccountSchema);
