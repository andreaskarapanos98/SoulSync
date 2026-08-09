import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { ProfileModel } from "../models/Profile.js";
import { ALLOWED_AUDIO_TYPES, baseMimeType, deleteFile, saveFile } from "../services/storageService.js";
import { advanceOnboardingIfProfileComplete } from "../services/profileService.js";

export const voiceIntroRouter = Router();

// Small buffer over the 30s cap in the brief, for client-side timing imprecision.
const MAX_DURATION_SEC = 31;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_AUDIO_TYPES[baseMimeType(file.mimetype)]) {
      cb(new Error(`Unsupported audio type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

voiceIntroRouter.post("/", upload.single("audio"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No audio uploaded" });
    return;
  }

  const durationSec = Number(req.body.durationSec);
  if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > MAX_DURATION_SEC) {
    res.status(400).json({ error: `durationSec must be between 0 and ${MAX_DURATION_SEC}` });
    return;
  }

  const profile = await ProfileModel.findOneAndUpdate(
    { clerkId: userId },
    {},
    { upsert: true, returnDocument: "after" },
  );

  if (profile.voiceIntro) {
    await deleteFile(profile.voiceIntro.url);
  }

  const extension = ALLOWED_AUDIO_TYPES[baseMimeType(req.file.mimetype)];
  const { url } = await saveFile(req.file.buffer, "voice-intros", extension);

  profile.voiceIntro = { url, durationSec };
  await profile.save();

  const missingRequired = await advanceOnboardingIfProfileComplete(userId);
  res.json({
    voiceIntro: { url: profile.voiceIntro.url, durationSec: profile.voiceIntro.durationSec },
    missingRequired,
  });
});

voiceIntroRouter.delete("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const profile = await ProfileModel.findOne({ clerkId: userId });
  if (profile?.voiceIntro) {
    await deleteFile(profile.voiceIntro.url);
    profile.voiceIntro = undefined;
    await profile.save();
  }

  res.json({ voiceIntro: null });
});
