import { Schema, model, type InferSchemaType } from "mongoose";

export const questionCategories = [
  "basics",
  "appearance",
  "lifestyle",
  "personality",
  "values",
  "relationship_goals",
  "family",
  "communication",
] as const;

export const questionAppliesTo = ["about_me", "preference"] as const;

export const questionTypes = [
  "single_select",
  "multi_select",
  "scale",
  "number",
  "text",
  "date",
] as const;

const optionSchema = new Schema(
  { value: { type: String, required: true }, label: { type: String, required: true } },
  { _id: false },
);

const questionDefinitionSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    category: { type: String, enum: questionCategories, required: true },
    appliesTo: { type: String, enum: questionAppliesTo, required: true },
    type: { type: String, enum: questionTypes, required: true },
    label: { type: String, required: true },
    // Only meaningful for single_select / multi_select.
    options: { type: [optionSchema], default: undefined },
    // Only meaningful for scale / number.
    min: { type: Number },
    max: { type: Number },
    required: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    version: { type: Number, default: 1 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export type QuestionDefinition = InferSchemaType<typeof questionDefinitionSchema>;

export const QuestionDefinitionModel = model("QuestionDefinition", questionDefinitionSchema);
