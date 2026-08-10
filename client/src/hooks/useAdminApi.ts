import { useMemo } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createAdminApiClient } from "../services/adminApi";

export function useAdminApi() {
  const { getToken } = useAuth();
  return useMemo(() => createAdminApiClient(getToken), [getToken]);
}
