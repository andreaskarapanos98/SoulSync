import { Router } from "express";
import { getAuth } from "@clerk/express";

export const meRouter = Router();

// We check auth manually rather than using requireAuth(), which redirects (302) on
// missing/invalid sessions — a browser-navigation behavior that's wrong for a JSON API.
meRouter.get("/", (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ userId });
});
