import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import { ProfileModel } from "../models/Profile.js";
import { deleteFile, saveFile } from "../services/storageService.js";
import { advanceOnboardingIfProfileComplete } from "../services/profileService.js";

export const profilePhotosRouter = Router();

const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const MAX_PHOTOS = 5;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_TYPES[file.mimetype]) {
      cb(new Error("Unsupported image type — use JPEG, PNG, or WebP"));
      return;
    }
    cb(null, true);
  },
});

function toPhotoDTOs(profile: {
  photos: { _id: unknown; url: string; isPrimary: boolean; focalPoint?: { x: number; y: number } | null }[];
}) {
  return profile.photos.map((p) => ({
    id: String(p._id),
    url: p.url,
    isPrimary: p.isPrimary,
    focalPoint: { x: p.focalPoint?.x ?? 50, y: p.focalPoint?.y ?? 50 },
  }));
}

profilePhotosRouter.post("/", upload.single("photo"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No photo uploaded" });
    return;
  }

  const profile = await ProfileModel.findOneAndUpdate(
    { clerkId: userId },
    {},
    { upsert: true, returnDocument: "after" },
  );

  if (profile.photos.length >= MAX_PHOTOS) {
    res.status(400).json({ error: `Maximum ${MAX_PHOTOS} photos allowed` });
    return;
  }

  const extension = ALLOWED_IMAGE_TYPES[req.file.mimetype];
  const { url } = await saveFile(req.file.buffer, "photos", extension);

  // The first photo a user uploads automatically becomes primary.
  const isPrimary = profile.photos.length === 0;
  profile.photos.push({ url, isPrimary });
  await profile.save();

  const missingRequired = await advanceOnboardingIfProfileComplete(userId);
  res.json({ photos: toPhotoDTOs(profile), missingRequired });
});

profilePhotosRouter.delete("/:photoId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const profile = await ProfileModel.findOne({ clerkId: userId });
  const idx = profile?.photos.findIndex((p) => String(p._id) === req.params.photoId) ?? -1;
  if (!profile || idx === -1) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  const [removed] = profile.photos.splice(idx, 1);
  await deleteFile(removed.url);
  if (removed.isPrimary && profile.photos.length > 0) {
    profile.photos[0].isPrimary = true;
  }
  await profile.save();

  const missingRequired = await advanceOnboardingIfProfileComplete(userId);
  res.json({ photos: toPhotoDTOs(profile), missingRequired });
});

profilePhotosRouter.patch("/:photoId/primary", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const profile = await ProfileModel.findOne({ clerkId: userId });
  const target = profile?.photos.find((p) => String(p._id) === req.params.photoId);
  if (!profile || !target) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  for (const p of profile.photos) {
    p.isPrimary = String(p._id) === req.params.photoId;
  }
  await profile.save();

  const missingRequired = await advanceOnboardingIfProfileComplete(userId);
  res.json({ photos: toPhotoDTOs(profile), missingRequired });
});

profilePhotosRouter.patch("/:photoId/focal-point", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { x, y } = req.body as { x?: unknown; y?: unknown };
  if (typeof x !== "number" || typeof y !== "number" || x < 0 || x > 100 || y < 0 || y > 100) {
    res.status(400).json({ error: "x and y must be numbers between 0 and 100" });
    return;
  }

  const profile = await ProfileModel.findOne({ clerkId: userId });
  const target = profile?.photos.find((p) => String(p._id) === req.params.photoId);
  if (!profile || !target) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  target.focalPoint = { x, y };
  await profile.save();

  res.json({ photos: toPhotoDTOs(profile) });
});
