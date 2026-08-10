import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";

export function AdminNavLink() {
  const api = useApi();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    api.getMe().then((me) => setIsAdmin(me.isAdmin)).catch(() => {});
  }, [api]);

  if (!isAdmin) return null;

  return (
    <Link
      to="/admin"
      title="Admin dashboard"
      className="rounded-full px-3 py-1.5 text-sm font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
    >
      🛠️ Admin
    </Link>
  );
}
