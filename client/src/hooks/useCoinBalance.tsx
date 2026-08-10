import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "./useApi";

interface CoinBalanceContextValue {
  balance: number;
  refresh: () => void;
  setBalance: (balance: number) => void;
}

const CoinBalanceContext = createContext<CoinBalanceContextValue>({
  balance: 0,
  refresh: () => {},
  setBalance: () => {},
});

const POLL_INTERVAL_MS = 30000;

export function CoinBalanceProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const [balance, setBalance] = useState(0);

  const refresh = useCallback(() => {
    if (!isSignedIn) return;
    api.getMe().then((me) => setBalance(me.coinBalance)).catch(() => {});
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setBalance(0);
      return;
    }
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return <CoinBalanceContext.Provider value={{ balance, refresh, setBalance }}>{children}</CoinBalanceContext.Provider>;
}

export function useCoinBalance() {
  return useContext(CoinBalanceContext);
}
