import { Schema, model, type InferSchemaType } from "mongoose";

export const notificationTiers = ["great", "excellent", "near_perfect", "perfect"] as const;

const notificationSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true }, // recipient
    otherClerkId: { type: String, required: true }, // the match this notification is about
    tier: { type: String, enum: notificationTiers, required: true },
    compatibility: { type: Number, required: true },
    readAt: { type: Date },
  },
  { timestamps: true },
);

// One notification per (recipient, match, tier) ever — re-visiting /matches (which is
// what triggers detection) never spams duplicates for a tier already notified.
notificationSchema.index({ clerkId: 1, otherClerkId: 1, tier: 1 }, { unique: true });

export type Notification = InferSchemaType<typeof notificationSchema>;

export const NotificationModel = model("Notification", notificationSchema);
