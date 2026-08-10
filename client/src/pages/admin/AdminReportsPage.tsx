import { useEffect, useState } from "react";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { AdminReport } from "../../services/adminApi";

const STATUS_TABS = ["open", "reviewed", "dismissed", "all"] as const;

export function AdminReportsPage() {
  const api = useAdminApi();
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("open");
  const [busyId, setBusyId] = useState<string | null>(null);

  function load() {
    api.listReports({ status: tab === "all" ? undefined : tab, limit: 50 }).then((res) => setReports(res.reports));
  }

  useEffect(load, [api, tab]);

  async function handleResolve(id: string, status: "reviewed" | "dismissed") {
    setBusyId(id);
    try {
      await api.resolveReport(id, status);
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Reports</h1>

      <div className="mt-4 flex gap-2">
        {STATUS_TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
              tab === t
                ? "bg-brand-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {!reports ? (
          <p className="text-neutral-400">Loading…</p>
        ) : reports.length === 0 ? (
          <p className="text-neutral-400">No {tab === "all" ? "" : tab} reports.</p>
        ) : (
          reports.map((r) => (
            <div key={r._id} className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {r.reason.replace(/_/g, " ")} — {r.contentType}
                  </p>
                  <p className="text-xs text-neutral-400">
                    Reporter: {r.reporterClerkId} · Reported: {r.reportedClerkId}
                    {r.contentRef ? ` · Ref: ${r.contentRef}` : ""}
                  </p>
                </div>
                <span className="text-xs text-neutral-400">{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              {r.details && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{r.details}</p>}
              {r.status === "open" ? (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleResolve(r._id, "reviewed")}
                    disabled={busyId === r._id}
                    className="rounded-full bg-brand-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Mark reviewed
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResolve(r._id, "dismissed")}
                    disabled={busyId === r._id}
                    className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-400"
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-xs font-medium text-neutral-400">
                  {r.status} by {r.reviewedByClerkId} at {r.reviewedAt && new Date(r.reviewedAt).toLocaleString()}
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
