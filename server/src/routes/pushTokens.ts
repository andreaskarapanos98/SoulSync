import { Router } from "express";
import { getAuth } from "@clerk/express";
import { registerDeviceToken, unregisterDeviceToken } from "../services/pushService.js";

export const pushTokensRouter = Router();

pushTokensRouter.post("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const { token } = req.body as { token?: string };
  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }
  await registerDeviceToken(userId, token);
  res.json({ ok: true });
});

// Called on sign-out so a shared/reused device stops receiving this account's pushes.
pushTokensRouter.delete("/:token", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await unregisterDeviceToken(req.params.token);
  res.json({ ok: true });
});
