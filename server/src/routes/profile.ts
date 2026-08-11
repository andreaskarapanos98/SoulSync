import { Router } from "express";
import { getAuth } from "@clerk/express";
import { ProfileModel } from "../models/Profile.js";
import { UserAccountModel } from "../models/UserAccount.js";
import { advanceOnboardingIfProfileComplete, assembleProfile, getProfileCompletionGaps } from "../services/profileService.js";
import { VERIFICATION_COST_COINS } from "../services/coinService.js";

export const profileRouter = Router();

profileRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [profile, missingRequired, account] = await Promise.all([
    assembleProfile(userId),
    getProfileCompletionGaps(userId),
    UserAccountModel.findOne({ clerkId: userId }).select("verificationStatus").lean(),
  ]);

  res.json({
    ...profile,
    missingRequired,
    verificationStatus: account?.verificationStatus ?? "unverified",
    verificationCostCoins: VERIFICATION_COST_COINS,
  });
});

profileRouter.put("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { bio } = req.body as { bio?: string };
  if (typeof bio !== "string" || bio.length > 500) {
    res.status(400).json({ error: "bio must be a string of 500 characters or fewer" });
    return;
  }

  await ProfileModel.findOneAndUpdate({ clerkId: userId }, { $set: { bio } }, { upsert: true });

  const missingRequired = await advanceOnboardingIfProfileComplete(userId);
  res.json({ saved: true, missingRequired });
});
