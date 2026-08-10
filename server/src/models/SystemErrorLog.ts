import { Schema, model, type InferSchemaType } from "mongoose";

const systemErrorLogSchema = new Schema(
  {
    message: { type: String, required: true },
    stack: { type: String },
    path: { type: String },
    method: { type: String },
    statusCode: { type: Number },
    clerkId: { type: String },
    source: { type: String, required: true }, // "express_error_handler" | "unhandled_rejection" | "uncaught_exception"
  },
  { timestamps: true },
);

export type SystemErrorLog = InferSchemaType<typeof systemErrorLogSchema>;
export const SystemErrorLogModel = model("SystemErrorLog", systemErrorLogSchema);
