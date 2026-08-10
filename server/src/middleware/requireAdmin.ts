import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { env } from "../config/env.js";
import { UserAccountModel } from "../models/UserAccount.js";

export async function isAdmin(clerkId: string): Promise<boolean> {
  if (env.adminClerkIds.includes(clerkId)) return true;
  const account = await UserAccountModel.findOne({ clerkId }).select("role").lean();
  return account?.role === "admin";
}

/** Mount on every /api/v1/admin/* route. Rejects non-admins with 403 (401 if signed out). */
export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (!(await isAdmin(userId))) {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  (req as Request & { adminClerkId: string }).adminClerkId = userId;
  next();
}
