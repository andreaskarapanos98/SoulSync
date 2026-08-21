import { MessageModel } from "../models/Message.js";
import { UserAccountModel } from "../models/UserAccount.js";
import { TypingStatusModel } from "../models/TypingStatus.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { ProfileModel } from "../models/Profile.js";
import { ValidationError } from "./questionnaireService.js";
import { getPointGivingQuestions, roundScore } from "./scoringEngine.js";
import { computeScore } from "./compatibilityScoring.js";
import { deleteFile } from "./storageService.js";
import { isUnlockedEitherDirection } from "./unlockService.js";
import { isBlockedEitherDirection } from "./blockService.js";
import { firstNameAndPhoto, nameAndPhotoFrom } from "./userDisplayService.js";
import { track } from "./analyticsService.js";
import { getGift, spendCoinsForGift } from "./coinService.js";

export { firstNameAndPhoto };

export class NotUnlockedError extends Error {
  constructor() {
    super("You need to unlock this profile before you can message them");
  }
}

export class BlockedError extends Error {
  constructor() {
    super("You can't message this user");
  }
}

export class MessageRateLimitError extends Error {
  constructor() {
    super("You're sending messages too quickly — please slow down");
  }
}

export class ChatBannedError extends Error {
  constructor(public until?: Date) {
    super(
      until
        ? `You're restricted from chatting until ${until.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}`
        : "You're permanently restricted from chatting",
    );
  }
}

// A typing status is considered live for this long after the last ping — the client
// re-pings every ~2s while the user keeps typing.
const TYPING_TTL_MS = 4000;

// Generous enough for real chat bursts, tight enough to block scripted spam.
const MESSAGE_RATE_LIMIT_WINDOW_MS = 60_000;
const MESSAGE_RATE_LIMIT_MAX = 20;

export function conversationIdFor(a: string, b: string): string {
  return [a, b].sort().join("::");
}

/**
 * Either side must have unlocked the other (lets the unlocked party reply for free),
 * neither side may have blocked the other, and the sender must be under the send-rate
 * limit — checked on every send, not just the first message of a conversation.
 */
export async function requireCanMessage(fromClerkId: string, toClerkId: string): Promise<void> {
  const account = await UserAccountModel.findOne({ clerkId: fromClerkId })
    .select("chatBanExpiresAt chatBannedIndefinitely")
    .lean();
  if (account?.chatBannedIndefinitely) throw new ChatBannedError();
  if (account?.chatBanExpiresAt && account.chatBanExpiresAt > new Date()) throw new ChatBannedError(account.chatBanExpiresAt);

  if (!(await isUnlockedEitherDirection(fromClerkId, toClerkId))) throw new NotUnlockedError();
  if (await isBlockedEitherDirection(fromClerkId, toClerkId)) throw new BlockedError();

  const since = new Date(Date.now() - MESSAGE_RATE_LIMIT_WINDOW_MS);
  const recentCount = await MessageModel.countDocuments({ fromClerkId, createdAt: { $gte: since } });
  if (recentCount >= MESSAGE_RATE_LIMIT_MAX) throw new MessageRateLimitError();
}

export async function sendMessage(fromClerkId: string, toClerkId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new ValidationError(["Message cannot be empty"]);
  if (trimmed.length > 2000) throw new ValidationError(["Message is too long (max 2000 characters)"]);
  await requireCanMessage(fromClerkId, toClerkId);

  const message = await MessageModel.create({
    conversationId: conversationIdFor(fromClerkId, toClerkId),
    fromClerkId,
    toClerkId,
    body: trimmed,
  });
  await track(fromClerkId, "message_sent", { toClerkId, kind: "text" });
  return message;
}

export async function sendVoiceMessage(fromClerkId: string, toClerkId: string, audioUrl: string, durationSec: number) {
  await requireCanMessage(fromClerkId, toClerkId);

  const message = await MessageModel.create({
    conversationId: conversationIdFor(fromClerkId, toClerkId),
    fromClerkId,
    toClerkId,
    audioUrl,
    durationSec,
  });
  await track(fromClerkId, "message_sent", { toClerkId, kind: "voice" });
  return message;
}

export async function sendMediaMessage(
  fromClerkId: string,
  toClerkId: string,
  kind: "image" | "video",
  url: string,
) {
  await requireCanMessage(fromClerkId, toClerkId);

  const message = await MessageModel.create({
    conversationId: conversationIdFor(fromClerkId, toClerkId),
    fromClerkId,
    toClerkId,
    ...(kind === "image" ? { imageUrl: url } : { videoUrl: url }),
  });
  await track(fromClerkId, "message_sent", { toClerkId, kind });
  return message;
}

export async function sendGiftMessage(fromClerkId: string, toClerkId: string, giftId: string) {
  await requireCanMessage(fromClerkId, toClerkId);
  const gift = getGift(giftId);
  const { coinBalance } = await spendCoinsForGift(fromClerkId, gift.id, toClerkId);

  const message = await MessageModel.create({
    conversationId: conversationIdFor(fromClerkId, toClerkId),
    fromClerkId,
    toClerkId,
    giftId: gift.id,
    giftEmoji: gift.emoji,
    giftLabel: gift.label,
  });
  await track(fromClerkId, "message_sent", { toClerkId, kind: "gift", giftId: gift.id });
  return { message, coinBalance };
}

export class NotGiftRecipientError extends Error {
  constructor() {
    super("You can only open a gift that was sent to you");
  }
}

/** Idempotent — a repeated open (double-tap, retry) is a no-op, not an error. */
export async function openGift(clerkId: string, messageId: string) {
  const message = await MessageModel.findById(messageId);
  if (!message) throw new ValidationError(["Message not found"]);
  if (message.toClerkId !== clerkId) throw new NotGiftRecipientError();
  if (!message.giftOpenedAt) {
    message.giftOpenedAt = new Date();
    await message.save();
  }
  return message;
}

/** Only the sender can edit, only while it isn't deleted, and only plain text messages. */
export async function editMessage(clerkId: string, messageId: string, newBody: string) {
  const trimmed = newBody.trim();
  if (!trimmed) throw new ValidationError(["Message cannot be empty"]);
  if (trimmed.length > 2000) throw new ValidationError(["Message is too long (max 2000 characters)"]);

  const message = await MessageModel.findById(messageId);
  if (!message) throw new ValidationError(["Message not found"]);
  if (message.fromClerkId !== clerkId) throw new ValidationError(["You can only edit your own messages"]);
  if (message.deletedAt) throw new ValidationError(["Can't edit a deleted message"]);
  if (message.audioUrl || message.imageUrl || message.videoUrl || message.giftId) {
    throw new ValidationError(["Can't edit a voice, photo, video, or gift message"]);
  }

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

  const fileUrl = message.audioUrl ?? message.imageUrl ?? message.videoUrl;
  if (fileUrl) await deleteFile(fileUrl);
  message.body = "";
  message.audioUrl = undefined;
  message.imageUrl = undefined;
  message.videoUrl = undefined;
  message.durationSec = undefined;
  message.giftId = undefined;
  message.giftEmoji = undefined;
  message.giftLabel = undefined;
  message.giftOpenedAt = undefined;
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
      const [otherAboutMeDoc, otherProfile] = await Promise.all([
        AboutMeAnswerModel.findOne({ clerkId: otherClerkId }),
        ProfileModel.findOne({ clerkId: otherClerkId }).lean(),
      ]);
      const otherAboutMe = otherAboutMeDoc ? Object.fromEntries(otherAboutMeDoc.answers) : {};
      const { firstName, photoUrl } = nameAndPhotoFrom(otherAboutMe, otherProfile);
      const compatibility = roundScore(
        computeScore({ questions, fullPoints, viewerPreferences, candidateAboutMe: otherAboutMe }),
      );
      return {
        clerkId: otherClerkId,
        firstName,
        photoUrl,
        lastMessage: lastMessage.deletedAt
          ? "Message deleted"
          : lastMessage.audioUrl
            ? "🎙️ Voice message"
            : lastMessage.imageUrl
              ? "📷 Photo"
              : lastMessage.videoUrl
                ? "🎬 Video"
                : lastMessage.giftId
                  ? `${lastMessage.giftEmoji} Gift`
                  : lastMessage.body,
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
