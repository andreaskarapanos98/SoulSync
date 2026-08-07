import { Schema, model, type InferSchemaType } from "mongoose";

const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    // Where the circular avatar crop centers on this photo, as percentages (0-100).
    // Only meaningful for the primary photo, but stored per-photo so the position
    // sticks if the user later swaps which photo is primary.
    focalPoint: {
      x: { type: Number, default: 50, min: 0, max: 100 },
      y: { type: Number, default: 50, min: 0, max: 100 },
    },
  },
  { timestamps: true },
);

const voiceIntroSchema = new Schema(
  {
    url: { type: String, required: true },
    durationSec: { type: Number, required: true },
  },
  { _id: false },
);

const profileSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    photos: { type: [photoSchema], default: [] },
    bio: { type: String, maxlength: 500, default: "" },
    voiceIntro: { type: voiceIntroSchema, default: undefined },
  },
  { timestamps: true },
);

export type Profile = InferSchemaType<typeof profileSchema>;

export const ProfileModel = model("Profile", profileSchema);
