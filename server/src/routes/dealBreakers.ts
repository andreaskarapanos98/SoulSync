import { Router } from "express";
import { getAuth } from "@clerk/express";
import { DealBreakerModel } from "../models/DealBreaker.js";
import { ValidationError } from "../services/questionnaireService.js";
import { saveDealBreakers } from "../services/dealBreakerService.js";

export const dealBreakersRouter = Router();

dealBreakersRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const doc = await DealBreakerModel.findOne({ clerkId: userId });
  res.json({ dealBreakers: doc ? Object.fromEntries(doc.dealBreakers) : {} });
});

dealBreakersRouter.put("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { dealBreakers } = req.body as { dealBreakers?: Record<string, string[]> };
  if (!dealBreakers || typeof dealBreakers !== "object") {
    res.status(400).json({ error: "Request body must include a 'dealBreakers' object" });
    return;
  }

  try {
    await saveDealBreakers(userId, dealBreakers);
  } catch (err) {
    if (err instanceof ValidationError) {
      res.status(400).json({ error: "Validation failed", issues: err.issues });
      return;
    }
    throw err;
  }

  res.json({ saved: true });
});
