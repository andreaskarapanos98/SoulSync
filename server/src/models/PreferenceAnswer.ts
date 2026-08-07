import { Schema, model, type InferSchemaType } from "mongoose";

const preferenceAnswerSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    // questionKey -> { value?: AnswerValue, importance: ImportanceLevel }
    // value is omitted for importance-only questions (valueCaptured: false).
    answers: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type PreferenceAnswer = InferSchemaType<typeof preferenceAnswerSchema>;

export const PreferenceAnswerModel = model("PreferenceAnswer", preferenceAnswerSchema);
