import { ReportModel, type reportContentTypes, type reportReasons } from "../models/Report.js";
import { MessageModel } from "../models/Message.js";
import { logAdminAction } from "./adminAuditService.js";
import { track } from "./analyticsService.js";
import { resolveEmails, setChatBan, setUserStatus } from "./adminUserService.js";
import { createAccountNotification } from "./notificationService.js";

type ReportContentType = (typeof reportContentTypes)[number];
type ReportReason = (typeof reportReasons)[number];

const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;

export class ReportRateLimitError extends Error {
  constructor() {
    super("You've submitted too many reports recently — please try again later");
  }
}

export async function createReport(
  reporterClerkId: string,
  input: { reportedClerkId: string; contentType: ReportContentType; contentRef?: string; reason: ReportReason; details?: string },
) {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await ReportModel.countDocuments({ reporterClerkId, createdAt: { $gte: since } });
  if (recentCount >= RATE_LIMIT_MAX) throw new ReportRateLimitError();

  const report = await ReportModel.create({ reporterClerkId, ...input });
  await track(reporterClerkId, "match_reported", { reportedClerkId: input.reportedClerkId, contentType: input.contentType, reason: input.reason });
  return report;
}

interface ReportedMessageFields {
  deletedAt?: Date | null;
  giftId?: string | null;
  giftEmoji?: string | null;
  giftLabel?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  videoUrl?: string | null;
  body?: string | null;
}

/** Short human-readable summary of the reported content, so an admin doesn't have to go dig up the message by id. */
function summarizeMessage(message: ReportedMessageFields | undefined): string {
  if (!message) return "(message no longer exists)";
  if (message.deletedAt) return "Message deleted";
  if (message.giftId) return `${message.giftEmoji ?? "🎁"} Gift: ${message.giftLabel ?? message.giftId}`;
  if (message.audioUrl) return "🎙️ Voice message";
  if (message.imageUrl) return "📷 Photo";
  if (message.videoUrl) return "🎬 Video";
  const body = message.body ?? "";
  return body.length > 240 ? `${body.slice(0, 240)}…` : body;
}

export async function listReports(opts: { status?: string; page?: number; limit?: number }) {
  const page = opts.page && opts.page > 0 ? opts.page : 1;
  const limit = opts.limit && opts.limit > 0 ? Math.min(opts.limit, 100) : 25;
  const filter: Record<string, unknown> = {};
  if (opts.status) filter.status = opts.status;

  const [reports, total] = await Promise.all([
    ReportModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ReportModel.countDocuments(filter),
  ]);

  const messageRefs = reports.filter((r) => r.contentType === "message" && r.contentRef).map((r) => r.contentRef as string);

  const [emailByClerkId, messages] = await Promise.all([
    resolveEmails(reports.flatMap((r) => [r.reporterClerkId, r.reportedClerkId, r.reviewedByClerkId])),
    messageRefs.length ? MessageModel.find({ _id: { $in: messageRefs } }).lean() : Promise.resolve([]),
  ]);
  const messageById = new Map(messages.map((m) => [String(m._id), m]));

  const enrichedReports = reports.map((r) => ({
    ...r,
    reporterEmail: emailByClerkId.get(r.reporterClerkId),
    reportedEmail: emailByClerkId.get(r.reportedClerkId),
    reviewedByEmail: r.reviewedByClerkId ? emailByClerkId.get(r.reviewedByClerkId) : undefined,
    reportedContent:
      r.contentType === "message" && r.contentRef ? summarizeMessage(messageById.get(r.contentRef)) : undefined,
  }));

  return { reports: enrichedReports, total, page, limit };
}

export interface TakeReportActionInput {
  outcome: "dismiss" | "chat_ban" | "account_ban";
  days?: number;
  permanent?: boolean;
  note?: string;
}

const DEFAULT_CHAT_BAN_DAYS = 7;
const REPORTER_NOTIFICATION_TITLE = "🔎 Your report has been reviewed";

/**
 * The single entry point for acting on an open report: applies the chosen account action
 * (if any), resolves the report with the admin's note, and tells the *reporter* the
 * outcome. The reported user, if any action was taken against them, is notified
 * separately by setChatBan()/setUserStatus() themselves.
 */
export async function takeReportAction(adminClerkId: string, reportId: string, input: TakeReportActionInput) {
  const report = await ReportModel.findById(reportId);
  if (!report) throw new Error("Report not found");

  let reporterMessage: string;
  const reason = `Report ${reportId}`;

  if (input.outcome === "chat_ban") {
    if (input.permanent) {
      await setChatBan(adminClerkId, report.reportedClerkId, { permanent: true }, reason);
      reporterMessage = "We reviewed your report and permanently restricted the user from chatting.";
    } else {
      const days = input.days && input.days > 0 ? input.days : DEFAULT_CHAT_BAN_DAYS;
      await setChatBan(adminClerkId, report.reportedClerkId, { days }, reason);
      reporterMessage = `We reviewed your report and restricted the user from chatting for ${days} day${days === 1 ? "" : "s"}.`;
    }
  } else if (input.outcome === "account_ban") {
    await setUserStatus(adminClerkId, report.reportedClerkId, "banned", reason);
    reporterMessage = "We reviewed your report and banned the user from SoulSync.";
  } else {
    reporterMessage = "We looked into your report and didn't find a violation that requires action.";
  }

  report.status = input.outcome === "dismiss" ? "dismissed" : "reviewed";
  report.adminNote = input.note;
  report.reviewedByClerkId = adminClerkId;
  report.reviewedAt = new Date();
  await report.save();

  await logAdminAction(adminClerkId, `report.${report.status}`, report.reportedClerkId, { reportId, outcome: input.outcome });
  await createAccountNotification(report.reporterClerkId, REPORTER_NOTIFICATION_TITLE, reporterMessage);

  return report;
}

/** Fixes/extends the admin note after the fact — no re-notification, no re-applying an account action. */
export async function updateReportNote(adminClerkId: string, reportId: string, note: string) {
  const report = await ReportModel.findByIdAndUpdate(reportId, { adminNote: note }, { returnDocument: "after" });
  if (!report) throw new Error("Report not found");
  await logAdminAction(adminClerkId, "report.note.edit", report.reportedClerkId, { reportId });
  return report;
}
