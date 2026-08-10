import { Schema, model, type InferSchemaType } from "mongoose";

const adminAuditLogSchema = new Schema(
  {
    adminClerkId: { type: String, required: true, index: true },
    action: { type: String, required: true },
    targetClerkId: { type: String, index: true },
    // Free-form context for the action (e.g. { from: "active", to: "suspended" } or
    // { amount: 50, reason: "goodwill credit" }) — shape varies per action.
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

export type AdminAuditLog = InferSchemaType<typeof adminAuditLogSchema>;
export const AdminAuditLogModel = model("AdminAuditLog", adminAuditLogSchema);
