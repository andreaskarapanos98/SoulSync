import type { MatchesResponseDTO, VerificationStatus } from "@soulsync/shared-types";
import { ApiError } from "./api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export interface AdminUserSummary {
  clerkId: string;
  email: string;
  onboardingStatus: string;
  coinBalance: number;
  status: "active" | "suspended" | "banned" | "deleted";
  role: "user" | "admin";
  verificationStatus?: VerificationStatus;
  createdAt: string;
}

export interface AdminCoinTransaction {
  _id: string;
  clerkId: string;
  type: "purchase" | "unlock_spend" | "admin_adjustment" | "verification_spend" | "gift_spend";
  amount: number;
  stripeSessionId?: string;
  relatedClerkId?: string;
  adminClerkId?: string;
  reason?: string;
  createdAt: string;
}

export interface AdminPaymentEvent {
  _id: string;
  clerkId?: string;
  stripeSessionId?: string;
  stripeEventType: string;
  status: "succeeded" | "failed" | "expired";
  amountCents?: number;
  currency?: string;
  packageId?: string;
  coins?: number;
  failureReason?: string;
  createdAt: string;
}

export interface AdminSystemErrorLog {
  _id: string;
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  statusCode?: number;
  clerkId?: string;
  source: string;
  createdAt: string;
}

export interface AdminAuditLogEntry {
  _id: string;
  adminClerkId: string;
  action: string;
  targetClerkId?: string;
  details?: Record<string, unknown>;
  createdAt: string;
}

export interface AdminReport {
  _id: string;
  reporterClerkId: string;
  reportedClerkId: string;
  contentType: string;
  contentRef?: string;
  reason: string;
  details?: string;
  status: "open" | "reviewed" | "dismissed";
  reviewedByClerkId?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface AdminQuestion {
  _id: string;
  key: string;
  category: string;
  appliesTo: "about_me" | "preference";
  type: string;
  label: string;
  options?: { value: string; label: string; exclusive?: boolean }[];
  min?: number;
  max?: number;
  required: boolean;
  searchable?: boolean;
  order: number;
  active: boolean;
  scoringMechanic?: string;
  canBeDealBreaker?: boolean;
}

export interface AdminFunnelStep {
  event: string;
  label: string;
  uniqueUsers: number;
}

export interface AdminEventCount {
  event: string;
  count: number;
  uniqueUsers: number;
}

interface Page {
  total: number;
  page: number;
  limit: number;
}

type GetToken = () => Promise<string | null>;

export function createAdminApiClient(getToken: GetToken) {
  async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, body.issues ?? (body.error ? [body.error] : undefined));
    }
    return res.json() as Promise<T>;
  }

  function qs(params: Record<string, string | number | undefined>) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined);
    if (entries.length === 0) return "";
    return "?" + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString();
  }

  return {
    listUsers: (opts: { search?: string; page?: number; limit?: number } = {}) =>
      request<{ users: AdminUserSummary[] } & Page>(`/api/v1/admin/users${qs(opts)}`),
    getUserDetail: (clerkId: string) =>
      request<{
        account: AdminUserSummary;
        coinTransactions: AdminCoinTransaction[];
        unlockedCount: number;
        unlockedByCount: number;
      }>(`/api/v1/admin/users/${clerkId}`),
    suspendUser: (clerkId: string, reason?: string) =>
      request<{ account: AdminUserSummary }>(`/api/v1/admin/users/${clerkId}/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    banUser: (clerkId: string, reason?: string) =>
      request<{ account: AdminUserSummary }>(`/api/v1/admin/users/${clerkId}/ban`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    restoreUser: (clerkId: string) =>
      request<{ account: AdminUserSummary }>(`/api/v1/admin/users/${clerkId}/restore`, { method: "POST" }),
    setVerification: (clerkId: string, status: "verified" | "unverified", reason?: string) =>
      request<{ account: AdminUserSummary }>(`/api/v1/admin/users/${clerkId}/verification`, {
        method: "POST",
        body: JSON.stringify({ status, reason }),
      }),
    adjustCoins: (clerkId: string, amount: number, reason: string) =>
      request<{ coinBalance: number }>(`/api/v1/admin/users/${clerkId}/coins/adjust`, {
        method: "POST",
        body: JSON.stringify({ amount, reason }),
      }),
    listCoinTransactions: (opts: { clerkId?: string; type?: string; page?: number; limit?: number } = {}) =>
      request<{ transactions: AdminCoinTransaction[] } & Page>(
        `/api/v1/admin/coin-transactions${qs(opts)}`,
      ),
    listPayments: (opts: { status?: string; page?: number; limit?: number } = {}) =>
      request<{ events: AdminPaymentEvent[] } & Page>(`/api/v1/admin/payments${qs(opts)}`),
    listErrors: (opts: { page?: number; limit?: number } = {}) =>
      request<{ errors: AdminSystemErrorLog[] } & Page>(`/api/v1/admin/errors${qs(opts)}`),
    listAuditLog: (opts: { page?: number; limit?: number } = {}) =>
      request<{ entries: AdminAuditLogEntry[] } & Page>(`/api/v1/admin/audit-log${qs(opts)}`),
    listQuestions: (appliesTo?: "about_me" | "preference") =>
      request<{ questions: AdminQuestion[] }>(`/api/v1/admin/questions${qs({ appliesTo })}`),
    createQuestion: (question: Partial<AdminQuestion>) =>
      request<{ question: AdminQuestion }>("/api/v1/admin/questions", { method: "POST", body: JSON.stringify(question) }),
    updateQuestion: (id: string, changes: Partial<AdminQuestion>) =>
      request<{ question: AdminQuestion }>(`/api/v1/admin/questions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      }),
    getUserMatches: (clerkId: string) => request<MatchesResponseDTO>(`/api/v1/admin/users/${clerkId}/matches`),
    getCompatibility: (a: string, b: string) =>
      request<{ aToB: number; bToA: number }>(`/api/v1/admin/compatibility${qs({ a, b })}`),
    listReports: (opts: { status?: string; page?: number; limit?: number } = {}) =>
      request<{ reports: AdminReport[] } & Page>(`/api/v1/admin/reports${qs(opts)}`),
    resolveReport: (id: string, status: "reviewed" | "dismissed") =>
      request<{ report: AdminReport }>(`/api/v1/admin/reports/${id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ status }),
      }),
    getFunnel: () => request<{ funnel: AdminFunnelStep[] }>("/api/v1/admin/analytics/funnel"),
    getEventCounts: () => request<{ events: AdminEventCount[] }>("/api/v1/admin/analytics/events"),
  };
}

export type AdminApiClient = ReturnType<typeof createAdminApiClient>;
