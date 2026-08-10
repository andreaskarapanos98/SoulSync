import { Router } from "express";
import { SystemErrorLogModel } from "../models/SystemErrorLog.js";
import { AdminAuditLogModel } from "../models/AdminAuditLog.js";

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
  res.json({ errors, total, page, limit });
});

adminErrorsRouter.get("/audit-log", async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const [entries, total] = await Promise.all([
    AdminAuditLogModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    AdminAuditLogModel.countDocuments(),
  ]);
  res.json({ entries, total, page, limit });
});
