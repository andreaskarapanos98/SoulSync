import { Schema, model, type InferSchemaType } from "mongoose";

// One doc per (clerkId, token) pair — a user can have several devices, and reinstalling
// the app gets a new FCM token without orphaning the old one until FCM itself reports it
// dead (handled in pushService.ts by deleting on an "unregistered" send error).
const deviceTokenSchema = new Schema(
  {
    clerkId: { type: String, required: true, index: true },
    token: { type: String, required: true, unique: true },
    platform: { type: String, enum: ["android"], required: true },
  },
  { timestamps: true },
);

export type DeviceToken = InferSchemaType<typeof deviceTokenSchema>;

export const DeviceTokenModel = model("DeviceToken", deviceTokenSchema);
