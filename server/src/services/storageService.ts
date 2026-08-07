import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Local-disk implementation for now. Target production backend: Cloudflare R2
// (S3-compatible API). When we wire that up, only this file changes — saveFile()
// will PUT to R2 via the S3 SDK and return the public R2 URL instead of a local
// path; deleteFile() will issue a DeleteObject call. Every caller (routes,
// profileService) only ever sees {url} back, so nothing outside this file needs
// to change. Expected future env vars: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID,
// R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_URL.
const UPLOADS_ROOT = path.resolve(process.cwd(), "uploads");

export async function saveFile(
  buffer: Buffer,
  subfolder: "photos" | "voice-intros",
  extension: string,
): Promise<{ url: string }> {
  const dir = path.join(UPLOADS_ROOT, subfolder);
  await mkdir(dir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const filePath = path.join(dir, filename);
  await writeFile(filePath, buffer);

  return { url: `/uploads/${subfolder}/${filename}` };
}

export async function deleteFile(url: string): Promise<void> {
  if (!url.startsWith("/uploads/")) return;
  const filePath = path.join(UPLOADS_ROOT, url.slice("/uploads/".length));
  await unlink(filePath).catch(() => {});
}
