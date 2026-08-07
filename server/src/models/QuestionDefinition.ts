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

export const importanceLevels = [
  "doesnt_matter",
  "slight_preference",
  "important",
  "very_important",
  "must_have",
] as const;

const optionSchema = new Schema(
  { value: { type: String, required: true }, label: { type: String, required: true } },
  { _id: false },
);

const questionDefinitionSchema = new Schema(
  {
    // Preference questions reuse the same key as their about_me sibling (e.g. "smoking"
    // exists once per appliesTo) so the future matching engine can look up a candidate's
    // about_me answer and a viewer's preference for the same key without a mapping table.
    key: { type: String, required: true, index: true },
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
    // Preference-only: does the UI ask for a target value, or just an importance rating?
    // e.g. height is importance-only — we don't ask for a target number.
    valueCaptured: { type: Boolean, default: true },
    // Preference-only: can the user flag this dimension as an absolute deal breaker,
    // independent of its importance rating?
    canBeDealBreaker: { type: Boolean, default: false },
  },
  { timestamps: true },
);

questionDefinitionSchema.index({ key: 1, appliesTo: 1 }, { unique: true });

export type QuestionDefinition = InferSchemaType<typeof questionDefinitionSchema>;

export const QuestionDefinitionModel = model("QuestionDefinition", questionDefinitionSchema);
