import { Schema, model, type InferSchemaType } from "mongoose";

export const reportContentTypes = ["user", "profile", "photo", "voice", "message"] as const;

export const reportReasons = [
  "inappropriate_content",
  "harassment",
  "fake_profile",
  "spam",
  "underage",
  "other",
] as const;

export const reportStatuses = ["open", "reviewed", "dismissed"] as const;

const reportSchema = new Schema(
  {
    reporterClerkId: { type: String, required: true, index: true },
    reportedClerkId: { type: String, required: true, index: true },
    contentType: { type: String, enum: reportContentTypes, required: true },
    // contentType-specific reference so the content can actually be investigated —
    // a message id, a photo id, etc. Unset for plain "user"/"profile" reports.
    contentRef: { type: String },
    reason: { type: String, enum: reportReasons, required: true },
    details: { type: String },
    status: { type: String, enum: reportStatuses, default: "open" },
    reviewedByClerkId: { type: String },
    reviewedAt: { type: Date },
    // Free-text record of what the reviewing admin did/decided — editable any time,
    // independent of status (fixing a note later doesn't re-trigger notifications).
    adminNote: { type: String },
  },
  { timestamps: true },
);

export type Report = InferSchemaType<typeof reportSchema>;
export const ReportModel = model("Report", reportSchema);
