import { Router } from "express";
import { getAuth } from "@clerk/express";
import { listReports, resolveReport } from "../services/reportService.js";

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

adminReportsRouter.post("/reports/:id/resolve", async (req, res) => {
  const { userId: adminClerkId } = getAuth(req);
  const { status } = req.body as { status?: "reviewed" | "dismissed" };
  if (status !== "reviewed" && status !== "dismissed") {
    res.status(400).json({ error: "status must be 'reviewed' or 'dismissed'" });
    return;
  }
  try {
    const report = await resolveReport(adminClerkId!, req.params.id, status);
    res.json({ report });
  } catch (err) {
    if (err instanceof Error && err.message === "Report not found") {
      res.status(404).json({ error: "Report not found" });
      return;
    }
    throw err;
  }
});
