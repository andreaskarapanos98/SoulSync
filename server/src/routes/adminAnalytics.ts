import { Router } from "express";
import { getEventCounts, getFunnel } from "../services/analyticsService.js";

export const adminAnalyticsRouter = Router();

adminAnalyticsRouter.get("/analytics/funnel", async (_req, res) => {
  const funnel = await getFunnel();
  res.json({ funnel });
});

adminAnalyticsRouter.get("/analytics/events", async (_req, res) => {
  const events = await getEventCounts();
  res.json({ events });
});
