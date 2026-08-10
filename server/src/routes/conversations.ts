import { Router } from "express";
import multer from "multer";
import { getAuth } from "@clerk/express";
import type { Message } from "../models/Message.js";
import { ValidationError } from "../services/questionnaireService.js";
import {
  ALLOWED_AUDIO_TYPES,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_VIDEO_TYPES,
  baseMimeType,
  saveFile,
} from "../services/storageService.js";
import {
  NotUnlockedError,
  deleteMessage,
  editMessage,
  firstNameAndPhoto,
  getConversations,
  getLatestUnreadMessageAt,
  getMessages,
  getUnreadConversationCount,
  isOtherTyping,
  markConversationRead,
  sendMediaMessage,
  sendMessage,
  sendVoiceMessage,
  setTyping,
} from "../services/messageService.js";
import { isUnlockedEitherDirection } from "../services/unlockService.js";

export const conversationsRouter = Router();

const MAX_VOICE_MESSAGE_DURATION_SEC = 61;

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

const ALLOWED_MEDIA_TYPES: Record<string, string> = { ...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES };

const uploadMedia = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MEDIA_TYPES[baseMimeType(file.mimetype)]) {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
      return;
    }
    cb(null, true);
  },
});

function toMessageDTO(m: Message & { _id: unknown }) {
  const withTimestamps = m as unknown as { createdAt: Date; readAt?: Date; editedAt?: Date; deletedAt?: Date };
  return {
    id: String(m._id),
    fromClerkId: m.fromClerkId,
    toClerkId: m.toClerkId,
    body: m.body ?? "",
    audioUrl: m.audioUrl,
    imageUrl: m.imageUrl,
    videoUrl: m.videoUrl,
    durationSec: m.durationSec,
    createdAt: withTimestamps.createdAt.toISOString(),
    readAt: withTimestamps.readAt ? withTimestamps.readAt.toISOString() : undefined,
    editedAt: withTimestamps.editedAt ? withTimestamps.editedAt.toISOString() : undefined,
    deleted: Boolean(withTimestamps.deletedAt),
  };
}

conversationsRouter.get("/unread-count", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [count, latestUnreadMessageAt] = await Promise.all([
    getUnreadConversationCount(userId),
    getLatestUnreadMessageAt(userId),
  ]);
  res.json({ count, latestUnreadMessageAt });
});

conversationsRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const conversations = await getConversations(userId);
  res.json({ conversations });
});

conversationsRouter.get("/:otherClerkId/messages", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await markConversationRead(userId, req.params.otherClerkId);

  const [messages, other, otherTyping] = await Promise.all([
    getMessages(userId, req.params.otherClerkId),
    firstNameAndPhoto(req.params.otherClerkId),
    isOtherTyping(userId, req.params.otherClerkId),
  ]);

  res.json({
    messages: messages.map(toMessageDTO),
    otherFirstName: other.firstName,
    otherPhotoUrl: other.photoUrl,
    otherIsTyping: otherTyping,
  });
});

conversationsRouter.post("/:otherClerkId/messages", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { body } = req.body as { body?: string };
  if (typeof body !== "string") {
    res.status(400).json({ error: "Request body must include a 'body' string" });
    return;
  }

  try {
    const message = await sendMessage(userId, req.params.otherClerkId, body);
    res.json({ message: toMessageDTO(message) });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: "Validation failed", issues: err.issues });
      return;
    }
    if (err instanceof NotUnlockedError) {
      res.status(403).json({ error: err.message });
      return;
    }
    throw err;
  }
});

conversationsRouter.post("/:otherClerkId/voice-messages", upload.single("audio"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No audio uploaded" });
    return;
  }
  if (!(await isUnlockedEitherDirection(userId, req.params.otherClerkId))) {
    res.status(403).json({ error: "You need to unlock this profile before you can message them" });
    return;
  }

  const durationSec = Number(req.body.durationSec);
  if (!Number.isFinite(durationSec) || durationSec <= 0 || durationSec > MAX_VOICE_MESSAGE_DURATION_SEC) {
    res.status(400).json({ error: `durationSec must be between 0 and ${MAX_VOICE_MESSAGE_DURATION_SEC}` });
    return;
  }

  const extension = ALLOWED_AUDIO_TYPES[baseMimeType(req.file.mimetype)];
  const { url } = await saveFile(req.file.buffer, "voice-messages", extension);
  const message = await sendVoiceMessage(userId, req.params.otherClerkId, url, durationSec);
  res.json({ message: toMessageDTO(message) });
});

conversationsRouter.post("/:otherClerkId/media", uploadMedia.single("file"), async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!req.file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }
  if (!(await isUnlockedEitherDirection(userId, req.params.otherClerkId))) {
    res.status(403).json({ error: "You need to unlock this profile before you can message them" });
    return;
  }

  const mimeType = baseMimeType(req.file.mimetype);
  const kind: "image" | "video" = ALLOWED_IMAGE_TYPES[mimeType] ? "image" : "video";
  const extension = ALLOWED_MEDIA_TYPES[mimeType];
  const { url } = await saveFile(req.file.buffer, "chat-media", extension);
  const message = await sendMediaMessage(userId, req.params.otherClerkId, kind, url);
  res.json({ message: toMessageDTO(message) });
});

conversationsRouter.patch("/messages/:messageId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { body } = req.body as { body?: string };
  if (typeof body !== "string") {
    res.status(400).json({ error: "Request body must include a 'body' string" });
    return;
  }

  try {
    const message = await editMessage(userId, req.params.messageId, body);
    res.json({ message: toMessageDTO(message) });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: "Validation failed", issues: err.issues });
      return;
    }
    throw err;
  }
});

conversationsRouter.delete("/messages/:messageId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  try {
    const message = await deleteMessage(userId, req.params.messageId);
    res.json({ message: toMessageDTO(message) });
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: "Validation failed", issues: err.issues });
      return;
    }
    throw err;
  }
});

conversationsRouter.post("/:otherClerkId/typing", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await setTyping(userId, req.params.otherClerkId);
  res.json({ ok: true });
});
