import { Router } from "express";
import { getAuth } from "@clerk/express";
import { getUserDetail, listUsers, setChatBan, setUserStatus, setVerificationStatus, type ChatBanInput } from "../services/adminUserService.js";
import { adjustCoinsByAdmin } from "../services/coinService.js";

export const adminUsersRouter = Router();

adminUsersRouter.get("/", async (req, res) => {
  const { search, page, limit } = req.query;
  const result = await listUsers({
    search: typeof search === "string" ? search : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

adminUsersRouter.get("/:clerkId", async (req, res) => {
  const detail = await getUserDetail(req.params.clerkId);
  if (!detail.account) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(detail);
});

adminUsersRouter.post("/:clerkId/suspend", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { reason } = req.body as { reason?: string };
  const account = await setUserStatus(adminClerkId!, req.params.clerkId, "suspended", reason);
  res.json({ account });
});

adminUsersRouter.post("/:clerkId/ban", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { reason } = req.body as { reason?: string };
  const account = await setUserStatus(adminClerkId!, req.params.clerkId, "banned", reason);
  res.json({ account });
});

adminUsersRouter.post("/:clerkId/restore", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const account = await setUserStatus(adminClerkId!, req.params.clerkId, "active");
  res.json({ account });
});

adminUsersRouter.post("/:clerkId/chat-ban", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { days, permanent, lift, reason } = req.body as { days?: number; permanent?: boolean; lift?: boolean; reason?: string };
  const ban: ChatBanInput = lift ? { lift: true } : permanent ? { permanent: true } : { days: Number(days) || 0 };
  if (!("lift" in ban) && !("permanent" in ban) && (!("days" in ban) || ban.days <= 0)) {
    res.status(400).json({ error: "Provide a positive 'days' number, or 'permanent'/'lift'" });
    return;
  }
  try {
    const account = await setChatBan(adminClerkId!, req.params.clerkId, ban, reason);
    res.json({ account });
  } catch (err) {
    if (err instanceof Error && err.message === "User not found") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    throw err;
  }
});

adminUsersRouter.post("/:clerkId/verification", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { status, reason } = req.body as { status?: "verified" | "unverified"; reason?: string };
  if (status !== "verified" && status !== "unverified") {
    res.status(400).json({ error: "status must be 'verified' or 'unverified'" });
    return;
  }
  try {
    const account = await setVerificationStatus(adminClerkId!, req.params.clerkId, status, reason);
    res.json({ account });
  } catch (err) {
    if (err instanceof Error && err.message === "User not found") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    throw err;
  }
});

adminUsersRouter.post("/:clerkId/coins/adjust", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { amount, reason } = req.body as { amount?: number; reason?: string };
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount === 0) {
    res.status(400).json({ error: "amount must be a non-zero number" });
    return;
  }
  if (!reason || !reason.trim()) {
    res.status(400).json({ error: "reason is required" });
    return;
  }
  try {
    const result = await adjustCoinsByAdmin(adminClerkId!, req.params.clerkId, amount, reason.trim());
    res.json(result);
  } catch (err) {
    if (err instanceof Error && err.message === "User not found") {
      res.status(404).json({ error: "User not found" });
      return;
    }
    throw err;
  }
});
