import { Schema, model, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    // Sorted pair of clerkIds joined with "::" — cheap to index and query both
    // directions of a conversation without an $or.
    conversationId: { type: String, required: true, index: true },
    fromClerkId: { type: String, required: true },
    toClerkId: { type: String, required: true },
    // Text messages set body and leave audio unset; voice messages are the reverse.
    body: { type: String, default: "", maxlength: 2000 },
    audioUrl: { type: String },
    durationSec: { type: Number },
    readAt: { type: Date },
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

export type Message = InferSchemaType<typeof messageSchema>;

export const MessageModel = model("Message", messageSchema);
