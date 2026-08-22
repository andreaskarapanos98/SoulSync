// One-off: uploads used to live on local/Railway-volume disk at /uploads/<subfolder>/<file>,
// referenced by DB rows as that same relative path. storageService.ts now writes to R2 and
// returns a full R2_PUBLIC_URL instead, so any row still holding the old relative form
// needs both its file moved and its URL rewritten — otherwise it 404s once the /uploads
// static route (removed alongside the R2 switch) is gone.
//
// Driven by the database, not the filesystem: for each row whose URL still starts with
// /uploads/, look for the file on *this* run's local disk. Run once locally (for
// server/uploads/, from local dev testing) and once via Railway's Console (for
// soulsync-volume, from production/mobile use) — between the two, every file gets found
// wherever it actually lives. Already-migrated rows (an https:// URL) are skipped, so
// running it twice, or a third time later, is safe.
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";
import { MessageModel } from "../models/Message.js";
import { ProfileModel } from "../models/Profile.js";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: env.r2AccessKeyId, secretAccessKey: env.r2SecretAccessKey },
});
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");
const OLD_PREFIX = "/uploads/";

async function migrateUrl(oldUrl: string | undefined | null): Promise<string | undefined> {
  if (!oldUrl || !oldUrl.startsWith(OLD_PREFIX)) return undefined;
  const relativeKey = oldUrl.slice(OLD_PREFIX.length); // e.g. "photos/xxx.jpg"

  let buffer: Buffer;
  try {
    buffer = await readFile(path.join(UPLOADS_ROOT, relativeKey));
  } catch {
    console.log(`  skip (not on this disk): ${oldUrl}`);
    return undefined;
  }

  await s3.send(new PutObjectCommand({ Bucket: env.r2Bucket, Key: relativeKey, Body: buffer }));
  const newUrl = `${env.r2PublicUrl}/${relativeKey}`;
  console.log(`  migrated: ${oldUrl} -> ${newUrl}`);
  return newUrl;
}

async function migrateMessages(): Promise<void> {
  const messages = await MessageModel.find({
    $or: [
      { imageUrl: { $regex: `^${OLD_PREFIX}` } },
      { videoUrl: { $regex: `^${OLD_PREFIX}` } },
      { audioUrl: { $regex: `^${OLD_PREFIX}` } },
    ],
  });
  console.log(`Messages with local-disk URLs: ${messages.length}`);
  for (const m of messages) {
    let changed = false;
    for (const field of ["imageUrl", "videoUrl", "audioUrl"] as const) {
      const newUrl = await migrateUrl(m[field]);
      if (newUrl) {
        m[field] = newUrl;
        changed = true;
      }
    }
    if (changed) await m.save();
  }
}

async function migrateProfiles(): Promise<void> {
  const profiles = await ProfileModel.find({
    $or: [{ "photos.url": { $regex: `^${OLD_PREFIX}` } }, { "voiceIntro.url": { $regex: `^${OLD_PREFIX}` } }],
  });
  console.log(`Profiles with local-disk URLs: ${profiles.length}`);
  for (const p of profiles) {
    let changed = false;
    for (const photo of p.photos) {
      const newUrl = await migrateUrl(photo.url);
      if (newUrl) {
        photo.url = newUrl;
        changed = true;
      }
    }
    if (p.voiceIntro) {
      const newUrl = await migrateUrl(p.voiceIntro.url);
      if (newUrl) {
        p.voiceIntro.url = newUrl;
        changed = true;
      }
    }
    if (changed) await p.save();
  }
}

async function main() {
  await mongoose.connect(env.mongoUri);
  console.log("Connected. Uploads root for this run:", UPLOADS_ROOT);
  await migrateMessages();
  await migrateProfiles();
  console.log("Done.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
