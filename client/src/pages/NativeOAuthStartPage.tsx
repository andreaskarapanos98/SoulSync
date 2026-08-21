import { useEffect, useRef, useState } from "react";
import { useSignIn } from "@clerk/clerk-react";

// Entry point for the native app's Google sign-in, but loaded in the SYSTEM BROWSER
// (opened as a Chrome Custom Tab by SignInPage/SignUpPage), never inside the app's
// WebView. That's the whole point: Clerk ties a sign-in attempt to the browser context
// that created it, so starting the flow in the app's WebView and letting Google finish
// it in Chrome left Chrome with no matching attempt and no session — the callback page
// then waited forever for a sign-in that could never land there. Starting it here means
// the attempt, the Google round trip, and the resulting session all live in the same
// browser; /oauth-native-callback then bridges that session back to the app by ticket.
export function NativeOAuthStartPage() {
  const { signIn, isLoaded } = useSignIn();
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isLoaded || !signIn || startedRef.current) return;
    startedRef.current = true;
    signIn
      .authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}/oauth-native-callback`,
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [isLoaded, signIn]);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      <span className="text-4xl">🔐</span>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">Opening Google sign-in…</h1>
      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-2 text-neutral-500 dark:text-neutral-400">This should only take a second.</p>
      )}
    </div>
  );
}
