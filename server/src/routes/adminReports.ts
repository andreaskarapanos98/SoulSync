import { Router } from "express";
import { getAuth } from "@clerk/express";
import { listReports, takeReportAction, updateReportNote, type TakeReportActionInput } from "../services/reportService.js";

export const adminReportsRouter = Router();

adminReportsRouter.get("/reports", async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await listReports({
    status: typeof status === "string" ? status : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  res.json(result);
});

adminReportsRouter.post("/reports/:id/action", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { outcome, days, permanent, note } = req.body as Partial<TakeReportActionInput>;
  if (outcome !== "dismiss" && outcome !== "chat_ban" && outcome !== "account_ban") {
    res.status(400).json({ error: "outcome must be 'dismiss', 'chat_ban', or 'account_ban'" });
    return;
  }
  try {
    const report = await takeReportAction(adminClerkId!, req.params.id, { outcome, days, permanent, note });
    res.json({ report });
  } catch (err) {
    if (err instanceof Error && err.message === "Report not found") {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    throw err;
  }
});

adminReportsRouter.patch("/reports/:id", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { note } = req.body as { note?: string };
  if (typeof note !== "string") {
    res.status(400).json({ error: "Request body must include a 'note' string" });
    return;
  }
  try {
    const report = await updateReportNote(adminClerkId!, req.params.id, note);
    res.json({ report });
  } catch (err) {
    if (err instanceof Error && err.message === "Report not found") {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    throw err;
  }
});
