import type { MatchCardDTO } from "@soulsync/shared-types";
import { UserAccountModel } from "../models/UserAccount.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { ProfileModel, type Profile } from "../models/Profile.js";
import { calculateAge } from "../utils/age.js";

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

/**
 * The only mechanics that are fully specified AND require no data we don't
 * already have: gender/age_range (hard_filter), country (relative_self, but
 * behaves as elimination when "same_country" is selected), languages
 * (checklist, eliminates on zero overlap). Everything else (mini_scale,
 * ranking, remaining checklists) isn't implemented yet, so a candidate that
 * survives these gates gets a stable placeholder score rather than a fake
 * precise one.
 */
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

// Deterministic per-pair placeholder in the 55-97 range, stable across reloads,
// distinct per direction. Swap this out once the real weighted score exists.
function placeholderScore(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return 55 + (Math.abs(hash) % 43);
}

async function loadCandidatePool(excludeClerkId: string) {
  const accounts = await UserAccountModel.find({
    clerkId: { $ne: excludeClerkId },
    onboardingStatus: "complete",
    status: "active",
  }).lean();
  const ids = accounts.map((a) => a.clerkId);

  // Not .lean() here: `answers` is a Mongoose Map, and Object.fromEntries needs the
  // real Map (lean() strips it down to a plain object with no entries() iterator).
  const [aboutMeDocs, preferenceDocs, profileDocs] = await Promise.all([
    AboutMeAnswerModel.find({ clerkId: { $in: ids } }),
    PreferenceAnswerModel.find({ clerkId: { $in: ids } }),
    ProfileModel.find({ clerkId: { $in: ids } }).lean(),
  ]);

  const aboutMeByClerkId = new Map(aboutMeDocs.map((d) => [d.clerkId, Object.fromEntries(d.answers)]));
  const preferenceByClerkId = new Map(preferenceDocs.map((d) => [d.clerkId, Object.fromEntries(d.answers)]));
  const profileByClerkId = new Map(profileDocs.map((d) => [d.clerkId, d]));

  return { ids, aboutMeByClerkId, preferenceByClerkId, profileByClerkId };
}

function toCard(traits: Traits, profile: Profile | undefined, score: number): MatchCardDTO {
  const photo = profile?.photos.find((p) => p.isPrimary) ?? profile?.photos[0];
  return {
    clerkId: traits.clerkId,
    firstName: traits.firstName,
    age: traits.age,
    city: traits.city,
    country: traits.country,
    photoUrl: photo?.url,
    hasVoiceIntro: Boolean(profile?.voiceIntro),
    compatibility: score,
  };
}

export async function getMatches(viewerClerkId: string) {
  const [viewerAboutMeDoc, viewerPreferenceDoc] = await Promise.all([
    AboutMeAnswerModel.findOne({ clerkId: viewerClerkId }),
    PreferenceAnswerModel.findOne({ clerkId: viewerClerkId }),
  ]);
  const viewerAboutMeAnswers = viewerAboutMeDoc ? Object.fromEntries(viewerAboutMeDoc.answers) : {};
  const viewerPreferenceAnswers = viewerPreferenceDoc ? Object.fromEntries(viewerPreferenceDoc.answers) : {};
  const viewer = traitsOf(viewerClerkId, viewerAboutMeAnswers);
  const viewerPrefs = prefsOf(viewerPreferenceAnswers);

  const { ids, aboutMeByClerkId, preferenceByClerkId, profileByClerkId } =
    await loadCandidatePool(viewerClerkId);

  const yourSoulmates: MatchCardDTO[] = [];
  const theirSoulmate: MatchCardDTO[] = [];

  for (const candidateId of ids) {
    const candidateAboutMeAnswers = aboutMeByClerkId.get(candidateId) ?? {};
    const candidatePreferenceAnswers = preferenceByClerkId.get(candidateId) ?? {};
    const candidate = traitsOf(candidateId, candidateAboutMeAnswers);
    const candidatePrefs = prefsOf(candidatePreferenceAnswers);
    const profile = profileByClerkId.get(candidateId);

    if (passesHardFilters(viewerPrefs, candidate, viewer)) {
      yourSoulmates.push(toCard(candidate, profile, placeholderScore(`${viewerClerkId}>${candidateId}`)));
    }
    if (passesHardFilters(candidatePrefs, viewer, candidate)) {
      theirSoulmate.push(toCard(candidate, profile, placeholderScore(`${candidateId}>${viewerClerkId}`)));
    }
  }

  yourSoulmates.sort((a, b) => b.compatibility - a.compatibility);
  theirSoulmate.sort((a, b) => b.compatibility - a.compatibility);

  return { yourSoulmates, theirSoulmate };
}
