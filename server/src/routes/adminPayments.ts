import { Router } from "express";
import { CoinTransactionModel } from "../models/CoinTransaction.js";
import { PaymentEventModel } from "../models/PaymentEvent.js";
import { resolveEmails } from "../services/adminUserService.js";

export const adminPaymentsRouter = Router();

function pagination(req: { query: Record<string, unknown> }) {
  const page = req.query.page ? Math.max(1, Number(req.query.page)) : 1;
  const limit = req.query.limit ? Math.min(100, Number(req.query.limit)) : 25;
  return { page, limit, skip: (page - 1) * limit };
}

adminPaymentsRouter.get("/coin-transactions", async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const filter: Record<string, unknown> = {};
  if (typeof req.query.clerkId === "string") filter.clerkId = req.query.clerkId;
  if (typeof req.query.type === "string") filter.type = req.query.type;

  const [transactions, total] = await Promise.all([
    CoinTransactionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    CoinTransactionModel.countDocuments(filter),
  ]);
  const emailByClerkId = await resolveEmails(transactions.flatMap((t) => [t.clerkId, t.relatedClerkId, t.adminClerkId]));
  const enriched = transactions.map((t) => ({
    ...t,
    email: emailByClerkId.get(t.clerkId),
    relatedEmail: t.relatedClerkId ? emailByClerkId.get(t.relatedClerkId) : undefined,
  }));
  res.json({ transactions: enriched, total, page, limit });
});

adminPaymentsRouter.get("/payments", async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === "string") filter.status = req.query.status;

  const [events, total] = await Promise.all([
    PaymentEventModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PaymentEventModel.countDocuments(filter),
  ]);
  const emailByClerkId = await resolveEmails(events.map((e) => e.clerkId));
  const enriched = events.map((e) => ({ ...e, email: e.clerkId ? emailByClerkId.get(e.clerkId) : undefined }));
  res.json({ events: enriched, total, page, limit });
});
