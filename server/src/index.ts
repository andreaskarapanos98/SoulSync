import path from "node:path";
import express from "express";
import cors from "cors";
import multer from "multer";
import { clerkMiddleware, getAuth } from "@clerk/express";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { questionsRouter } from "./routes/questions.js";
import { aboutMeRouter } from "./routes/aboutMe.js";
import { preferencesRouter } from "./routes/preferences.js";
import { dealBreakersRouter } from "./routes/dealBreakers.js";
import { profileRouter } from "./routes/profile.js";
import { profilePhotosRouter } from "./routes/profilePhotos.js";
import { voiceIntroRouter } from "./routes/voiceIntro.js";
import { publicProfilesRouter } from "./routes/publicProfiles.js";
import { matchesRouter } from "./routes/matches.js";
import { conversationsRouter } from "./routes/conversations.js";
import { unlocksRouter } from "./routes/unlocks.js";
import { verificationRouter } from "./routes/verification.js";
import { notificationsRouter } from "./routes/notifications.js";
import { coinsRouter } from "./routes/coins.js";
import { stripeWebhookRouter } from "./routes/stripeWebhook.js";
import { adminRouter } from "./routes/admin.js";
import { reportsRouter } from "./routes/reports.js";
import { blocksRouter } from "./routes/blocks.js";
import { analyticsRouter } from "./routes/analytics.js";
import { requireActiveAccount } from "./middleware/requireActiveAccount.js";
import { logSystemError } from "./services/errorLogService.js";

const app = express();

app.use(cors());
// Stripe signature verification needs the exact raw body, so this is mounted with
// express.raw() BEFORE the global express.json() below parses/consumes the body.
app.use("/api/v1/coins/webhook", express.raw({ type: "application/json" }), stripeWebhookRouter);
app.use(express.json());
// Reads CLERK_SECRET_KEY from process.env; attaches auth info to every request
// (unauthenticated requests just get an empty auth, they aren't rejected here).
app.use(clerkMiddleware());
app.use(requireActiveAccount);

// Local-disk upload storage for now (see storageService.ts) — served directly.
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.use("/api/health", healthRouter);
app.use("/api/v1/me", meRouter);
app.use("/api/v1/questions", questionsRouter);
app.use("/api/v1/me/about-me", aboutMeRouter);
app.use("/api/v1/me/preferences", preferencesRouter);
app.use("/api/v1/me/deal-breakers", dealBreakersRouter);
app.use("/api/v1/me/profile/photos", profilePhotosRouter);
app.use("/api/v1/me/profile/voice-intro", voiceIntroRouter);
app.use("/api/v1/me/profile", profileRouter);
app.use("/api/v1/profiles", publicProfilesRouter);
app.use("/api/v1/matches", matchesRouter);
app.use("/api/v1/conversations", conversationsRouter);
app.use("/api/v1/unlocks", unlocksRouter);
app.use("/api/v1/verification", verificationRouter);
app.use("/api/v1/notifications", notificationsRouter);
app.use("/api/v1/coins", coinsRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/reports", reportsRouter);
app.use("/api/v1/blocks", blocksRouter);
app.use("/api/v1/analytics", analyticsRouter);

// Without this handler, Express would render its default HTML error page instead of JSON.
app.use(
  (err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof multer.MulterError || (err instanceof Error && err.message.includes("Unsupported"))) {
      res.status(400).json({ error: err.message });
      return;
    }
    console.error(err);
    const { userId } = getAuth(req);
    void logSystemError(err, { source: "express_error_handler", path: req.path, method: req.method, clerkId: userId ?? undefined });
    res.status(500).json({ error: "Internal server error" });
  },
);

// Express 4 does NOT forward a rejected promise from an async route handler to the error
// middleware above — an uncaught one becomes a process-level unhandledRejection instead.
// This is a safety net (log it, keep serving) rather than a fix for every route; it also
// feeds the admin "system errors" view.
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection:", reason);
  void logSystemError(reason, { source: "unhandled_rejection" });
});

connectDB()
  .then(() => {
    app.listen(env.port, () => {
      console.log(`SoulSync API listening on http://localhost:${env.port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });
