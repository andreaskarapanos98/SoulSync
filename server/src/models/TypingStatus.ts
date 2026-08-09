import { Schema, model, type InferSchemaType } from "mongoose";

// One doc per (conversation, sender) — upserted every time that person types, read by
// the other participant's poll to approximate a live "typing…" indicator.
const typingStatusSchema = new Schema(
  {
    conversationId: { type: String, required: true },
    clerkId: { type: String, required: true },
    updatedAt: { type: Date, required: true },
  },
  { timestamps: false },
);

typingStatusSchema.index({ conversationId: 1, clerkId: 1 }, { unique: true });

export type TypingStatus = InferSchemaType<typeof typingStatusSchema>;

export const TypingStatusModel = model("TypingStatus", typingStatusSchema);
