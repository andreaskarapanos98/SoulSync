import { Schema, model, type InferSchemaType } from "mongoose";

export const notificationTypes = ["match", "profile_unlocked", "account"] as const;

// "new_match" catches every non-eliminated candidate below the "great" band — everyone
// gets notified once that a match exists at all, and again if it later crosses a
// higher-compatibility tier.
export const matchNotificationTiers = ["new_match", "great", "excellent", "near_perfect", "perfect"] as const;

const notificationSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true }, // recipient
    type: { type: String, enum: notificationTypes, required: true },
    // match: the candidate. profile_unlocked: who unlocked the recipient. account: unset.
    otherClerkId: { type: String },
    tier: { type: String, enum: matchNotificationTiers }, // match only
    compatibility: { type: Number }, // match only
    title: { type: String, required: true },
    message: { type: String, required: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

// Match notifications are idempotent per (recipient, candidate, tier) — dedupes across
// repeated /matches polls. profile_unlocked/account notifications are genuine one-off
// events each time they're created, so this partial index only constrains type "match".
notificationSchema.index(
  { clerkId: 1, otherClerkId: 1, tier: 1 },
  { unique: true, partialFilterExpression: { type: "match" } },
);

export type Notification = InferSchemaType<typeof notificationSchema>;

export const NotificationModel = model("Notification", notificationSchema);
