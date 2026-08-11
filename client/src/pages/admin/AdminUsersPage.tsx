import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { CoinIcon } from "../../components/CoinIcon";
import type { AdminUserSummary } from "../../services/adminApi";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400",
  suspended: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  banned: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  deleted: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

export function AdminUsersPage() {
  const api = useAdminApi();
  const [users, setUsers] = useState<AdminUserSummary[] | null>(null);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    api.listUsers({ search: search || undefined, page, limit }).then((res) => {
      setUsers(res.users);
      setTotal(res.total);
    });
  }, [api, search, page]);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Users</h1>

      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
        placeholder="Search by email or Clerk ID…"
        className="mt-4 w-full max-w-sm rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Role</th>
              <th className="px-4 py-2">Coins</th>
              <th className="px-4 py-2">Onboarding</th>
              <th className="px-4 py-2">Joined</th>
            </tr>
          </thead>
          <tbody>
            {!users ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.clerkId} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                  <td className="px-4 py-2">
                    <Link to={`/admin/users/${u.clerkId}`} className="text-brand-600 hover:underline dark:text-brand-400">
                      {u.email || u.clerkId}
                    </Link>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[u.status]}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{u.role}</td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                    <span className="inline-flex items-center gap-1">
                      <CoinIcon /> {u.coinBalance}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{u.onboardingStatus}</td>
                  <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-neutral-500">
        <span>
          {total} user{total === 1 ? "" : "s"}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-neutral-300 px-3 py-1 disabled:opacity-40 dark:border-neutral-700"
          >
            Prev
          </button>
          <button
            type="button"
            onClick={() => setPage((p) => p + 1)}
            disabled={page * limit >= total}
            className="rounded-lg border border-neutral-300 px-3 py-1 disabled:opacity-40 dark:border-neutral-700"
          >
            Next
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
