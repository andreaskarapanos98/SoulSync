import { useEffect, useState } from "react";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { AdminPaymentEvent } from "../../services/adminApi";

const STATUS_STYLES: Record<string, string> = {
  succeeded: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  failed: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  expired: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
};

function formatAmount(cents?: number, currency?: string) {
  if (cents === undefined) return "—";
  return new Intl.NumberFormat("en-IE", { style: "currency", currency: currency ?? "eur" }).format(cents / 100);
}

export function AdminPaymentsPage() {
  const api = useAdminApi();
  const [events, setEvents] = useState<AdminPaymentEvent[] | null>(null);
  const [status, setStatus] = useState<string | undefined>(undefined);

  useEffect(() => {
    api.listPayments({ status, limit: 50 }).then((res) => setEvents(res.events));
  }, [api, status]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Payments</h1>

      <div className="mt-4 flex gap-2">
        {[undefined, "succeeded", "failed", "expired"].map((s) => (
          <button
            key={s ?? "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize ${
              status === s
                ? "bg-brand-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {s ?? "all"}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Coins</th>
              <th className="px-4 py-2">Detail</th>
              <th className="px-4 py-2">Date</th>
            </tr>
          </thead>
          <tbody>
            {!events ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No payment events yet.
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e._id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{e.clerkId ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                    {formatAmount(e.amountCents, e.currency)}
                  </td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{e.coins ?? "—"}</td>
                  <td className="px-4 py-2 text-neutral-500">{e.failureReason ?? e.stripeEventType}</td>
                  <td className="px-4 py-2 text-neutral-500">{new Date(e.createdAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
