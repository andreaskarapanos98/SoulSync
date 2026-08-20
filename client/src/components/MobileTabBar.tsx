import { Link, useLocation } from "react-router-dom";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { CoinIcon } from "./CoinIcon";
import { ProfileAvatarButton } from "./ProfileAvatarButton";

// Fixed bottom nav, mobile only (sm:hidden) — this is what makes the wrapped app read
// as an app instead of a website squeezed into a phone screen. Desktop keeps the
// existing top-bar links entirely unchanged.
export function MobileTabBar() {
  const location = useLocation();
  const { count } = useUnreadCount();
  const { balance } = useCoinBalance();

  function isActive(path: string) {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  }

  const tabClass = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-medium ${
      active ? "text-brand-600 dark:text-brand-400" : "text-neutral-400 dark:text-neutral-500"
    }`;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex bg-white/95 shadow-[0_-1px_6px_rgba(0,0,0,0.08)] backdrop-blur sm:hidden dark:bg-neutral-950/95 dark:shadow-[0_-1px_6px_rgba(0,0,0,0.4)]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <Link to="/matches" className={tabClass(isActive("/matches"))}>
        <span className="text-lg leading-none">💘</span>
        Soulmates
      </Link>

      <Link to="/chat" className={tabClass(isActive("/chat"))}>
        <span className="text-lg leading-none">💬</span>
        Chat
        {count > 0 && (
          <span className="absolute right-[22%] top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </Link>

      <Link to="/coins" className={tabClass(isActive("/coins"))}>
        <CoinIcon className="h-[18px] w-[18px]" />
        {balance}
      </Link>

      <div
        className={`${tabClass(isActive("/profile") || isActive("/profiles") || isActive("/account"))} p-0`}
      >
        <ProfileAvatarButton openUpward />
        <span className="pointer-events-none -mt-0.5">Profile</span>
      </div>
    </nav>
  );
}
