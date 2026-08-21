import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";

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

  // Overlaying the status bar puts Android in edge-to-edge mode, which stops the OS's
  // usual windowSoftInputMode="adjustResize" from reliably shrinking the WebView when
  // the keyboard opens. MainActivity.java now handles this itself — it listens for the
  // real IME inset and pads the WebView directly, which our dvh-based layouts react to.
  // `None` here stops the plugin from *also* resizing document.body on top of that;
  // running both at once was fighting the native padding and pushing the composer off
  // the bottom of the screen instead of just above the keyboard.
  try {
    await Keyboard.setResizeMode({ mode: KeyboardResize.None });
  } catch {
    // Best-effort — same rationale as above.
  }
}
