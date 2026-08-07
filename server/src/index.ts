import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";

const app = express();

app.use(cors());
app.use(express.json());
// Reads CLERK_SECRET_KEY from process.env; attaches auth info to every request
// (unauthenticated requests just get an empty auth, they aren't rejected here).
app.use(clerkMiddleware());

app.use("/api/health", healthRouter);
app.use("/api/v1/me", meRouter);

// Without this handler, Express would render its default HTML error page instead of JSON.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

app.listen(env.port, () => {
  console.log(`SoulSync API listening on http://localhost:${env.port}`);
});
