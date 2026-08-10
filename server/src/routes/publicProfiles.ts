import { Router } from "express";
import { getAuth } from "@clerk/express";
import { assembleProfile } from "../services/profileService.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { getPointGivingQuestions } from "../services/scoringEngine.js";
import { computeScoreByCategory } from "../services/compatibilityScoring.js";

export const publicProfilesRouter = Router();

// Full profile data for now — no locking yet. Phase 7 (unlocking) will strip this
// down to a preview (photo, first name, age, location, voice intro) for viewers
// who haven't paid to unlock the match yet.
publicProfilesRouter.get("/:clerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const profile = await assembleProfile(req.params.clerkId);

  // Comparing someone against themselves isn't a compatibility score — only compute
  // this when viewing someone else's profile.
  let compatibilityByCategory: ReturnType<typeof computeScoreByCategory> | undefined;
  if (userId !== req.params.clerkId) {
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

  res.json({ ...profile, compatibilityByCategory });
});
