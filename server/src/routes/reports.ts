import { Router } from "express";
import { getAuth } from "@clerk/express";
import { createReport, ReportRateLimitError } from "../services/reportService.js";
import { reportContentTypes, reportReasons } from "../models/Report.js";

export const reportsRouter = Router();

reportsRouter.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { reportedClerkId, contentType, contentRef, reason, details } = req.body as {
    reportedClerkId?: string;
    contentType?: string;
    contentRef?: string;
    reason?: string;
    details?: string;
  };

  if (!reportedClerkId || !contentType || !reason) {
    res.status(400).json({ error: "reportedClerkId, contentType, and reason are required" });
    return;
  }
  if (!(reportContentTypes as readonly string[]).includes(contentType)) {
    res.status(400).json({ error: `contentType must be one of: ${reportContentTypes.join(", ")}` });
    return;
  }
  if (!(reportReasons as readonly string[]).includes(reason)) {
    res.status(400).json({ error: `reason must be one of: ${reportReasons.join(", ")}` });
    return;
  }

  try {
    const report = await createReport(userId, {
      reportedClerkId,
      contentType: contentType as (typeof reportContentTypes)[number],
      contentRef,
      reason: reason as (typeof reportReasons)[number],
      details,
    });
    res.status(201).json({ report });
  } catch (err) {
    if (err instanceof ReportRateLimitError) {
      res.status(429).json({ error: err.message });
      return;
    }
    throw err;
  }
});
