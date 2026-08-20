import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

// No-ops entirely on regular web (Capacitor.isNativePlatform() is false there — this
// same bundle serves both the plain web app and the wrapped native app). On native,
// lets the app's own header draw behind the status bar instead of leaving a separate
// opaque grey system bar sitting on top of it; Layout.tsx pads the header by
// env(safe-area-inset-top) so content still clears the clock/icons.
export async function configureNativeStatusBar(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark }); // dark icons/text, for our light header
  } catch {
    // Best-effort — a handful of older WebView builds don't support overlay mode.
  }
}
