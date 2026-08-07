import { Schema, model, type InferSchemaType } from "mongoose";

const dealBreakerSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    // questionKey -> unacceptable about_me values for that key. e.g.
    // { smoking: ["regularly"] } means "exclude any candidate who smokes regularly".
    dealBreakers: { type: Map, of: [String], default: {} },
  },
  { timestamps: true },
);

export type DealBreaker = InferSchemaType<typeof dealBreakerSchema>;

export const DealBreakerModel = model("DealBreaker", dealBreakerSchema);
