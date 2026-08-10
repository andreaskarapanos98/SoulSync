import { clerkClient } from "@clerk/express";
import { UserAccountModel } from "../models/UserAccount.js";
import { AboutMeAnswerModel } from "../models/AboutMeAnswer.js";
import { PreferenceAnswerModel } from "../models/PreferenceAnswer.js";
import { DealBreakerModel } from "../models/DealBreaker.js";
import { ProfileModel } from "../models/Profile.js";
import { CoinTransactionModel } from "../models/CoinTransaction.js";
import { NotificationModel } from "../models/Notification.js";
import { MessageModel } from "../models/Message.js";
import { UnlockModel } from "../models/Unlock.js";
import { deleteFile } from "./storageService.js";

/** GDPR-style "right to access" — everything this account has ever stored, as one bundle. */
export async function exportUserData(clerkId: string) {
  const [account, aboutMe, preferences, dealBreakers, profile, coinTransactions, notifications, sentMessages, receivedMessages] =
    await Promise.all([
      UserAccountModel.findOne({ clerkId }).lean(),
      AboutMeAnswerModel.findOne({ clerkId }).lean(),
      PreferenceAnswerModel.findOne({ clerkId }).lean(),
      DealBreakerModel.findOne({ clerkId }).lean(),
      ProfileModel.findOne({ clerkId }).lean(),
      CoinTransactionModel.find({ clerkId }).lean(),
      NotificationModel.find({ clerkId }).lean(),
      MessageModel.find({ fromClerkId: clerkId }).lean(),
      MessageModel.find({ toClerkId: clerkId }).lean(),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    account,
    // .lean() already gives plain objects here, not Mongoose Maps.
    aboutMeAnswers: aboutMe?.answers ?? {},
    preferenceAnswers: preferences?.answers ?? {},
    dealBreakers: dealBreakers?.dealBreakers ?? {},
    profile,
    coinTransactions,
    notifications,
    messagesSent: sentMessages,
    messagesReceived: receivedMessages,
  };
}

/**
 * "Right to erasure": anonymizes personal data (identity, answers, photos, voice) and
 * deletes the Clerk identity itself so the account can never be signed into again.
 * Financial records (CoinTransaction) and message history with other users are kept —
 * common practice for accounting/legal retention and so the other party's conversation
 * isn't corrupted — but they only ever reference an opaque clerkId, no longer any live PII.
 */
export async function deleteUserAccount(clerkId: string): Promise<void> {
  const profile = await ProfileModel.findOne({ clerkId });
  if (profile) {
    await Promise.all([
      ...profile.photos.map((p) => deleteFile(p.url)),
      profile.voiceIntro ? deleteFile(profile.voiceIntro.url) : Promise.resolve(),
    ]);
  }

  await Promise.all([
    AboutMeAnswerModel.deleteOne({ clerkId }),
    PreferenceAnswerModel.deleteOne({ clerkId }),
    DealBreakerModel.deleteOne({ clerkId }),
    ProfileModel.deleteOne({ clerkId }),
    NotificationModel.deleteMany({ clerkId }),
    UnlockModel.deleteMany({ $or: [{ viewerClerkId: clerkId }, { unlockedClerkId: clerkId }] }),
    UserAccountModel.updateOne(
      { clerkId },
      { $set: { email: `deleted-${clerkId}@deleted.soulsync.local`, status: "deleted" } },
    ),
  ]);

  await clerkClient.users.deleteUser(clerkId).catch((err) => {
    console.error("Failed to delete Clerk user during account deletion:", err);
  });
}
