import { Router } from "express";
import { getAuth } from "@clerk/express";
import { getMatches } from "../services/matchService.js";

export const matchesRouter = Router();

matchesRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const matches = await getMatches(userId);
  res.json(matches);
});
