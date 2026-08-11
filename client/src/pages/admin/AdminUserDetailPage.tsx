import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import { CoinIcon } from "../../components/CoinIcon";
import type { AdminCoinTransaction, AdminUserSummary } from "../../services/adminApi";

export function AdminUserDetailPage() {
  const { clerkId } = useParams<{ clerkId: string }>();
  const api = useAdminApi();
  const [account, setAccount] = useState<AdminUserSummary | null>(null);
  const [transactions, setTransactions] = useState<AdminCoinTransaction[]>([]);
  const [unlockedCount, setUnlockedCount] = useState(0);
  const [unlockedByCount, setUnlockedByCount] = useState(0);
  const [reasonDraft, setReasonDraft] = useState("");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    if (!clerkId) return;
    api.getUserDetail(clerkId).then((res) => {
      setAccount(res.account);
      setTransactions(res.coinTransactions);
      setUnlockedCount(res.unlockedCount);
      setUnlockedByCount(res.unlockedByCount);
    });
  }

  useEffect(load, [api, clerkId]);

  async function handleStatusAction(action: "suspend" | "ban" | "restore") {
    if (!clerkId) return;
    setBusy(true);
    setError(null);
    try {
      if (action === "suspend") await api.suspendUser(clerkId, reasonDraft || undefined);
      else if (action === "ban") await api.banUser(clerkId, reasonDraft || undefined);
      else await api.restoreUser(clerkId);
      setReasonDraft("");
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleAdjustCoins() {
    if (!clerkId) return;
    const amount = Number(adjustAmount);
    if (!Number.isFinite(amount) || amount === 0 || !adjustReason.trim()) {
      setError("Enter a non-zero amount and a reason");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await api.adjustCoins(clerkId, amount, adjustReason.trim());
      setAdjustAmount("");
      setAdjustReason("");
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  if (!account) {
    return (
      <AdminLayout>
        <p className="text-neutral-500">Loading…</p>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Link to="/admin/users" className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
        ← Back to users
      </Link>

      <h1 className="mt-2 text-2xl font-semibold text-neutral-900 dark:text-white">{account.email}</h1>
      <p className="text-sm text-neutral-400">{account.clerkId}</p>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Status" value={account.status} />
        <Stat label="Role" value={account.role} />
        <Stat
          label="Coins"
          value={
            <span className="inline-flex items-center gap-1">
              <CoinIcon /> {account.coinBalance}
            </span>
          }
        />
        <Stat label="Onboarding" value={account.onboardingStatus} />
        <Stat label="Unlocked by them" value={String(unlockedCount)} />
        <Stat label="Unlocked them" value={String(unlockedByCount)} />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Account actions</h2>
        <input
          type="text"
          value={reasonDraft}
          onChange={(e) => setReasonDraft(e.target.value)}
          placeholder="Reason (optional for suspend/ban)"
          className="mt-2 w-full max-w-sm rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => handleStatusAction("suspend")}
            disabled={busy || account.status === "suspended"}
            className="rounded-full bg-yellow-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Suspend
          </button>
          <button
            type="button"
            onClick={() => handleStatusAction("ban")}
            disabled={busy || account.status === "banned"}
            className="rounded-full bg-red-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Ban
          </button>
          <button
            type="button"
            onClick={() => handleStatusAction("restore")}
            disabled={busy || account.status === "active"}
            className="rounded-full bg-green-500 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Restore
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Adjust coins</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            type="number"
            value={adjustAmount}
            onChange={(e) => setAdjustAmount(e.target.value)}
            placeholder="Amount (+/-)"
            className="w-32 rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
          <input
            type="text"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
            placeholder="Reason (required)"
            className="flex-1 min-w-[12rem] rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
          />
          <button
            type="button"
            onClick={handleAdjustCoins}
            disabled={busy}
            className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Apply
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Coin transactions</h2>
        <div className="mt-2 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Reason / Related</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-neutral-400">
                    No transactions.
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t._id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">{t.type}</td>
                    <td className={`px-4 py-2 font-medium ${t.amount > 0 ? "text-green-600" : "text-red-600"}`}>
                      {t.amount > 0 ? "+" : ""}
                      {t.amount}
                    </td>
                    <td className="px-4 py-2 text-neutral-500">{t.reason ?? t.relatedClerkId ?? "—"}</td>
                    <td className="px-4 py-2 text-neutral-500">{new Date(t.createdAt).toLocaleString()}</td>
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

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-xl border border-neutral-200 p-3 dark:border-neutral-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900 dark:text-white">{value}</p>
    </div>
  );
}
