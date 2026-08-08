import { Router } from "express";
import { getAuth } from "@clerk/express";
import { QuestionDefinitionModel } from "../models/QuestionDefinition.js";

export const questionsRouter = Router();

questionsRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const appliesTo = req.query.appliesTo === "preference" ? "preference" : "about_me";

  const questions = await QuestionDefinitionModel.find({ appliesTo, active: true })
    .sort({ category: 1, order: 1 })
    .select("key category type label options min max required order scoringMechanic canBeDealBreaker -_id");

  res.json({ questions });
});
