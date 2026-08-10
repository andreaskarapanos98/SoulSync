import { Schema, model, type InferSchemaType } from "mongoose";

const paymentEventStatuses = ["succeeded", "failed", "expired"] as const;

const paymentEventSchema = new Schema(
  {
    clerkId: { type: String, index: true },
    stripeSessionId: { type: String },
    stripeEventType: { type: String, required: true },
    status: { type: String, enum: paymentEventStatuses, required: true },
    amountCents: { type: Number },
    currency: { type: String },
    packageId: { type: String },
    coins: { type: Number },
    failureReason: { type: String },
  },
  { timestamps: true },
);

export type PaymentEvent = InferSchemaType<typeof paymentEventSchema>;
export const PaymentEventModel = model("PaymentEvent", paymentEventSchema);
