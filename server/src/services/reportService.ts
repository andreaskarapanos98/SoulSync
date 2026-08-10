import { ReportModel, type reportContentTypes, type reportReasons } from "../models/Report.js";
import { logAdminAction } from "./adminAuditService.js";

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

  return ReportModel.create({ reporterClerkId, ...input });
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
  return { reports, total, page, limit };
}

export async function resolveReport(adminClerkId: string, reportId: string, status: "reviewed" | "dismissed") {
  const report = await ReportModel.findByIdAndUpdate(
    reportId,
    { status, reviewedByClerkId: adminClerkId, reviewedAt: new Date() },
    { returnDocument: "after" },
  );
  if (!report) throw new Error("Report not found");
  await logAdminAction(adminClerkId, `report.${status}`, report.reportedClerkId, { reportId });
  return report;
}
