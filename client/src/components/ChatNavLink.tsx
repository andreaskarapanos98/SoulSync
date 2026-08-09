import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useApi } from "../hooks/useApi";

const POLL_INTERVAL_MS = 10000;

export function ChatNavLink() {
  const api = useApi();
  const location = useLocation();
  const [count, setCount] = useState(0);

  useEffect(() => {
    function poll() {
      api.getUnreadCount().then((res) => setCount(res.count)).catch(() => {});
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // Re-poll immediately on navigation (e.g. right after leaving a thread you just read).
  }, [api, location.pathname]);

  return (
    <Link
      to="/chat"
      className="relative rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
    >
      Chat
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
