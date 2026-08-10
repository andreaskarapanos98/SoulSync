import type { MatchCardDTO } from "@soulsync/shared-types";
import { UserAccountModel } from "../models/UserAccount.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { DealBreakerModel } from "../models/DealBreaker.js";
import { ProfileModel, type Profile } from "../models/Profile.js";
import { calculateAge } from "../utils/age.js";
import { getPointGivingQuestions, roundScore, type PointGivingQuestion } from "./scoringEngine.js";
import { computeScore, heightEliminates, miniScaleThresholdEliminates } from "./compatibilityScoring.js";
import { getUnlockedClerkIds } from "./unlockService.js";
import { getMutuallyBlockedClerkIds } from "./blockService.js";
import { recordMatchNotificationsIfNeeded } from "./notificationService.js";

interface Traits {
  clerkId: string;
  firstName: string;
  gender?: string;
  age?: number;
  country?: string;
  city?: string;
  languages: string[];
}

interface Prefs {
  genders: string[];
  ageRange?: [number, number];
  countryPref?: "same_country" | "anywhere";
  languagePref: string[];
}

function traitsOf(clerkId: string, answers: Record<string, unknown>): Traits {
  const dob = answers.date_of_birth as string | undefined;
  return {
    clerkId,
    firstName: (answers.first_name as string) ?? "",
    gender: answers.gender as string | undefined,
    age: dob ? calculateAge(dob) : undefined,
    country: (answers.country as string | undefined)?.trim().toLowerCase(),
    city: answers.city as string | undefined,
    languages: (answers.languages as string[] | undefined) ?? [],
  };
}

function prefsOf(answers: Record<string, unknown>): Prefs {
  return {
    genders: (answers.gender as string[] | undefined) ?? [],
    ageRange: answers.age_range as [number, number] | undefined,
    countryPref: answers.country as "same_country" | "anywhere" | undefined,
    languagePref: (answers.languages as string[] | undefined) ?? [],
  };
}

/** gender/age_range (hard_filter), and country "same_country" (relative_self). */
function passesHardFilters(prefs: Prefs, candidate: Traits, viewer: Traits): boolean {
  if (prefs.genders.length > 0 && candidate.gender && !prefs.genders.includes(candidate.gender)) {
    return false;
  }
  if (prefs.ageRange && candidate.age !== undefined) {
    const [lo, hi] = prefs.ageRange;
    const noUpperBound = hi >= 60;
    if (candidate.age < lo || (!noUpperBound && candidate.age > hi)) return false;
  }
  if (prefs.countryPref === "same_country" && candidate.country && viewer.country) {
    if (candidate.country !== viewer.country) return false;
  }
  if (prefs.languagePref.length > 0) {
    const overlap = candidate.languages.some((l) => prefs.languagePref.includes(l));
    if (!overlap) return false;
  }
  return true;
}

/**
 * Deal breakers (has_children, smoking, vaping, relationship_type) are fully specified:
 * "yes" stores the about_me values that make the trait true for that key, and any
 * candidate whose own about_me answer is in that set is eliminated entirely — same as a
 * hard filter. "no" (or never answered) means this key eliminates nobody.
 *
 * `validKeys` filters out stale entries from questions that used to be deal breakers
 * and no longer are (e.g. wants_children, religion) — those still sit in old
 * DealBreaker docs since removing a key server-side never touches previously-saved
 * data, but they must not affect matching once the question stops being one.
 */
function dealBreakersEliminate(
  dealBreakers: Record<string, string[]>,
  targetAboutMeAnswers: Record<string, unknown>,
  validKeys: Set<string>,
): boolean {
  return Object.entries(dealBreakers).some(([key, unacceptable]) => {
    if (!validKeys.has(key) || unacceptable.length === 0) return false;
    const value = targetAboutMeAnswers[key];
    return typeof value === "string" && unacceptable.includes(value);
  });
}

/** The remaining elimination gates: mini_scale thresholds and relative_self height_cm. */
function eliminatedByGradedGates(
  questions: PointGivingQuestion[],
  viewerPreferences: Record<string, unknown>,
  viewerAboutMe: Record<string, unknown>,
  candidateAboutMe: Record<string, unknown>,
): boolean {
  for (const q of questions) {
    if (q.scoringMechanic === "mini_scale" && miniScaleThresholdEliminates(q, viewerPreferences[q.key], candidateAboutMe[q.key])) {
      return true;
    }
  }
  return heightEliminates(
    viewerPreferences.height_cm,
    viewerAboutMe.height_cm as number | undefined,
    candidateAboutMe.height_cm as number | undefined,
  );
}

function isEliminated(
  questions: PointGivingQuestion[],
  validDealBreakerKeys: Set<string>,
  prefs: Prefs,
  dealBreakers: Record<string, string[]>,
  viewerPreferences: Record<string, unknown>,
  viewer: Traits,
  viewerAboutMe: Record<string, unknown>,
  candidate: Traits,
  candidateAboutMe: Record<string, unknown>,
): boolean {
  return (
    !passesHardFilters(prefs, candidate, viewer) ||
    dealBreakersEliminate(dealBreakers, candidateAboutMe, validDealBreakerKeys) ||
    eliminatedByGradedGates(questions, viewerPreferences, viewerAboutMe, candidateAboutMe)
  );
}

async function loadCandidatePool(excludeClerkId: string) {
  const accounts = await UserAccountModel.find({
    clerkId: { $ne: excludeClerkId },
    onboardingStatus: "complete",
    status: "active",
  }).lean();
  const ids = accounts.map((a) => a.clerkId);

  // Not .lean() here: `answers`/`dealBreakers` are Mongoose Maps, and Object.fromEntries
  // needs the real Map (lean() strips it down to a plain object with no entries() iterator).
  const [aboutMeDocs, preferenceDocs, dealBreakerDocs, profileDocs] = await Promise.all([
    AboutMeAnswerModel.find({ clerkId: { $in: ids } }),
    PreferenceAnswerModel.find({ clerkId: { $in: ids } }),
    DealBreakerModel.find({ clerkId: { $in: ids } }),
    ProfileModel.find({ clerkId: { $in: ids } }).lean(),
  ]);

  const aboutMeByClerkId = new Map(aboutMeDocs.map((d) => [d.clerkId, Object.fromEntries(d.answers)]));
  const preferenceByClerkId = new Map(preferenceDocs.map((d) => [d.clerkId, Object.fromEntries(d.answers)]));
  const dealBreakersByClerkId = new Map(dealBreakerDocs.map((d) => [d.clerkId, Object.fromEntries(d.dealBreakers)]));
  const profileByClerkId = new Map(profileDocs.map((d) => [d.clerkId, d]));

  return { ids, aboutMeByClerkId, preferenceByClerkId, dealBreakersByClerkId, profileByClerkId };
}

function toCard(traits: Traits, profile: Profile | undefined, score: number, unlocked: boolean): MatchCardDTO {
  const photo = profile?.photos.find((p) => p.isPrimary) ?? profile?.photos[0];
  return {
    clerkId: traits.clerkId,
    firstName: traits.firstName,
    age: traits.age,
    city: traits.city,
    country: traits.country,
    photoUrl: photo?.url,
    hasVoiceIntro: Boolean(profile?.voiceIntro),
    voiceIntroUrl: profile?.voiceIntro?.url,
    compatibility: score,
    unlocked,
  };
}

export async function getMatches(viewerClerkId: string) {
  const questions = await getPointGivingQuestions();
  const fullPoints = questions.length === 0 ? 0 : 100 / questions.length;
  const validDealBreakerKeys = new Set(questions.filter((q) => q.canBeDealBreaker).map((q) => q.key));

  const [viewerAboutMeDoc, viewerPreferenceDoc, viewerDealBreakerDoc] = await Promise.all([
    AboutMeAnswerModel.findOne({ clerkId: viewerClerkId }),
    PreferenceAnswerModel.findOne({ clerkId: viewerClerkId }),
    DealBreakerModel.findOne({ clerkId: viewerClerkId }),
  ]);
  const viewerAboutMeAnswers = viewerAboutMeDoc ? Object.fromEntries(viewerAboutMeDoc.answers) : {};
  const viewerPreferenceAnswers = viewerPreferenceDoc ? Object.fromEntries(viewerPreferenceDoc.answers) : {};
  const viewerDealBreakers = viewerDealBreakerDoc ? Object.fromEntries(viewerDealBreakerDoc.dealBreakers) : {};
  const viewer = traitsOf(viewerClerkId, viewerAboutMeAnswers);
  const viewerPrefs = prefsOf(viewerPreferenceAnswers);

  const { ids, aboutMeByClerkId, preferenceByClerkId, dealBreakersByClerkId, profileByClerkId } =
    await loadCandidatePool(viewerClerkId);
  const [unlockedClerkIds, blockedClerkIds] = await Promise.all([
    getUnlockedClerkIds(viewerClerkId),
    getMutuallyBlockedClerkIds(viewerClerkId),
  ]);

  const yourSoulmates: MatchCardDTO[] = [];
  const theirSoulmate: MatchCardDTO[] = [];

  for (const candidateId of ids) {
    if (blockedClerkIds.has(candidateId)) continue;
    const candidateAboutMeAnswers = aboutMeByClerkId.get(candidateId) ?? {};
    const candidatePreferenceAnswers = preferenceByClerkId.get(candidateId) ?? {};
    const candidateDealBreakers = dealBreakersByClerkId.get(candidateId) ?? {};
    const candidate = traitsOf(candidateId, candidateAboutMeAnswers);
    const candidatePrefs = prefsOf(candidatePreferenceAnswers);
    const profile = profileByClerkId.get(candidateId);

    if (
      !isEliminated(
        questions,
        validDealBreakerKeys,
        viewerPrefs,
        viewerDealBreakers,
        viewerPreferenceAnswers,
        viewer,
        viewerAboutMeAnswers,
        candidate,
        candidateAboutMeAnswers,
      )
    ) {
      const score = roundScore(
        computeScore({ questions, fullPoints, viewerPreferences: viewerPreferenceAnswers, candidateAboutMe: candidateAboutMeAnswers }),
      );
      // A 0% score isn't a match by any definition — don't show it in either direction.
      if (score > 0) yourSoulmates.push(toCard(candidate, profile, score, unlockedClerkIds.has(candidateId)));
    }
    if (
      !isEliminated(
        questions,
        validDealBreakerKeys,
        candidatePrefs,
        candidateDealBreakers,
        candidatePreferenceAnswers,
        candidate,
        candidateAboutMeAnswers,
        viewer,
        viewerAboutMeAnswers,
      )
    ) {
      const score = roundScore(
        computeScore({ questions, fullPoints, viewerPreferences: candidatePreferenceAnswers, candidateAboutMe: viewerAboutMeAnswers }),
      );
      if (score > 0) theirSoulmate.push(toCard(candidate, profile, score, unlockedClerkIds.has(candidateId)));
    }
  }

  yourSoulmates.sort((a, b) => b.compatibility - a.compatibility);
  theirSoulmate.sort((a, b) => b.compatibility - a.compatibility);

  // Fire-and-forget-ish, but awaited so a failure surfaces in logs rather than
  // silently vanishing — detection only happens when the viewer visits /matches,
  // there's no background job yet.
  await recordMatchNotificationsIfNeeded(viewerClerkId, yourSoulmates);

  return { yourSoulmates, theirSoulmate };
}
