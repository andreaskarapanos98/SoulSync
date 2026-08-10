import { Router } from "express";
import { requireAdmin } from "../middleware/requireAdmin.js";

export const adminRouter = Router();

// Every route mounted below requires admin access — checked once here rather than in
// each individual sub-router.
adminRouter.use(requireAdmin);

adminRouter.get("/ping", (_req, res) => {
  res.json({ ok: true });
});
