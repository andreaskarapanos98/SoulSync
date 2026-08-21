import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";

/**
 * Opens a URL in the phone's real browser, never in the app's own WebView.
 *
 * Prefers a Chrome Custom Tab, but falls back to handing Android an `intent:` URL, which
 * the OS routes to the default browser without needing any plugin at all. The fallback
 * matters: the web bundle updates the moment it's deployed, while native plugins only
 * exist in a freshly built APK — without it, every install still running an older APK
 * gets a dead button ("Browser plugin is not implemented on android").
 */
async function openInSystemBrowser(url: string): Promise<void> {
  if (Capacitor.isPluginAvailable("Browser")) {
    try {
      await Browser.open({ url });
      return;
    } catch {
      // Fall through to the intent: form below.
    }
  }
  const { host, pathname, search } = new URL(url);
  window.location.href =
    `intent://${host}${pathname}${search}` +
    `#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;end`;
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
