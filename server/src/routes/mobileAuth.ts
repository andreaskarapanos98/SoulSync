import { Router } from "express";
import { clerkClient, getAuth } from "@clerk/express";

export const mobileAuthRouter = Router();

// Bridges a Clerk session from the external browser tab Google OAuth has to run in
// (Capacitor/Android can't complete Google sign-in inside its own embedded WebView)
// back into the wrapped app's own WebView, which has a separate, isolated cookie jar.
// The web app calls this once it's signed in inside that external tab; the short-lived
// ticket it gets back is handed to the native app via a custom-scheme redirect, which
// the app then exchanges for its own session with signIn.create({ strategy: "ticket" }).
mobileAuthRouter.post("/mobile-ticket", async (req, res) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = await clerkClient.signInTokens.createSignInToken({ userId, expiresInSeconds: 60 });
  res.json({ ticket: token.token });
});
