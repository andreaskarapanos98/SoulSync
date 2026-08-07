import { Schema, model, type InferSchemaType } from "mongoose";

const aboutMeAnswerSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    // questionKey -> answer value (string, number, or string[] depending on question type)
    answers: { type: Map, of: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

export type AboutMeAnswer = InferSchemaType<typeof aboutMeAnswerSchema>;

export const AboutMeAnswerModel = model("AboutMeAnswer", aboutMeAnswerSchema);
