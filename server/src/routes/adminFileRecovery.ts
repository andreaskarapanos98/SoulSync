import { Router } from "express";
import multer from "multer";
import { promises as fs } from "node:fs";
import path from "node:path";

// TEMPORARY — one-off recovery for a chat voice message whose file exists only on a
// local dev machine, never on Railway's volume (uploaded before the volume was
// attached). Destination is hardcoded, not client-supplied, so there's no path
// traversal surface. Remove this route once the file has been recovered.
export const adminFileRecoveryRouter = Router();

const RECOVERY_TARGET = path.resolve(process.cwd(), "uploads", "voice-messages", "2210345e-bce3-4f01-a5cb-c86eaedc4eb7.webm");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

adminFileRecoveryRouter.post("/recover-voice-message", upload.single("file"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  try {
    await fs.access(RECOVERY_TARGET);
    res.status(409).json({ error: "File already exists at the target path — not overwriting." });
    return;
  } catch {
    // Doesn't exist yet — proceed.
  }

  await fs.mkdir(path.dirname(RECOVERY_TARGET), { recursive: true });
  await fs.writeFile(RECOVERY_TARGET, req.file.buffer);
  res.json({ recovered: true, path: RECOVERY_TARGET, bytes: req.file.buffer.length });
});
