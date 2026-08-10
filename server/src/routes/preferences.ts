import { Router } from "express";
import { getAuth } from "@clerk/express";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { UserAccountModel } from "../models/UserAccount.js";
import {
  ValidationError,
  getMissingRequiredPreferences,
  savePreferenceAnswers,
} from "../services/questionnaireService.js";
import { track } from "../services/analyticsService.js";

export const preferencesRouter = Router();

preferencesRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [doc, missingRequired] = await Promise.all([
    PreferenceAnswerModel.findOne({ clerkId: userId }),
    getMissingRequiredPreferences(userId),
  ]);

  res.json({
    answers: doc ? Object.fromEntries(doc.answers) : {},
    missingRequired,
  });
});

preferencesRouter.put("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { answers } = req.body as { answers?: Record<string, unknown> };
  if (!answers || typeof answers !== "object") {
    res.status(400).json({ error: "Request body must include an 'answers' object" });
    return;
  }

  try {
    await savePreferenceAnswers(userId, answers);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: "Validation failed", issues: err.issues });
      return;
    }
    throw err;
  }

  const missingRequired = await getMissingRequiredPreferences(userId);

  // Forward-only: only advance out of "about_me", never regress a later status.
  if (missingRequired.length === 0) {
    const result = await UserAccountModel.updateOne(
      { clerkId: userId, onboardingStatus: "about_me" },
      { $set: { onboardingStatus: "preferences" } },
    );
    if (result.modifiedCount > 0) await track(userId, "onboarding_completed");
  }

  res.json({ saved: true, missingRequired });
});
