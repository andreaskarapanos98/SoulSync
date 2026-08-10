import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { adminUsersRouter } from "./adminUsers.js";
import { adminPaymentsRouter } from "./adminPayments.js";
import { adminErrorsRouter } from "./adminErrors.js";
import { adminQuestionsRouter } from "./adminQuestions.js";
import { adminCompatibilityRouter } from "./adminCompatibility.js";
import { adminReportsRouter } from "./adminReports.js";

export const adminRouter = Router();

// Every route mounted below requires admin access — checked once here rather than in
// each individual sub-router.
adminRouter.use(requireAdmin);

adminRouter.get("/ping", (_req, res) => {
  res.json({ ok: true });
});

adminRouter.use("/users", adminUsersRouter);
adminRouter.use("/", adminPaymentsRouter);
adminRouter.use("/", adminErrorsRouter);
adminRouter.use("/questions", adminQuestionsRouter);
adminRouter.use("/", adminCompatibilityRouter);
adminRouter.use("/", adminReportsRouter);
