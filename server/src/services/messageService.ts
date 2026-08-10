import { MessageModel } from "../models/Message.js";
import { TypingStatusModel } from "../models/TypingStatus.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { ProfileModel } from "../models/Profile.js";
import { ValidationError } from "./questionnaireService.js";
import { getPointGivingQuestions, roundScore } from "./scoringEngine.js";
import { computeScore } from "./compatibilityScoring.js";
import { deleteFile } from "./storageService.js";

// A typing status is considered live for this long after the last ping — the client
// re-pings every ~2s while the user keeps typing.
const TYPING_TTL_MS = 4000;

export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join("::");
}

/**
 * No unlock/payment gate yet (that's a later phase) — any two authenticated users can
 * message each other for now, for testing.
 */
export async function sendMessage(fromClerkId: string, toClerkId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new ValidationError(["Message cannot be empty"]);
  if (trimmed.length > 2000) throw new ValidationError(["Message is too long (max 2000 characters)"]);

  return MessageModel.create({
    conversationId: conversationIdFor(fromClerkId, toClerkId),
    fromClerkId,
    toClerkId,
    body: trimmed,
  });
}

export async function sendVoiceMessage(fromClerkId: string, toClerkId: string, audioUrl: string, durationSec: number) {
  return MessageModel.create({
    conversationId: conversationIdFor(fromClerkId, toClerkId),
    fromClerkId,
    toClerkId,
    audioUrl,
    durationSec,
  });
}

/** Only the sender can edit, only while it isn't deleted, and only text (not voice). */
export async function editMessage(clerkId: string, messageId: string, newBody: string) {
  const trimmed = newBody.trim();
  if (!trimmed) throw new ValidationError(["Message cannot be empty"]);
  if (trimmed.length > 2000) throw new ValidationError(["Message is too long (max 2000 characters)"]);

  const message = await MessageModel.findById(messageId);
  if (!message) throw new ValidationError(["Message not found"]);
  if (message.fromClerkId !== clerkId) throw new ValidationError(["You can only edit your own messages"]);
  if (message.deletedAt) throw new ValidationError(["Can't edit a deleted message"]);
  if (message.audioUrl) throw new ValidationError(["Can't edit a voice message"]);

  message.body = trimmed;
  message.editedAt = new Date();
  await message.save();
  return message;
}

/**
 * Soft delete — keeps the row (so both sides' polling picks up the same "deleted"
 * state and read/ordering stays consistent) but clears the actual content. Only the
 * sender can delete.
 */
export async function deleteMessage(clerkId: string, messageId: string) {
  const message = await MessageModel.findById(messageId);
  if (!message) throw new ValidationError(["Message not found"]);
  if (message.fromClerkId !== clerkId) throw new ValidationError(["You can only delete your own messages"]);
  if (message.deletedAt) return message;

  if (message.audioUrl) await deleteFile(message.audioUrl);
  message.body = "";
  message.audioUrl = undefined;
  message.durationSec = undefined;
  message.deletedAt = new Date();
  await message.save();
  return message;
}

export async function getMessages(clerkId: string, otherClerkId: string) {
  return MessageModel.find({ conversationId: conversationIdFor(clerkId, otherClerkId) })
    .sort({ createdAt: 1 })
    .lean();
}

/** Marks every message the OTHER person sent to `clerkId` in this conversation as read. */
export async function markConversationRead(clerkId: string, otherClerkId: string): Promise<void> {
  await MessageModel.updateMany(
    {
      conversationId: conversationIdFor(clerkId, otherClerkId),
      toClerkId: clerkId,
      readAt: { $exists: false },
    },
    { $set: { readAt: new Date() } },
  );
}

export async function setTyping(clerkId: string, otherClerkId: string): Promise<void> {
  await TypingStatusModel.updateOne(
    { conversationId: conversationIdFor(clerkId, otherClerkId), clerkId },
    { $set: { updatedAt: new Date() } },
    { upsert: true },
  );
}

export async function isOtherTyping(clerkId: string, otherClerkId: string): Promise<boolean> {
  const status = await TypingStatusModel.findOne({
    conversationId: conversationIdFor(clerkId, otherClerkId),
    clerkId: otherClerkId,
  }).lean();
  if (!status) return false;
  return Date.now() - status.updatedAt.getTime() < TYPING_TTL_MS;
}

export async function firstNameAndPhoto(clerkId: string) {
  // Not .lean() on the about_me doc — `answers` is a Mongoose Map, and Object.fromEntries
  // needs the real Map (lean() strips it down to a plain object with no entries() iterator).
  const [aboutMe, profile] = await Promise.all([
    AboutMeAnswerModel.findOne({ clerkId }),
    ProfileModel.findOne({ clerkId }).lean(),
  ]);
  const answers = aboutMe ? Object.fromEntries(aboutMe.answers) : {};
  const photo = profile?.photos.find((p) => p.isPrimary) ?? profile?.photos[0];
  return {
    firstName: (answers.first_name as string) ?? "",
    photoUrl: photo?.url as string | undefined,
  };
}

/** One row per conversation partner, most recently active first. */
export async function getConversations(clerkId: string) {
  const messages = await MessageModel.find({
    $or: [{ fromClerkId: clerkId }, { toClerkId: clerkId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  const latestByOther = new Map<string, (typeof messages)[number]>();
  const hasUnreadByOther = new Map<string, boolean>();
  for (const m of messages) {
    const other = m.fromClerkId === clerkId ? m.toClerkId : m.fromClerkId;
    if (!latestByOther.has(other)) latestByOther.set(other, m);
    if (m.toClerkId === clerkId && !m.readAt) hasUnreadByOther.set(other, true);
  }

  // Compatibility here ignores elimination gates (gender/age/deal breakers/etc.) — a
  // chat isn't restricted to match-list membership, so every conversation partner gets
  // a number rather than an undefined/blank state for anyone who wouldn't formally
  // survive the match filters.
  const [questions, viewerPreferenceDoc] = await Promise.all([
    getPointGivingQuestions(),
    PreferenceAnswerModel.findOne({ clerkId }),
  ]);
  const fullPoints = questions.length === 0 ? 0 : 100 / questions.length;
  const viewerPreferences = viewerPreferenceDoc ? Object.fromEntries(viewerPreferenceDoc.answers) : {};

  return Promise.all(
    [...latestByOther.entries()].map(async ([otherClerkId, lastMessage]) => {
      const [{ firstName, photoUrl }, otherAboutMeDoc] = await Promise.all([
        firstNameAndPhoto(otherClerkId),
        AboutMeAnswerModel.findOne({ clerkId: otherClerkId }),
      ]);
      const otherAboutMe = otherAboutMeDoc ? Object.fromEntries(otherAboutMeDoc.answers) : {};
      const compatibility = roundScore(
        computeScore({ questions, fullPoints, viewerPreferences, candidateAboutMe: otherAboutMe }),
      );
      return {
        clerkId: otherClerkId,
        firstName,
        photoUrl,
        lastMessage: lastMessage.deletedAt ? "Message deleted" : lastMessage.audioUrl ? "🎙️ Voice message" : lastMessage.body,
        lastMessageAt: lastMessage.createdAt.toISOString(),
        lastMessageFromMe: lastMessage.fromClerkId === clerkId,
        compatibility,
        unread: hasUnreadByOther.get(otherClerkId) ?? false,
      };
    }),
  );
}

/** Count of conversations with at least one unread incoming message — for the nav badge. */
export async function getUnreadConversationCount(clerkId: string): Promise<number> {
  const unreadOthers = await MessageModel.distinct("fromClerkId", {
    toClerkId: clerkId,
    readAt: { $exists: false },
  });
  return unreadOthers.length;
}

/**
 * Timestamp of the single most recent unread incoming message, across every
 * conversation. The client tracks this as a monotonic high-water mark and plays a
 * notification sound only when it moves forward — a plain "did the id change" check
 * would false-positive when reading one conversation exposes an older, already-unread
 * message from a different conversation as the new "latest". Lets the app-wide poller
 * detect a genuinely new message without a websocket.
 */
export async function getLatestUnreadMessageAt(clerkId: string): Promise<string | undefined> {
  const latest = await MessageModel.findOne({ toClerkId: clerkId, readAt: { $exists: false } })
    .sort({ createdAt: -1 })
    .lean();
  return latest?.createdAt.toISOString();
}
