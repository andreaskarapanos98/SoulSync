import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "../hooks/useApi";

// Final hop of the native Google sign-in, running in the system browser (see
// NativeOAuthStartPage for why the whole flow lives there). Clerk has just created a
// session in THIS browser's cookie jar — which the app's WebView can't see — so mint a
// short-lived one-time ticket and hand it to the app through the soulsync:// deep link;
// NativeAuthBridge.tsx redeems it for a session on the app side.
export function OAuthNativeCallbackPage() {
  const api = useApi();
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || requestedRef.current) return;
    // Signed out here means the sign-in didn't land in this browser at all (the failure
    // this page used to hang forever on). Surface it instead of spinning.
    if (!isSignedIn) {
      setError("Sign-in didn't complete in this browser. Please head back to the app and try again.");
      return;
    }
    requestedRef.current = true;
    api
      .getMobileTicket()
      .then((res) => {
        const url = `soulsync://oauth-complete?ticket=${encodeURIComponent(res.ticket)}`;
        setTicketUrl(url);
        // Browsers block custom-scheme navigation that isn't user-initiated, so this
        // may silently no-op — hence the always-visible button below.
        window.location.href = url;
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [isLoaded, isSignedIn, api]);

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center px-6 py-20 text-center">
      <span className="text-4xl">{error ? "😕" : "🔗"}</span>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">
        {error ? "Couldn't finish sign-in" : "You're signed in!"}
      </h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        {error ?? "Tap below to return to SoulSync."}
      </p>
      {ticketUrl && (
        <a
          href={ticketUrl}
          className="mt-6 w-full rounded-full bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Return to SoulSync
        </a>
      )}
      {!ticketUrl && !error && <p className="mt-6 text-sm text-neutral-400">Finishing up…</p>}
    </div>
  );
}
