import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { healthRouter } from "./routes/health.js";
import { meRouter } from "./routes/me.js";
import { questionsRouter } from "./routes/questions.js";
import { aboutMeRouter } from "./routes/aboutMe.js";

const app = express();

app.use(cors());
app.use(express.json());
// Reads CLERK_SECRET_KEY from process.env; attaches auth info to every request
// (unauthenticated requests just get an empty auth, they aren't rejected here).
app.use(clerkMiddleware());

app.use("/api/health", healthRouter);
app.use("/api/v1/me", meRouter);
app.use("/api/v1/questions", questionsRouter);
app.use("/api/v1/me/about-me", aboutMeRouter);

// Without this handler, Express would render its default HTML error page instead of JSON.
app.use(
  (err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

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
