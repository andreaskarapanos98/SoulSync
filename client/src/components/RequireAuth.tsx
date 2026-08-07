import type { ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded) return <p>Loading…</p>;
  if (!isSignedIn) return <Navigate to="/" replace />;
  return <>{children}</>;
}
