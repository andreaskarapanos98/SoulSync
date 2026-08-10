import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { AdminFunnelStep } from "../../services/adminApi";

export function AdminDashboardPage() {
  const api = useAdminApi();
  const [funnel, setFunnel] = useState<AdminFunnelStep[] | null>(null);
  const [openReports, setOpenReports] = useState<number | null>(null);
  const [recentErrors, setRecentErrors] = useState<number | null>(null);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    api.getFunnel().then((res) => setFunnel(res.funnel)).catch(() => {});
    api.listReports({ status: "open", limit: 1 }).then((res) => setOpenReports(res.total)).catch(() => {});
    api.listErrors({ limit: 1 }).then((res) => setRecentErrors(res.total)).catch(() => {});
    api.listUsers({ limit: 1 }).then((res) => setTotalUsers(res.total)).catch(() => {});
  }, [api]);

  const maxCount = funnel && funnel.length > 0 ? Math.max(...funnel.map((f) => f.uniqueUsers), 1) : 1;

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Admin Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={totalUsers} to="/admin/users" />
        <StatCard label="Open reports" value={openReports} to="/admin/reports" highlight={Boolean(openReports)} />
        <StatCard label="Recent errors" value={recentErrors} to="/admin/errors" highlight={Boolean(recentErrors)} />
        <StatCard label="Funnel steps" value={funnel?.length ?? null} to="/admin/funnel" />
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Activation funnel</h2>
        {!funnel ? (
          <p className="mt-2 text-sm text-neutral-400">Loading…</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {funnel.map((step) => (
              <div key={step.event} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-neutral-600 dark:text-neutral-400">{step.label}</span>
                <div className="h-6 flex-1 overflow-hidden rounded bg-neutral-100 dark:bg-neutral-800">
                  <div
                    className="h-full rounded bg-brand-500"
                    style={{ width: `${Math.max((step.uniqueUsers / maxCount) * 100, step.uniqueUsers > 0 ? 4 : 0)}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {step.uniqueUsers}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link to="/admin/funnel" className="mt-3 inline-block text-sm text-brand-600 hover:underline dark:text-brand-400">
          View full funnel & event breakdown →
        </Link>
      </div>
    </AdminLayout>
  );
}

function StatCard({ label, value, to, highlight }: { label: string; value: number | null; to: string; highlight?: boolean }) {
  return (
    <Link
      to={to}
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-neutral-900 dark:text-white">{value ?? "…"}</p>
    </Link>
  );
}
