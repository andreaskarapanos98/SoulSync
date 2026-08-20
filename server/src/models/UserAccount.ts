import { Schema, model, type InferSchemaType } from "mongoose";

const onboardingStatuses = [
  "not_started",
  "about_me",
  "preferences",
  "profile",
  "complete",
] as const;

const accountStatuses = ["active", "suspended", "banned", "deleted"] as const;
const accountRoles = ["user", "admin"] as const;
const verificationStatuses = ["unverified", "pending", "verified", "failed"] as const;

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
    // Bootstrap admin is granted via the ADMIN_CLERK_IDS env allowlist (see
    // requireAdmin.ts); this field is how the dashboard can grant/revoke admin to
    // other accounts afterwards without an env/redeploy round-trip.
    role: {
      type: String,
      enum: accountRoles,
      default: "user",
    },
    // Stripe Identity verification state. "pending" is set the moment coins are spent and
    // a VerificationSession is created; the webhook moves it to "verified"/"failed" (see
    // verificationService.ts). verificationSessionId guards against a stale/out-of-order
    // webhook from an old attempt regressing a since-verified account.
    verificationStatus: {
      type: String,
      enum: verificationStatuses,
      default: "unverified",
    },
    verificationSessionId: { type: String },
    verificationPendingAt: { type: Date },
    verifiedAt: { type: Date },
    // The 60-coin fee buys the *ability* to get verified, not a single attempt — once
    // this is true, every future startVerification() call is free, no matter how many
    // times a check comes back failed.
    verificationPaid: { type: Boolean, default: false },
    // Chat-only restriction — lighter than `status: "banned"`, which locks out everything
    // via requireActiveAccount. Checked at send-time in requireCanMessage(); no background
    // job needed since expiry is just a Date comparison.
    chatBanExpiresAt: { type: Date },
    chatBannedIndefinitely: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserAccount = InferSchemaType<typeof userAccountSchema>;

export const UserAccountModel = model("UserAccount", userAccountSchema);
