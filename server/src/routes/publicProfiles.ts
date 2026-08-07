import { Router } from "express";
import { getAuth } from "@clerk/express";
import { assembleProfile } from "../services/profileService.js";

export const publicProfilesRouter = Router();

// Full profile data for now — no locking yet. Phase 7 (unlocking) will strip this
// down to a preview (photo, first name, age, location, voice intro) for viewers
// who haven't paid to unlock the match yet.
publicProfilesRouter.get("/:clerkId", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const profile = await assembleProfile(req.params.clerkId);
  res.json(profile);
});
