import { useEffect, useState } from "react";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { AdminAuditLogEntry, AdminSystemErrorLog } from "../../services/adminApi";

export function AdminErrorsPage() {
  const api = useAdminApi();
  const [tab, setTab] = useState<"errors" | "audit">("errors");
  const [errors, setErrors] = useState<AdminSystemErrorLog[] | null>(null);
  const [auditLog, setAuditLog] = useState<AdminAuditLogEntry[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "errors") api.listErrors({ limit: 50 }).then((res) => setErrors(res.errors));
    else api.listAuditLog({ limit: 50 }).then((res) => setAuditLog(res.entries));
  }, [api, tab]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Errors & Audit Log</h1>

      <div className="mt-4 flex gap-2">
        {(["errors", "audit"] as const).map((t) => (
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
            {t === "errors" ? "System errors" : "Admin audit log"}
          </button>
        ))}
      </div>

      {tab === "errors" ? (
        <div className="mt-4 flex flex-col gap-2">
          {!errors ? (
            <p className="text-neutral-400">Loading…</p>
          ) : errors.length === 0 ? (
            <p className="text-neutral-400">No errors logged. 🎉</p>
          ) : (
            errors.map((e) => (
              <div key={e._id} className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === e._id ? null : e._id)}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <div>
                    <p className="text-sm font-medium text-red-600 dark:text-red-400">{e.message}</p>
                    <p className="text-xs text-neutral-400">
                      {e.source}
                      {e.path ? ` · ${e.method} ${e.path}` : ""}
                      {e.clerkId ? ` · ${e.clerkId}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-neutral-400">{new Date(e.createdAt).toLocaleString()}</span>
                </button>
                {expandedId === e._id && e.stack && (
                  <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-50 p-2 text-xs text-neutral-600 dark:bg-neutral-950 dark:text-neutral-400">
                    {e.stack}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <th className="px-4 py-2">Admin</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">Target</th>
                <th className="px-4 py-2">Details</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {!auditLog ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                    Loading…
                  </td>
                </tr>
              ) : auditLog.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-neutral-400">
                    No admin actions logged yet.
                  </td>
                </tr>
              ) : (
                auditLog.map((entry) => (
                  <tr key={entry._id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{entry.adminClerkId}</td>
                    <td className="px-4 py-2 font-medium text-neutral-900 dark:text-white">{entry.action}</td>
                    <td className="px-4 py-2 text-neutral-500">{entry.targetClerkId ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-500">
                      {entry.details ? JSON.stringify(entry.details) : "—"}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(entry.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </AdminLayout>
  );
}
