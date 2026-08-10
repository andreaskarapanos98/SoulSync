import { Router } from "express";
import { getMatches } from "../services/matchService.js";
import { getCompatibilityScore } from "../services/pairCompatibility.js";

export const adminCompatibilityRouter = Router();

// Every match this user's preferences produce, exactly as they'd see on /matches —
// lets an admin sanity-check a specific user's scoring without impersonating them.
adminCompatibilityRouter.get("/users/:clerkId/matches", async (req, res) => {
  const matches = await getMatches(req.params.clerkId);
  res.json(matches);
});

// Direct pair lookup, both directions.
adminCompatibilityRouter.get("/compatibility", async (req, res) => {
  const { a, b } = req.query as { a?: string; b?: string };
  if (!a || !b) {
    res.status(400).json({ error: "Query params 'a' and 'b' (clerkIds) are required" });
    return;
  }
  const [aToB, bToA] = await Promise.all([getCompatibilityScore(a, b), getCompatibilityScore(b, a)]);
  res.json({ aToB, bToA });
});
