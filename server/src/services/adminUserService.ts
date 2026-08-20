import { UserAccountModel } from "../models/UserAccount.js";
import { CoinTransactionModel } from "../models/CoinTransaction.js";
import { UnlockModel } from "../models/Unlock.js";
import { logAdminAction } from "./adminAuditService.js";
import { createAccountNotification } from "./notificationService.js";

/** Batch clerkId -> email lookup, for admin views that otherwise only have a raw clerkId to show. */
export async function resolveEmails(clerkIds: (string | null | undefined)[]): Promise<Map<string, string>> {
  const uniqueIds = [...new Set(clerkIds.filter((id): id is string => Boolean(id)))];
  if (uniqueIds.length === 0) return new Map();
  const accounts = await UserAccountModel.find({ clerkId: { $in: uniqueIds } })
    .select("clerkId email")
    .lean();
  return new Map(accounts.map((a) => [a.clerkId, a.email]));
}

export async function listUsers(opts: { search?: string; page?: number; limit?: number }) {
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 25;

  const filter: Record<string, unknown> = {};
  if (opts.search) {
    filter.$or = [{ email: { $regex: opts.search, $options: "i" } }, { clerkId: { $regex: opts.search, $options: "i" } }];
  }

  const [users, total] = await Promise.all([
    UserAccountModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    UserAccountModel.countDocuments(filter),
  ]);

  return { users, total, page, limit };
}

export async function getUserDetail(clerkId: string) {
  const [account, coinTransactions, unlockedByThem, unlockedThem] = await Promise.all([
    UserAccountModel.findOne({ clerkId }).lean(),
    CoinTransactionModel.find({ clerkId }).sort({ createdAt: -1 }).limit(50).lean(),
    UnlockModel.find({ viewerClerkId: clerkId }).lean(),
    UnlockModel.find({ unlockedClerkId: clerkId }).lean(),
  ]);

  const relatedEmailByClerkId = await resolveEmails(coinTransactions.map((t) => t.relatedClerkId));
  const enrichedTransactions = coinTransactions.map((t) => ({
    ...t,
    relatedEmail: t.relatedClerkId ? relatedEmailByClerkId.get(t.relatedClerkId) : undefined,
  }));

  return {
    account,
    coinTransactions: enrichedTransactions,
    unlockedCount: unlockedByThem.length,
    unlockedByCount: unlockedThem.length,
  };
}

const STATUS_NOTIFICATION_COPY: Partial<Record<string, { title: string; message: string }>> = {
  suspended: {
    title: "⚠️ Your account has been suspended",
    message: "Your account was suspended by an administrator. Contact support if you think this is a mistake.",
  },
  banned: {
    title: "🚫 Your account has been banned",
    message: "Your account was banned for violating our community guidelines.",
  },
  active: {
    title: "✅ Your account has been restored",
    message: "Your account is active again — welcome back.",
  },
};

export async function setUserStatus(
  adminClerkId: string,
  targetClerkId: string,
  status: "active" | "suspended" | "banned",
  reason?: string,
) {
  const account = await UserAccountModel.findOne({ clerkId: targetClerkId });
  if (!account) throw new Error("User not found");

  const previousStatus = account.status;
  account.status = status;
  await account.save();

  await logAdminAction(adminClerkId, `user.status.${status}`, targetClerkId, { from: previousStatus, to: status, reason });

  const copy = STATUS_NOTIFICATION_COPY[status];
  if (copy) await createAccountNotification(targetClerkId, copy.title, copy.message);

  return account;
}

export type ChatBanInput = { days: number } | { permanent: true } | { lift: true };

/**
 * Chat-only restriction — lighter than setUserStatus("banned"), which locks out the whole
 * account. Everything else (browsing, unlocking, profile edits) still works; only sending
 * new messages/gifts is blocked, enforced in messageService.requireCanMessage().
 */
export async function setChatBan(adminClerkId: string, targetClerkId: string, ban: ChatBanInput, reason?: string) {
  const account = await UserAccountModel.findOne({ clerkId: targetClerkId });
  if (!account) throw new Error("User not found");

  let actionKey: string;
  let copy: { title: string; message: string } | undefined;

  if ("lift" in ban) {
    account.chatBanExpiresAt = undefined;
    account.chatBannedIndefinitely = false;
    actionKey = "user.chatban.lift";
    copy = { title: "✅ Your chat restriction has been lifted", message: "You can send messages again." };
  } else if ("permanent" in ban) {
    account.chatBanExpiresAt = undefined;
    account.chatBannedIndefinitely = true;
    actionKey = "user.chatban.permanent";
    copy = {
      title: "🚫 You've been restricted from chatting",
      message: "You've been permanently restricted from sending messages, for violating our Community Guidelines.",
    };
  } else {
    const until = new Date(Date.now() + ban.days * 24 * 60 * 60 * 1000);
    account.chatBanExpiresAt = until;
    account.chatBannedIndefinitely = false;
    actionKey = "user.chatban.temporary";
    copy = {
      title: "🚫 You've been restricted from chatting",
      message: `You've been restricted from sending messages for ${ban.days} day${ban.days === 1 ? "" : "s"}, for violating our Community Guidelines.`,
    };
  }

  await account.save();
  await logAdminAction(adminClerkId, actionKey, targetClerkId, { ban, reason });
  await createAccountNotification(targetClerkId, copy.title, copy.message);

  return account;
}

/** Support-case override — force a verified badge on/off outside the normal Stripe Identity flow. */
export async function setVerificationStatus(
  adminClerkId: string,
  targetClerkId: string,
  status: "verified" | "unverified",
  reason?: string,
) {
  const account = await UserAccountModel.findOne({ clerkId: targetClerkId });
  if (!account) throw new Error("User not found");

  const previousStatus = account.verificationStatus;
  account.verificationStatus = status;
  // Leave verifiedAt as the last time they *were* verified rather than clearing it on
  // revoke — useful admin context, and avoids Mongoose undefined-assignment edge cases.
  if (status === "verified") account.verifiedAt = new Date();
  await account.save();

  await logAdminAction(adminClerkId, `user.verification.${status}`, targetClerkId, { from: previousStatus, to: status, reason });

  return account;
}
