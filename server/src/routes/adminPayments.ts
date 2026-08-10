import { Router } from "express";
import { CoinTransactionModel } from "../models/CoinTransaction.js";
import { PaymentEventModel } from "../models/PaymentEvent.js";

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
  res.json({ transactions, total, page, limit });
});

adminPaymentsRouter.get("/payments", async (req, res) => {
  const { page, limit, skip } = pagination(req);
  const filter: Record<string, unknown> = {};
  if (typeof req.query.status === "string") filter.status = req.query.status;

  const [events, total] = await Promise.all([
    PaymentEventModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    PaymentEventModel.countDocuments(filter),
  ]);
  res.json({ events, total, page, limit });
});
