import { Schema, model, type InferSchemaType } from "mongoose";

export const analyticsEventTypes = [
  "registration",
  "onboarding_started",
  "onboarding_completed",
  "profile_completed",
  "voice_uploaded",
  "match_viewed",
  "voice_played",
  "profile_unlock_clicked",
  "coin_purchase_started",
  "coin_purchase_completed",
  "profile_unlocked",
  "message_sent",
  "match_blocked",
  "match_reported",
  "notification_opened",
  "hundred_percent_match_discovered",
] as const;

const analyticsEventSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    event: { type: String, enum: analyticsEventTypes, required: true, index: true },
    // Free-form context (e.g. { otherClerkId, packageId, compatibility }) — shape varies per event.
    properties: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

analyticsEventSchema.index({ event: 1, clerkId: 1 });

export type AnalyticsEvent = InferSchemaType<typeof analyticsEventSchema>;
export const AnalyticsEventModel = model("AnalyticsEvent", analyticsEventSchema);
