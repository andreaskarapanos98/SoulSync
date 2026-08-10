import { useEffect, useState } from "react";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { AdminEventCount, AdminFunnelStep } from "../../services/adminApi";

export function AdminFunnelPage() {
  const api = useAdminApi();
  const [funnel, setFunnel] = useState<AdminFunnelStep[] | null>(null);
  const [events, setEvents] = useState<AdminEventCount[] | null>(null);

  useEffect(() => {
    api.getFunnel().then((res) => setFunnel(res.funnel));
    api.getEventCounts().then((res) => setEvents(res.events));
  }, [api]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Funnel & Analytics</h1>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Activation funnel</h2>
        <p className="mt-1 text-xs text-neutral-400">Unique users who reached each step, with drop-off from the previous one.</p>
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <th className="px-4 py-2">Step</th>
                <th className="px-4 py-2">Users</th>
                <th className="px-4 py-2">Retained</th>
                <th className="px-4 py-2">Drop-off</th>
              </tr>
            </thead>
            <tbody>
              {!funnel ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                    Loading…
                  </td>
                </tr>
              ) : (
                funnel.map((step, i) => {
                  const prev = i > 0 ? funnel[i - 1].uniqueUsers : step.uniqueUsers;
                  const retainedPct = prev > 0 ? Math.round((step.uniqueUsers / prev) * 100) : i === 0 ? 100 : 0;
                  const dropOff = i > 0 ? prev - step.uniqueUsers : 0;
                  return (
                    <tr key={step.event} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                      <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{step.label}</td>
                      <td className="px-4 py-2 font-semibold text-neutral-900 dark:text-white">{step.uniqueUsers}</td>
                      <td className="px-4 py-2 text-neutral-500">{i === 0 ? "—" : `${retainedPct}%`}</td>
                      <td className="px-4 py-2 text-red-500">{i === 0 ? "—" : dropOff > 0 ? `-${dropOff}` : "0"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">All events</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <th className="px-4 py-2">Event</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Unique users</th>
              </tr>
            </thead>
            <tbody>
              {!events ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-neutral-400">
                    Loading…
                  </td>
                </tr>
              ) : (
                events.map((e) => (
                  <tr key={e.event} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                    <td className="px-4 py-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">{e.event}</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{e.count}</td>
                    <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{e.uniqueUsers}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
