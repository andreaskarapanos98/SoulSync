import { QuestionDefinitionModel } from "../models/QuestionDefinition.js";

/**
 * Every active preference question that isn't "filler" gives points — hard filters,
 * relative_self, checklist, mini_scale, and ranking questions all score full points on
 * survival, same as deal breakers. Counted dynamically (not hardcoded) because the
 * questionnaire will keep changing as questions are added or removed.
 */
export async function countPointGivingQuestions(): Promise<number> {
  return QuestionDefinitionModel.countDocuments({
    appliesTo: "preference",
    active: true,
    scoringMechanic: { $exists: true, $ne: "filler" },
  });
}

/** 100 spread evenly across every point-giving question. */
export async function getFullPointsPerQuestion(): Promise<number> {
  const count = await countPointGivingQuestions();
  return count === 0 ? 0 : 100 / count;
}

/** Round-half-up to the nearest whole percent (77.5 -> 78, 77.4 -> 77). */
export function roundScore(rawScore: number): number {
  return Math.round(rawScore);
}
