import { Schema, model, type InferSchemaType } from "mongoose";

const preferenceAnswerSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    // questionKey -> AnswerValue (string | number | string[]) — same shape as
    // AboutMeAnswer. For "ranking" mechanic questions, value is the full ordered list of
    // option values (best to worst); an empty array means "I don't care".
    answers: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type PreferenceAnswer = InferSchemaType<typeof preferenceAnswerSchema>;

export const PreferenceAnswerModel = model("PreferenceAnswer", preferenceAnswerSchema);
