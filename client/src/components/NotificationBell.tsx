import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import type { NotificationDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL_MS = 15000;

export function NotificationBell() {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDTO[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    function poll() {
      api.getNotifications().then((res) => setUnreadCount(res.unreadCount)).catch(() => {});
    }
    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleToggle() {
    const opening = !open;
    setOpen(opening);
    if (!opening) return;

    const res = await api.getNotifications();
    setNotifications(res.notifications);
    if (res.unreadCount > 0) {
      await api.markAllNotificationsRead();
      setUnreadCount(0);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        title="Notifications"
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <p className="border-b border-neutral-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-400 dark:border-neutral-800">
            Notifications
          </p>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-neutral-400">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  to={`/profiles/${n.otherClerkId}`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-3 border-b border-neutral-50 px-4 py-3 text-sm hover:bg-brand-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
                >
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border border-brand-200 dark:border-neutral-700">
                    {n.otherPhotoUrl ? (
                      <img src={`${API_URL}${n.otherPhotoUrl}`} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center bg-brand-50 text-xs dark:bg-brand-950/40">
                        💘
                      </span>
                    )}
                  </div>
                  <span className="flex flex-col">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100">{n.title}</span>
                    <span className="text-neutral-600 dark:text-neutral-400">{n.message}</span>
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
