import { Router } from "express";
import { getAuth } from "@clerk/express";
import { GIFT_CATALOG } from "../services/coinService.js";

export const giftsRouter = Router();

giftsRouter.get("/", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ gifts: GIFT_CATALOG });
});
