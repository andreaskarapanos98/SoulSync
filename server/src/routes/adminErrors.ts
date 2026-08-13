import { Router } from "express";
import { SystemErrorLogModel } from "../models/SystemErrorLog.js";
import { AdminAuditLogModel } from "../models/AdminAuditLog.js";
import { resolveEmails } from "../services/adminUserService.js";

export const adminErrorsRouter = Router();

function pagination(req: { query: Record<string, unknown> }) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Number(req.query.limit)) : 50;
  return { page, limit, skip: (page - 1) * limit };
}

adminErrorsRouter.get("/errors", async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const [errors, total] = await Promise.all([
    SystemErrorLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    SystemErrorLogModel.countDocuments(),
  ]);
  const emailByClerkId = await resolveEmails(errors.map((e) => e.clerkId));
  const enriched = errors.map((e) => ({ ...e, email: e.clerkId ? emailByClerkId.get(e.clerkId) : undefined }));
  res.json({ errors: enriched, total, page, limit });
});

adminErrorsRouter.get("/audit-log", async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const [entries, total] = await Promise.all([
    AdminAuditLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminAuditLogModel.countDocuments(),
  ]);
  const emailByClerkId = await resolveEmails(entries.flatMap((e) => [e.adminClerkId, e.targetClerkId]));
  const enriched = entries.map((e) => ({
    ...e,
    adminEmail: emailByClerkId.get(e.adminClerkId),
    targetEmail: e.targetClerkId ? emailByClerkId.get(e.targetClerkId) : undefined,
  }));
  res.json({ entries: enriched, total, page, limit });
});
