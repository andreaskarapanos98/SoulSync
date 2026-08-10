import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "./useApi";
import { playIncomingSound } from "../utils/sounds";

interface UnreadCountContextValue {
  count: number;
  refresh: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextValue>({ count: 0, refresh: () => {} });

// Also the app-wide "new message" notification path — tight enough that a sound plays
// within a few seconds even when you're not looking at the chat thread it's in.
const POLL_INTERVAL_MS = 6000;

export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const [count, setCount] = useState(0);
  // Monotonic high-water mark (ISO timestamps compare correctly as strings) — only
  // moves forward, so marking one conversation read can never make an older,
  // already-unread message from a different conversation falsely look "new".
  const highWaterMarkRef = useRef<string | undefined>(undefined);
  const hasPolledOnceRef = useRef(false);

  const refresh = useCallback(() => {
    if (!isSignedIn) return;
    api
      .getUnreadCount()
      .then((res) => {
        setCount(res.count);

        const latest = res.latestUnreadMessageAt;
        if (latest && (!highWaterMarkRef.current || latest > highWaterMarkRef.current)) {
          // Skip the very first poll so pre-existing unread messages don't sound off
          // the moment the app loads.
          if (hasPolledOnceRef.current) playIncomingSound();
          highWaterMarkRef.current = latest;
        }
        hasPolledOnceRef.current = true;
      })
      .catch(() => {});
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setCount(0);
      highWaterMarkRef.current = undefined;
      hasPolledOnceRef.current = false;
      return;
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return <UnreadCountContext.Provider value={{ count, refresh }}>{children}</UnreadCountContext.Provider>;
}

export function useUnreadCount() {
  return useContext(UnreadCountContext);
}
