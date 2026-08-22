import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "../hooks/useApi";

// Registers this device for Firebase push once someone is signed in, and hands the FCM
// token to the server so pushService.ts knows where to send it. No-ops entirely on
// regular web (there's no FCM token to get). Mounted once near the app root, alongside
// NativeAuthBridge.
export function NativePushBridge() {
  const { isSignedIn } = useAuth();
  const api = useApi();
  const navigate = useNavigate();
  const registeredToken = useRef<string | null>(null);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !isSignedIn) return;

    let cancelled = false;

    async function register() {
      const permission = await PushNotifications.checkPermissions();
      let granted = permission.receive === "granted";
      if (!granted && permission.receive !== "denied") {
        granted = (await PushNotifications.requestPermissions()).receive === "granted";
      }
      if (!granted || cancelled) return;
      await PushNotifications.register();
    }
    register().catch(() => {});

    const registrationHandle = PushNotifications.addListener("registration", (token) => {
      registeredToken.current = token.value;
      api.registerPushToken(token.value).catch(() => {});
    });

    // Tapping a system-tray notification while the app is backgrounded/closed lands here
    // with the same `data` payload pushService.ts attached server-side.
    const tapHandle = PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
      const data = action.notification.data as { type?: string; fromClerkId?: string };
      if (data.type === "message" && data.fromClerkId) {
        navigate(`/chat/${data.fromClerkId}`);
      }
    });

    return () => {
      cancelled = true;
      registrationHandle.then((h) => h.remove());
      tapHandle.then((h) => h.remove());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (isSignedIn) return;
    // Signed out on a device that still holds a registered token — stop this account
    // from receiving pushes meant for whoever signs in next.
    if (registeredToken.current) {
      api.unregisterPushToken(registeredToken.current).catch(() => {});
      registeredToken.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return null;
}
