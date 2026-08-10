import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { getPointGivingQuestions, roundScore } from "./scoringEngine.js";
import { computeScore } from "./compatibilityScoring.js";

/**
 * How well `targetClerkId` fits what `viewerClerkId` is looking for — the same
 * "yourSoulmates" direction computed in matchService.getMatches() and used for match
 * notifications, kept in its own module (rather than matchService.ts) so unlockService.ts
 * can depend on it without a matchService <-> unlockService import cycle.
 */
export async function getCompatibilityScore(viewerClerkId: string, targetClerkId: string): Promise<number> {
  const questions = await getPointGivingQuestions();
  const fullPoints = questions.length === 0 ? 0 : 100 / questions.length;

  const [viewerPreferenceDoc, targetAboutMeDoc] = await Promise.all([
    PreferenceAnswerModel.findOne({ clerkId: viewerClerkId }),
    AboutMeAnswerModel.findOne({ clerkId: targetClerkId }),
  ]);
  const viewerPreferenceAnswers = viewerPreferenceDoc ? Object.fromEntries(viewerPreferenceDoc.answers) : {};
  const targetAboutMeAnswers = targetAboutMeDoc ? Object.fromEntries(targetAboutMeDoc.answers) : {};

  return roundScore(
    computeScore({
      questions,
      fullPoints,
      viewerPreferences: viewerPreferenceAnswers,
      candidateAboutMe: targetAboutMeAnswers,
    }),
  );
}
