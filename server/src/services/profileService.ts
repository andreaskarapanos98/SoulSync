import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { ProfileModel } from "../models/Profile.js";
import { QuestionDefinitionModel } from "../models/QuestionDefinition.js";
import { UserAccountModel } from "../models/UserAccount.js";
import { calculateAge } from "../utils/age.js";
import { track } from "./analyticsService.js";

// Categories whose about_me answers are safe to surface on a profile. Values,
// relationship_goals, family, and communication stay private — they only feed
// the compatibility engine, never rendered raw.
const PUBLIC_TRAIT_CATEGORIES = ["lifestyle", "personality"] as const;

export function toPhotoDTOs(profile: {
  photos: { _id: unknown; url: string; isPrimary: boolean; focalPoint?: { x: number; y: number } | null }[];
}) {
  return profile.photos.map((p) => ({
    id: String(p._id),
    url: p.url,
    isPrimary: p.isPrimary,
    focalPoint: { x: p.focalPoint?.x ?? 50, y: p.focalPoint?.y ?? 50 },
  }));
}

/**
 * Assembles a profile from AboutMeAnswer (identity + traits) and Profile (photos,
 * bio, voice intro) — Profile itself never duplicates data that already lives in
 * AboutMeAnswer. Used for both self-view and (for now) public view; once unlocking
 * exists (Phase 7) the public path will strip this down further before a match
 * is paid for.
 */
export async function assembleProfile(clerkId: string) {
  const [aboutMe, profile, traitQuestions, account] = await Promise.all([
    AboutMeAnswerModel.findOne({ clerkId }),
    ProfileModel.findOne({ clerkId }),
    QuestionDefinitionModel.find({
      appliesTo: "about_me",
      category: { $in: PUBLIC_TRAIT_CATEGORIES },
      active: true,
    }).sort({ category: 1, order: 1 }),
    UserAccountModel.findOne({ clerkId }).select("verificationStatus").lean(),
  ]);

  const answers: Record<string, unknown> = aboutMe ? Object.fromEntries(aboutMe.answers) : {};

  const dateOfBirth = answers.date_of_birth as string | undefined;

  const traits = traitQuestions
    .filter((q) => answers[q.key] !== undefined)
    .map((q) => ({ key: q.key, category: q.category, label: q.label, value: answers[q.key] }));

  return {
    firstName: (answers.first_name as string) ?? "",
    age: dateOfBirth ? calculateAge(dateOfBirth) : undefined,
    nationality: answers.nationality as string | undefined,
    country: answers.country as string | undefined,
    city: answers.city as string | undefined,
    occupation: answers.occupation as string | undefined,
    education: answers.education as string | undefined,
    languages: answers.languages as string[] | undefined,
    bio: profile?.bio ?? "",
    photos: (profile?.photos ?? []).map((p) => ({
      id: String(p._id),
      url: p.url,
      isPrimary: p.isPrimary,
      focalPoint: { x: p.focalPoint?.x ?? 50, y: p.focalPoint?.y ?? 50 },
    })),
    voiceIntro: profile?.voiceIntro
      ? { url: profile.voiceIntro.url, durationSec: profile.voiceIntro.durationSec }
      : null,
    traits,
    verified: account?.verificationStatus === "verified",
  };
}

/** What's still missing before the profile phase counts as done. */
export async function getProfileCompletionGaps(clerkId: string): Promise<string[]> {
  const profile = await ProfileModel.findOne({ clerkId });
  const missing: string[] = [];
  if (!profile?.photos.some((p) => p.isPrimary)) missing.push("a primary photo");
  if (!profile?.bio?.trim()) missing.push("a bio");
  return missing;
}

/** Forward-only: only advances out of "preferences", same pattern as the earlier phases. */
export async function advanceOnboardingIfProfileComplete(clerkId: string): Promise<string[]> {
  const missing = await getProfileCompletionGaps(clerkId);
  if (missing.length === 0) {
    const result = await UserAccountModel.updateOne(
      { clerkId, onboardingStatus: "preferences" },
      { $set: { onboardingStatus: "complete" } },
    );
    if (result.modifiedCount > 0) await track(clerkId, "profile_completed");
  }
  return missing;
}
