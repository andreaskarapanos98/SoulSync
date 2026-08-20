import { useEffect, useState } from "react";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { AdminReport } from "../../services/adminApi";

const STATUS_TABS = ["open", "reviewed", "dismissed", "all"] as const;

export function AdminReportsPage() {
  const api = useAdminApi();
  const [reports, setReports] = useState<AdminReport[] | null>(null);
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("open");

  function load() {
    api.listReports({ status: tab === "all" ? undefined : tab, limit: 50 }).then((res) => setReports(res.reports));
  }

  useEffect(load, [api, tab]);

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
          reports.map((r) => <ReportCard key={r._id} report={r} onChanged={load} />)
        )}
      </div>
    </AdminLayout>
  );
}

function ReportCard({ report: r, onChanged }: { report: AdminReport; onChanged: () => void }) {
  const api = useAdminApi();
  const [note, setNote] = useState(r.adminNote ?? "");
  const [days, setDays] = useState(7);
  const [permanent, setPermanent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);

  const noteDirty = note !== (r.adminNote ?? "");

  async function saveNote() {
    setBusy(true);
    try {
      await api.updateReportNote(r._id, note);
      setNoteSaved(true);
      window.setTimeout(() => setNoteSaved(false), 1500);
    } finally {
      setBusy(false);
    }
  }

  async function takeAction(outcome: "dismiss" | "chat_ban" | "account_ban") {
    setBusy(true);
    try {
      await api.takeReportAction(r._id, { outcome, days, permanent, note });
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-neutral-900 dark:text-white">
            {r.reason.replace(/_/g, " ")} — {r.contentType}
          </p>
          <p className="text-xs text-neutral-400">
            Reporter: {r.reporterEmail ?? r.reporterClerkId} · Reported: {r.reportedEmail ?? r.reportedClerkId}
          </p>
        </div>
        <span className="text-xs text-neutral-400">{new Date(r.createdAt).toLocaleString()}</span>
      </div>

      {r.reportedContent && (
        <p className="mt-2 rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:bg-neutral-950 dark:text-neutral-300">
          {r.reportedContent}
        </p>
      )}
      {r.details && <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">{r.details}</p>}

      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-neutral-400">Admin note</label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="What did you decide, and why?"
        className="mt-1 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
      />
      {noteDirty && (
        <button
          type="button"
          onClick={saveNote}
          disabled={busy}
          className="mt-1.5 rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-400"
        >
          {noteSaved ? "Saved ✓" : "Save note"}
        </button>
      )}

      {r.status === "open" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => takeAction("dismiss")}
            disabled={busy}
            className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-medium text-neutral-600 disabled:opacity-60 dark:border-neutral-700 dark:text-neutral-400"
          >
            Dismiss
          </button>

          <div className="flex items-center gap-1.5 rounded-full border border-yellow-300 px-2 py-1 dark:border-yellow-800">
            {!permanent && (
              <input
                type="number"
                min={1}
                value={days}
                onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
                className="w-12 bg-transparent text-xs text-neutral-700 focus:outline-none dark:text-neutral-300"
              />
            )}
            <label className="flex items-center gap-1 text-xs text-neutral-500 dark:text-neutral-400">
              <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} />
              permanent
            </label>
            <button
              type="button"
              onClick={() => takeAction("chat_ban")}
              disabled={busy}
              className="rounded-full bg-yellow-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
            >
              Chat ban{!permanent ? ` ${days}d` : ""}
            </button>
          </div>

          <button
            type="button"
            onClick={() => takeAction("account_ban")}
            disabled={busy}
            className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold text-white disabled:opacity-60"
          >
            Account ban
          </button>
        </div>
      ) : (
        <p className="mt-3 text-xs font-medium text-neutral-400">
          {r.status} by {r.reviewedByEmail ?? r.reviewedByClerkId} at{" "}
          {r.reviewedAt && new Date(r.reviewedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
