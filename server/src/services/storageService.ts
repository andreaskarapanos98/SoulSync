import { randomUUID } from "node:crypto";
import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

// Cloudflare R2 (S3-compatible). Every caller only ever sees {url} back from saveFile
// and a key parsed back out of that same url in deleteFile — nothing outside this file
// needs to know storage lives in R2 rather than on local disk, which is what let this
// migration happen without touching a single route or service that uploads a file.
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.r2AccessKeyId,
    secretAccessKey: env.r2SecretAccessKey,
  },
});

export const ALLOWED_AUDIO_TYPES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/ogg": "ogg",
};

export const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const ALLOWED_VIDEO_TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

// Browsers report MediaRecorder's mimeType with codec params, e.g.
// "audio/webm;codecs=opus" — strip everything after ';' before matching.
export function baseMimeType(mimetype: string): string {
  return mimetype.split(";")[0].trim();
}

export async function saveFile(
  buffer: Buffer,
  subfolder: "photos" | "voice-intros" | "voice-messages" | "chat-media",
  extension: string,
): Promise<{ url: string }> {
  const key = `${subfolder}/${randomUUID()}.${extension}`;
  await s3.send(new PutObjectCommand({ Bucket: env.r2Bucket, Key: key, Body: buffer }));
  return { url: `${env.r2PublicUrl}/${key}` };
}

export async function deleteFile(url: string): Promise<void> {
  if (!url.startsWith(env.r2PublicUrl)) return;
  const key = url.slice(env.r2PublicUrl.length + 1); // +1 for the separating '/'
  await s3.send(new DeleteObjectCommand({ Bucket: env.r2Bucket, Key: key })).catch(() => {});
}
