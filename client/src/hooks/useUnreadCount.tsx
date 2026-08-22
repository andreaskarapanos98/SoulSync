import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "./useApi";
import { useChatSocket } from "./useChatSocket";
import { playIncomingSound } from "../utils/sounds";

interface UnreadCountContextValue {
  count: number;
  refresh: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextValue>({ count: 0, refresh: () => {} });

export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const socket = useChatSocket();
  const [count, setCount] = useState(0);
  // Monotonic high-water mark (ISO timestamps compare correctly as strings) — only
  // moves forward, so marking one conversation read can never make an older,
  // already-unread message from a different conversation falsely look "new".
  const highWaterMarkRef = useRef<string | undefined>(undefined);
  const hasFetchedOnceRef = useRef(false);

  const apply = useCallback((newCount: number, latest: string | undefined) => {
    setCount(newCount);
    if (latest && (!highWaterMarkRef.current || latest > highWaterMarkRef.current)) {
      // Skip the very first fetch so pre-existing unread messages don't sound off the
      // moment the app loads.
      if (hasFetchedOnceRef.current) playIncomingSound();
      highWaterMarkRef.current = latest;
    }
    hasFetchedOnceRef.current = true;
  }, []);

  const refresh = useCallback(() => {
    if (!isSignedIn) return;
    api.getUnreadCount().then((res) => apply(res.count, res.latestUnreadMessageAt)).catch(() => {});
  }, [api, isSignedIn, apply]);

  useEffect(() => {
    if (!isSignedIn) {
      setCount(0);
      highWaterMarkRef.current = undefined;
      hasFetchedOnceRef.current = false;
      return;
    }
    refresh(); // one-time hydration; live updates come from the socket below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    if (!socket) return;
    function onUnreadChanged({ count, latestUnreadMessageAt }: { count: number; latestUnreadMessageAt?: string }) {
      apply(count, latestUnreadMessageAt);
    }
    socket.on("unread:changed", onUnreadChanged);
    return () => {
      socket.off("unread:changed", onUnreadChanged);
    };
  }, [socket, apply]);

  return <UnreadCountContext.Provider value={{ count, refresh }}>{children}</UnreadCountContext.Provider>;
}

export function useUnreadCount() {
  return useContext(UnreadCountContext);
}
