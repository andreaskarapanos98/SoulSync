import { Schema, model, type InferSchemaType } from "mongoose";

const messageSchema = new Schema(
  {
    // Sorted pair of clerkIds joined with "::" — cheap to index and query both
    // directions of a conversation without an $or.
    conversationId: { type: String, required: true, index: true },
    fromClerkId: { type: String, required: true },
    toClerkId: { type: String, required: true },
    // Exactly one of body/audioUrl/imageUrl/videoUrl is meaningfully set per message.
    body: { type: String, default: "", maxlength: 2000 },
    audioUrl: { type: String },
    imageUrl: { type: String },
    videoUrl: { type: String },
    durationSec: { type: Number },
    readAt: { type: Date },
    editedAt: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true },
);

export type Message = InferSchemaType<typeof messageSchema>;

export const MessageModel = model("Message", messageSchema);
