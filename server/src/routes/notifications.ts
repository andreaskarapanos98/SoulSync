import { Router } from "express";
import { getAuth } from "@clerk/express";
import { getNotifications, getUnreadNotificationCount, markAllNotificationsRead } from "../services/notificationService.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(userId),
    getUnreadNotificationCount(userId),
  ]);
  res.json({ notifications, unreadCount });
});

notificationsRouter.post("/mark-all-read", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await markAllNotificationsRead(userId);
  res.json({ ok: true });
});
