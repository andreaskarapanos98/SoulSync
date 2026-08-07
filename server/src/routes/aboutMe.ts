import { Router } from "express";
import { getAuth } from "@clerk/express";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { UserAccountModel } from "../models/UserAccount.js";
import { ValidationError, getMissingRequiredAboutMe, saveAboutMeAnswers } from "../services/questionnaireService.js";

export const aboutMeRouter = Router();

aboutMeRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [doc, missingRequired] = await Promise.all([
    AboutMeAnswerModel.findOne({ clerkId: userId }),
    getMissingRequiredAboutMe(userId),
  ]);

  res.json({
    answers: doc ? Object.fromEntries(doc.answers) : {},
    missingRequired,
  });
});

aboutMeRouter.put("/", async (req, res) => {
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
    await saveAboutMeAnswers(userId, answers);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: "Validation failed", issues: err.issues });
      return;
    }
    throw err;
  }

  const missingRequired = await getMissingRequiredAboutMe(userId);

  // First time all required "about me" questions are answered, advance onboarding.
  // Later phases (preferences, profile) will add their own forward-only transitions.
  if (missingRequired.length === 0) {
    await UserAccountModel.updateOne(
      { clerkId: userId, onboardingStatus: "not_started" },
      { $set: { onboardingStatus: "about_me" } },
    );
  }

  res.json({ saved: true, missingRequired });
});
