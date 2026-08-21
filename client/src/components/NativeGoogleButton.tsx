import { Browser } from "@capacitor/browser";

// Opens the Google sign-in flow in a Chrome Custom Tab rather than navigating the app's
// own WebView: Google refuses to render its consent screen inside an embedded WebView,
// and Clerk ties a sign-in attempt to the browser context that started it — so the whole
// flow has to begin and end in the system browser (see NativeOAuthStartPage). The app
// gets the resulting session back via the soulsync:// deep link (NativeAuthBridge.tsx).
export function NativeGoogleButton({ label }: { label: string }) {
  async function handleClick() {
    await Browser.open({ url: `${window.location.origin}/native-oauth-start` });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {label}
    </button>
  );
}

// Clerk renders its own (non-functional in a WebView) Google button inside SignIn/SignUp.
// Hide it with style objects rather than utility classes — Clerk's own CSS wins over a
// bare `hidden` class, which is why two "Continue with Google" buttons were showing up.
export const hideClerkSocialAppearance = {
  elements: {
    socialButtons: { display: "none" },
    socialButtonsBlockButton: { display: "none" },
    socialButtonsProviderIcon: { display: "none" },
    dividerRow: { display: "none" },
    cardBox: { boxShadow: "none" },
  },
} as const;
