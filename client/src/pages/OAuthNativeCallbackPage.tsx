import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "../hooks/useApi";

// Reached in the external browser tab Google OAuth had to run in (Capacitor/Android
// can't complete Google sign-in inside its own embedded WebView — see the native
// Google button in Layout.tsx). By the time we're here, Clerk has already created a
// session in THIS browser tab's cookie jar — but that's a separate, isolated cookie jar
// from the app's own WebView, so the app itself still isn't signed in. Bridge the two:
// mint a short-lived one-time ticket and hand it to the app via a custom-scheme
// redirect; NativeAuthBridge.tsx picks it up and exchanges it for the app's own session.
export function OAuthNativeCallbackPage() {
  const api = useApi();
  const { isLoaded, isSignedIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [ticketUrl, setTicketUrl] = useState<string | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || requestedRef.current) return;
    requestedRef.current = true;
    api
      .getMobileTicket()
      .then((res) => {
        const url = `soulsync://oauth-complete?ticket=${encodeURIComponent(res.ticket)}`;
        setTicketUrl(url);
        window.location.href = url;
      })
      .catch((err) => setError(String(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      <span className="text-4xl">🔗</span>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">Taking you back to SoulSync…</h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">
        {error ? "Something went wrong finishing sign-in." : "This should only take a second."}
      </p>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {ticketUrl && (
        <a
          href={ticketUrl}
          className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Didn't open automatically? Tap here
        </a>
      )}
    </div>
  );
}
