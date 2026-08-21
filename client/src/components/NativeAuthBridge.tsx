import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useSignIn } from "@clerk/clerk-react";

// The other half of the native Google sign-in flow (see the "Continue with Google"
// button in Layout.tsx and OAuthNativeCallbackPage). Mounted once near the app root;
// no-ops entirely on regular web. When the external browser tab hands control back via
// the soulsync://oauth-complete deep link, exchanges the one-time ticket it carries for
// a real session in the app's own WebView.
export function NativeAuthBridge() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isLoaded || !signIn || !setActive) return;

    const handle = App.addListener("appUrlOpen", async ({ url }) => {
      let parsed: URL;
      try {
        parsed = new URL(url);
      } catch {
        return;
      }
      if (parsed.protocol !== "soulsync:" || parsed.hostname !== "oauth-complete") return;
      const ticket = parsed.searchParams.get("ticket");
      if (!ticket) return;

      try {
        const result = await signIn.create({ strategy: "ticket", ticket });
        if (result.status === "complete" && result.createdSessionId) {
          await setActive({ session: result.createdSessionId });
          navigate("/matches");
        }
      } catch {
        // Ticket already used/expired (e.g. a stale deep link replayed) — nothing to
        // recover here; the user just tries signing in again.
      }
    });

    return () => {
      handle.then((h) => h.remove());
    };
  }, [isLoaded, signIn, setActive, navigate]);

  return null;
}
