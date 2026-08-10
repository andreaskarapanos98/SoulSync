import { Router } from "express";
import { clerkClient, getAuth } from "@clerk/express";
import { UserAccountModel } from "../models/UserAccount.js";
import { track } from "../services/analyticsService.js";
import { isAdmin } from "../middleware/requireAdmin.js";

export const meRouter = Router();

// We check auth manually rather than using requireAuth(), which redirects (302) on
// missing/invalid sessions — a browser-navigation behavior that's wrong for a JSON API.
meRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  let account = await UserAccountModel.findOne({ clerkId: userId });

  // First time we've seen this Clerk user — create their SoulSync account record.
  // A real webhook (user.created) will replace this once we have a public URL to
  // receive it; this find-or-create keeps local dev working without one.
  if (!account) {
    const clerkUser = await clerkClient.users.getUser(userId);
    const primaryEmail = clerkUser.emailAddresses.find(
      (address) => address.id === clerkUser.primaryEmailAddressId,
    );
    account = await UserAccountModel.create({
      clerkId: userId,
      email: primaryEmail?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "",
    });
    await track(userId, "registration");
  }

  res.json({
    userId: account.clerkId,
    email: account.email,
    onboardingStatus: account.onboardingStatus,
    coinBalance: account.coinBalance,
    isAdmin: await isAdmin(userId),
  });
});
