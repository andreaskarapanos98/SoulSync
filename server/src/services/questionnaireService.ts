import { QuestionDefinitionModel, type QuestionDefinition } from "../models/QuestionDefinition.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";

export class ValidationError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Invalid answers: ${issues.join("; ")}`);
  }
}

function validateValue(question: QuestionDefinition, value: unknown): string | null {
  switch (question.type) {
    case "single_select": {
      const valid = question.options?.some((o) => o.value === value);
      if (!valid) return `${question.key}: must be one of ${optionValues(question)}`;
      return null;
    }
    case "multi_select": {
      if (!Array.isArray(value)) return `${question.key}: must be an array`;
      const allowed = new Set(question.options?.map((o) => o.value));
      const bad = value.filter((v) => !allowed.has(v));
      if (bad.length > 0) return `${question.key}: invalid option(s) ${bad.join(", ")}`;
      return null;
    }
    case "scale":
    case "number": {
      if (typeof value !== "number" || Number.isNaN(value)) return `${question.key}: must be a number`;
      if (question.min != null && value < question.min) return `${question.key}: must be >= ${question.min}`;
      if (question.max != null && value > question.max) return `${question.key}: must be <= ${question.max}`;
      return null;
    }
    case "text": {
      if (typeof value !== "string" || value.trim().length === 0) return `${question.key}: must be a non-empty string`;
      return null;
    }
    case "date": {
      if (typeof value !== "string" || Number.isNaN(Date.parse(value))) return `${question.key}: must be a valid date string`;
      return null;
    }
    default:
      return `${question.key}: unknown question type`;
  }
}

function optionValues(question: QuestionDefinition): string {
  return (question.options ?? []).map((o) => o.value).join(", ");
}

/**
 * Validates the given answers against active QuestionDefinitions for `appliesTo`,
 * merges them into the user's existing answer map, and returns the updated document.
 * Throws ValidationError (all-or-nothing) if any key is unknown or any value is invalid.
 */
export async function saveAboutMeAnswers(clerkId: string, incoming: Record<string, unknown>) {
  const keys = Object.keys(incoming);
  const questions = await QuestionDefinitionModel.find({
    key: { $in: keys },
    appliesTo: "about_me",
    active: true,
  });

  const byKey = new Map(questions.map((q) => [q.key, q]));
  const issues: string[] = [];

  for (const key of keys) {
    const question = byKey.get(key);
    if (!question) {
      issues.push(`${key}: not a recognized about-me question`);
      continue;
    }
    const issue = validateValue(question, incoming[key]);
    if (issue) issues.push(issue);
  }

  if (issues.length > 0) throw new ValidationError(issues);

  const doc = await AboutMeAnswerModel.findOneAndUpdate(
    { clerkId },
    { $set: Object.fromEntries(Object.entries(incoming).map(([k, v]) => [`answers.${k}`, v])) },
    { upsert: true, returnDocument: "after" },
  );

  return doc;
}

/** Keys of required about-me questions the user hasn't answered yet. */
export async function getMissingRequiredAboutMe(clerkId: string): Promise<string[]> {
  const [required, answerDoc] = await Promise.all([
    QuestionDefinitionModel.find({ appliesTo: "about_me", active: true, required: true }),
    AboutMeAnswerModel.findOne({ clerkId }),
  ]);
  const answered = new Set(answerDoc ? answerDoc.answers.keys() : []);
  return required.map((q) => q.key).filter((key) => !answered.has(key));
}

/**
 * "ranking" mechanic questions store the full preferred order as an array of option
 * values — either every option exactly once, or an empty array meaning "I don't care."
 */
function validateRankingValue(question: QuestionDefinition, value: unknown): string | null {
  if (!Array.isArray(value)) return `${question.key}: ranking must be an array`;
  if (value.length === 0) return null; // "I don't care" — skips ranking entirely
  const allowed = question.options?.map((o) => o.value) ?? [];
  const isPermutation =
    value.length === allowed.length &&
    new Set(value).size === value.length &&
    value.every((v) => allowed.includes(v as string));
  if (!isPermutation) {
    return `${question.key}: ranking must include every option exactly once (${allowed.join(", ")}), or be empty`;
  }
  return null;
}

function validatePreferenceValue(question: QuestionDefinition, value: unknown): string | null {
  if (question.scoringMechanic === "ranking") return validateRankingValue(question, value);
  return validateValue(question, value);
}

/**
 * Same all-or-nothing validation approach as saveAboutMeAnswers. Preference answers store
 * a plain AnswerValue per key — no separate importance weight (removed: it was confusing
 * and is superseded by the per-question scoringMechanic + ranking system).
 */
export async function savePreferenceAnswers(clerkId: string, incoming: Record<string, unknown>) {
  const keys = Object.keys(incoming);
  const questions = await QuestionDefinitionModel.find({
    key: { $in: keys },
    appliesTo: "preference",
    active: true,
  });

  const byKey = new Map(questions.map((q) => [q.key, q]));
  const issues: string[] = [];

  for (const key of keys) {
    const question = byKey.get(key);
    if (!question) {
      issues.push(`${key}: not a recognized preference question`);
      continue;
    }
    const issue = validatePreferenceValue(question, incoming[key]);
    if (issue) issues.push(issue);
  }

  if (issues.length > 0) throw new ValidationError(issues);

  const doc = await PreferenceAnswerModel.findOneAndUpdate(
    { clerkId },
    { $set: Object.fromEntries(Object.entries(incoming).map(([k, v]) => [`answers.${k}`, v])) },
    { upsert: true, returnDocument: "after" },
  );

  return doc;
}

/** Keys of required preference questions the user hasn't answered yet. */
export async function getMissingRequiredPreferences(clerkId: string): Promise<string[]> {
  const [required, answerDoc] = await Promise.all([
    QuestionDefinitionModel.find({ appliesTo: "preference", active: true, required: true }),
    PreferenceAnswerModel.findOne({ clerkId }),
  ]);
  const answered = new Set(answerDoc ? answerDoc.answers.keys() : []);
  return required.map((q) => q.key).filter((key) => !answered.has(key));
}
