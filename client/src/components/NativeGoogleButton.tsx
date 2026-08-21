import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Opens a URL in the phone's real browser, never in the app's own WebView.
 *
 * Prefers a Chrome Custom Tab, but falls back to window.open(_blank), which Capacitor
 * hands to the system browser. The fallback matters: the web bundle updates the moment
 * it's deployed, while native plugins only exist in a freshly built APK — without it,
 * every install still on an older APK gets a dead button ("Browser plugin is not
 * implemented on android"). Both paths were verified on-device; an `intent:` URL was
 * tried first and silently did nothing, so don't reach for that again.
 */
async function openInSystemBrowser(url: string): Promise<void> {
  if (Capacitor.isPluginAvailable("Browser")) {
    try {
      await Browser.open({ url });
      return;
    } catch {
      // Fall through to window.open below.
    }
  }
  window.open(url, "_blank");
}

// Google refuses to render its consent screen inside an embedded WebView, and Clerk ties
// a sign-in attempt to the browser context that created it — so the whole flow has to
// start and finish in the system browser (see NativeOAuthStartPage). The app gets the
// resulting session back via the soulsync:// deep link (NativeAuthBridge.tsx).
export function NativeGoogleButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => openInSystemBrowser(`${window.location.origin}/native-oauth-start`)}
      className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      {label}
    </button>
  );
}
