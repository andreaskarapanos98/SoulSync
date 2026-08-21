import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { useSignIn } from "@clerk/clerk-react";

// The other half of the native Google sign-in flow (see the "Continue with Google"
// button in Layout.tsx and OAuthNativeCallbackPage). Mounted once near the app root;
// no-ops entirely on regular web. When the external browser tab hands control back via
// the soulsync://oauth-complete deep link, exchanges the one-time ticket it carries for
// a real session in the app's own WebView.
export function NativeAuthBridge() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const navigate = useNavigate();

  // signIn/setActive get a new object identity on pretty much every Clerk client state
  // change — with them in the effect's dependency array, a full OAuth round trip
  // re-registers the appUrlOpen listener several times over without the previous one
  // ever being torn down first (its cleanup is async), so the single incoming deep link
  // gets raced by multiple stale listeners, all trying to redeem the same one-time
  // ticket at once — confirmed live via remote debugging as a burst of duplicate
  // /v1/client/sign_ins calls that Clerk starts rate-limiting (429). Keep the latest
  // values in a ref instead, and register the listener exactly once on mount.
  const latest = useRef({ signIn, setActive, isLoaded });
  latest.current = { signIn, setActive, isLoaded };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handle = App.addListener("appUrlOpen", async ({ url }) => {
      const { signIn, setActive, isLoaded } = latest.current;
      if (!isLoaded || !signIn || !setActive) return;

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
      } finally {
        // Dismiss the Custom Tab the flow ran in, so the user lands back on the app
        // rather than on a spent callback page. No-op if it's already closed.
        Browser.close().catch(() => {});
      }
    });

    return () => {
      handle.then((h) => h.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
