import { QuestionDefinitionModel } from "../models/QuestionDefinition.js";
import { DealBreakerModel } from "../models/DealBreaker.js";
import { ValidationError } from "./questionnaireService.js";

/**
 * A deal-breaker's unacceptable values are validated against the *about_me* sibling's
 * options, since a deal breaker constrains what a candidate's actual trait is allowed
 * to be — not the viewer's own preference value.
 */
export async function saveDealBreakers(clerkId: string, incoming: Record<string, string[]>) {
  const keys = Object.keys(incoming);
  const [preferenceQuestions, aboutMeQuestions] = await Promise.all([
    QuestionDefinitionModel.find({ key: { $in: keys }, appliesTo: "preference", active: true }),
    QuestionDefinitionModel.find({ key: { $in: keys }, appliesTo: "about_me", active: true }),
  ]);

  const preferenceByKey = new Map(preferenceQuestions.map((q) => [q.key, q]));
  const aboutMeByKey = new Map(aboutMeQuestions.map((q) => [q.key, q]));
  const issues: string[] = [];
  const toStore: Record<string, string[]> = {};

  for (const key of keys) {
    const preferenceQuestion = preferenceByKey.get(key);
    const aboutMeQuestion = aboutMeByKey.get(key);
    const values = incoming[key];

    if (!preferenceQuestion?.canBeDealBreaker) {
      issues.push(`${key}: not a valid deal-breaker dimension`);
      continue;
    }
    if (!aboutMeQuestion) {
      issues.push(`${key}: missing matching about-me question`);
      continue;
    }
    if (!Array.isArray(values)) {
      issues.push(`${key}: must be an array of unacceptable values`);
      continue;
    }
    const allowed = new Set(aboutMeQuestion.options?.map((o) => o.value));
    const bad = values.filter((v) => !allowed.has(v));
    if (bad.length > 0) {
      issues.push(`${key}: invalid value(s) ${bad.join(", ")}`);
      continue;
    }

    toStore[key] = values;
  }

  if (issues.length > 0) throw new ValidationError(issues);

  const doc = await DealBreakerModel.findOneAndUpdate(
    { clerkId },
    { $set: Object.fromEntries(Object.entries(toStore).map(([k, v]) => [`dealBreakers.${k}`, v])) },
    { upsert: true, new: true },
  );

  return doc;
}
