import { Link } from "react-router-dom";
import { useUnreadCount } from "../hooks/useUnreadCount";

export function ChatNavLink() {
  const { count } = useUnreadCount();

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
