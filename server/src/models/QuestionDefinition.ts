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
  "career",
  "hobbies",
  "connection",
] as const;

export const questionAppliesTo = ["about_me", "preference"] as const;

// number_range: two linked numbers within [min, max] (e.g. age range 16-60, where 60
// means "60+"). Stored as a 2-element [low, high] tuple.
export const questionTypes = [
  "single_select",
  "multi_select",
  "scale",
  "number",
  "number_range",
  "text",
  "date",
] as const;

// How a preference question feeds the (future) compatibility algorithm. Only meaningful
// for appliesTo: "preference" — about_me questions don't have a scoring mechanic.
//   hard_filter    — absolute gate (e.g. gender, age range): mismatch = 0% and stop scoring
//                     entirely, no other question is evaluated for that candidate.
//   ranking        — options have no natural order (e.g. hair color); the viewer ranks all
//                     of them, and a candidate earns points based on where their actual
//                     value falls in that ranking.
//   mini_scale      — options (or a numeric scale) DO have a natural order (e.g. smoking:
//                     never→socially→regularly); the viewer picks one target point, score
//                     falls off by distance from it.
//   relative_self   — compares the candidate's value against the VIEWER's own about_me
//                     answer for the same key (e.g. height: "taller than me"), not an
//                     independently stated target.
//   checklist       — multi-select; any of the viewer's accepted values matching earns
//                     credit, no ranking involved.
//   filler          — captured and shown, but never contributes to the score (e.g. "how
//                     important is honesty to you" — not objectively verifiable).
export const scoringMechanics = [
  "hard_filter",
  "ranking",
  "mini_scale",
  "relative_self",
  "checklist",
  "filler",
] as const;

const optionSchema = new Schema(
  {
    value: { type: String, required: true },
    label: { type: String, required: true },
    // multi_select only: checking this option clears every other selection (and vice
    // versa) — e.g. "No pets" is mutually exclusive with "Dog"/"Cat"/"Other".
    exclusive: { type: Boolean, default: false },
  },
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
    // Preference-only.
    scoringMechanic: { type: String, enum: scoringMechanics },
    // Preference-only: can the user ALSO flag this specific value as a personal deal
    // breaker (separate from, and layered on top of, its normal scoringMechanic)?
    canBeDealBreaker: { type: Boolean, default: false },
  },
  { timestamps: true },
);

questionDefinitionSchema.index({ key: 1, appliesTo: 1 }, { unique: true });

export type QuestionDefinition = InferSchemaType<typeof questionDefinitionSchema>;

export const QuestionDefinitionModel = model("QuestionDefinition", questionDefinitionSchema);
