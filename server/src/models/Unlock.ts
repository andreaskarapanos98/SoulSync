import { Schema, model, type InferSchemaType } from "mongoose";

const unlockSchema = new Schema(
  {
    viewerClerkId: { type: String, required: true, index: true },
    unlockedClerkId: { type: String, required: true },
  },
  { timestamps: true },
);

unlockSchema.index({ viewerClerkId: 1, unlockedClerkId: 1 }, { unique: true });

export type Unlock = InferSchemaType<typeof unlockSchema>;

export const UnlockModel = model("Unlock", unlockSchema);
