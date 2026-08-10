import { Router } from "express";
import { getAuth } from "@clerk/express";
import { assembleProfile } from "../services/profileService.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { getPointGivingQuestions } from "../services/scoringEngine.js";
import { computeScoreByCategory } from "../services/compatibilityScoring.js";
import { isUnlockedEitherDirection } from "../services/unlockService.js";

export const publicProfilesRouter = Router();

publicProfilesRouter.get("/:clerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const profile = await assembleProfile(req.params.clerkId);
  const isSelf = userId === req.params.clerkId;

  // Comparing someone against themselves isn't a compatibility score — only compute
  // this when viewing someone else's profile.
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
      compatibilityByCategory,
      locked: true,
    });
    return;
  }

  res.json({ ...profile, compatibilityByCategory, locked: false });
});
