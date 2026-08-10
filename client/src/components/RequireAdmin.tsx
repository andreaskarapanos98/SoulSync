import { type ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const api = useApi();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    api
      .getMe()
      .then((me) => setIsAdmin(me.isAdmin))
      .catch(() => setIsAdmin(false));
  }, [api]);

  if (isAdmin === null) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading…</p>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}
