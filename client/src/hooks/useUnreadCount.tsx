import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "./useApi";

interface UnreadCountContextValue {
  count: number;
  refresh: () => void;
}

const UnreadCountContext = createContext<UnreadCountContextValue>({ count: 0, refresh: () => {} });

// Fallback only — the real-time-ish path is components calling refresh() right after an
// action that changes read state (e.g. a thread marking itself read), not this timer.
const POLL_INTERVAL_MS = 20000;

export function UnreadCountProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    if (!isSignedIn) return;
    api.getUnreadCount().then((res) => setCount(res.count)).catch(() => {});
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setCount(0);
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
