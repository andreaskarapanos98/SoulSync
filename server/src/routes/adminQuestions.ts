import { Router } from "express";
import { getAuth } from "@clerk/express";
import { QuestionDefinitionModel } from "../models/QuestionDefinition.js";
import { logAdminAction } from "../services/adminAuditService.js";

export const adminQuestionsRouter = Router();

adminQuestionsRouter.get("/", async (req, res) => {
  const appliesTo = req.query.appliesTo === "preference" ? "preference" : req.query.appliesTo === "about_me" ? "about_me" : undefined;
  const filter: Record<string, unknown> = {};
  if (appliesTo) filter.appliesTo = appliesTo;

  const questions = await QuestionDefinitionModel.find(filter).sort({ appliesTo: 1, category: 1, order: 1 }).lean();
  res.json({ questions });
});

adminQuestionsRouter.post("/", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  try {
    const question = await QuestionDefinitionModel.create(req.body);
    await logAdminAction(adminClerkId!, "question.create", undefined, { key: question.key, appliesTo: question.appliesTo });
    res.status(201).json({ question });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to create question" });
  }
});

adminQuestionsRouter.patch("/:id", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  try {
    const question = await QuestionDefinitionModel.findByIdAndUpdate(req.params.id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });
    if (!question) {
      res.status(404).json({ error: "Question not found" });
      return;
    }
    await logAdminAction(adminClerkId!, "question.update", undefined, { id: req.params.id, changes: req.body });
    res.json({ question });
  } catch (err) {
    res.status(400).json({ error: err instanceof Error ? err.message : "Failed to update question" });
  }
});
