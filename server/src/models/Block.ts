import { Schema, model, type InferSchemaType } from "mongoose";

const blockSchema = new Schema(
  {
    blockerClerkId: { type: String, required: true, index: true },
    blockedClerkId: { type: String, required: true },
  },
  { timestamps: true },
);

blockSchema.index({ blockerClerkId: 1, blockedClerkId: 1 }, { unique: true });

export type Block = InferSchemaType<typeof blockSchema>;
export const BlockModel = model("Block", blockSchema);
