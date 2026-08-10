import { Router } from "express";
import { getAuth } from "@clerk/express";
import { track, analyticsEventTypes } from "../services/analyticsService.js";

export const analyticsRouter = Router();

// Client-fireable — for events with no natural server-side touchpoint (viewing a page,
// clicking a button that doesn't itself hit the API). Server-driven events (registration,
// coin_purchase_completed, profile_unlocked, message_sent) are tracked directly from the
// service functions that cause them instead of round-tripping through this endpoint.
analyticsRouter.post("/track", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { event, properties } = req.body as { event?: string; properties?: Record<string, unknown> };
  if (!event || !(analyticsEventTypes as readonly string[]).includes(event)) {
    res.status(400).json({ error: `event must be one of: ${analyticsEventTypes.join(", ")}` });
    return;
  }

  await track(userId, event as (typeof analyticsEventTypes)[number], properties);
  res.json({ ok: true });
});
