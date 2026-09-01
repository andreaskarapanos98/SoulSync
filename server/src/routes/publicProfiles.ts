import { Router } from "express";
import { getAuth } from "@clerk/express";
import { assembleProfile } from "../services/profileService.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { UserAccountModel } from "../models/UserAccount.js";
import { getPointGivingQuestions, roundScore } from "../services/scoringEngine.js";
import { computeScore, computeScoreByCategory } from "../services/compatibilityScoring.js";
import { isUnlockedEitherDirection } from "../services/unlockService.js";

export const publicProfilesRouter = Router();

publicProfilesRouter.get("/:clerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const isSelf = userId === req.params.clerkId;

  // requireActiveAccount only blocks a banned/suspended user's OWN requests — it never
  // checks the status of the profile being *viewed*. Without this, a banned user stays
  // fully visible to anyone who already has a link to them (an existing match, unlock,
  // or chat thread), even though loadCandidatePool() already excludes them from new
  // match/browse discovery. Treat "not active" the same as "doesn't exist" rather than
  // exposing the restricted state to the viewer.
  if (!isSelf) {
    const targetAccount = await UserAccountModel.findOne({ clerkId: req.params.clerkId }).select("status").lean();
    if (!targetAccount || targetAccount.status !== "active") {
      res.status(404).json({ error: "Profile not found" });
      return;
    }
  }

  const profile = await assembleProfile(req.params.clerkId);

  // Comparing someone against themselves isn't a compatibility score — only compute
  // this when viewing someone else's profile.
  let compatibility: number | undefined;
  let compatibilityByCategory: ReturnType<typeof computeScoreByCategory> | undefined;
  if (!isSelf) {
    const [questions, viewerPreferenceDoc, candidateAboutMeDoc] = await Promise.all([
      getPointGivingQuestions(),
      PreferenceAnswerModel.findOne({ clerkId: userId }),
      AboutMeAnswerModel.findOne({ clerkId: req.params.clerkId }),
    ]);
    const fullPoints = questions.length === 0 ? 0 : 100 / questions.length;
    const viewerPreferences = viewerPreferenceDoc ? Object.fromEntries(viewerPreferenceDoc.answers) : {};
    const candidateAboutMe = candidateAboutMeDoc ? Object.fromEntries(candidateAboutMeDoc.answers) : {};
    // Same direction, same math as the "Your Soulmates" score on the match card this
    // profile was opened from — computeScore() (not an average of the category
    // percentages, which are each normalized within their own category and don't sum
    // back to the overall score).
    compatibility = roundScore(computeScore({ questions, fullPoints, viewerPreferences, candidateAboutMe }));
    compatibilityByCategory = computeScoreByCategory({ questions, fullPoints, viewerPreferences, candidateAboutMe }).sort(
      (a, b) => b.percent - a.percent,
    );
  }

  // Unlocking is what pays for full profile access — this endpoint used to return the
  // complete profile to anyone signed in, bypassing the coin paywall entirely. Strip it
  // down to a preview unless the viewer (or the reverse direction) has actually unlocked.
  const unlocked = isSelf || (await isUnlockedEitherDirection(userId, req.params.clerkId));
  if (!unlocked) {
    res.json({
      firstName: profile.firstName,
      age: profile.age,
      country: profile.country,
      city: profile.city,
      bio: "",
      photos: profile.photos.slice(0, 1),
      voiceIntro: profile.voiceIntro,
      traits: [],
      compatibility,
      compatibilityByCategory,
      locked: true,
    });
    return;
  }

  res.json({ ...profile, compatibility, compatibilityByCategory, locked: false });
});
