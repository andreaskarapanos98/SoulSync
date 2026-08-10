import type { NextFunction, Request, Response } from "express";
import { getAuth } from "@clerk/express";
import { UserAccountModel } from "../models/UserAccount.js";

// /api/v1/me must stay reachable so a suspended/banned user's client can even find out
// their own status; /api/v1/admin is gated separately by role via requireAdmin, not status.
const EXEMPT_PREFIXES = ["/api/v1/me", "/api/v1/admin", "/api/health", "/uploads"];

/**
 * Blocks every other authenticated API call once an account is suspended or banned.
 * Mounted globally (after clerkMiddleware) so no individual route has to remember to
 * check this itself.
 */
export async function requireActiveAccount(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (EXEMPT_PREFIXES.some((prefix) => req.path.startsWith(prefix))) {
    next();
    return;
  }

  const { userId } = getAuth(req);
  if (!userId) {
    next(); // No session — let the route's own 401 handling apply.
    return;
  }

  const account = await UserAccountModel.findOne({ clerkId: userId }).select("status").lean();
  if (account && account.status !== "active") {
    res.status(403).json({ error: "account_restricted", status: account.status });
    return;
  }
  next();
}
