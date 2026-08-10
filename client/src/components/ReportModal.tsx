import { useState } from "react";
import type { ReportContentType, ReportReason } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "inappropriate_content", label: "Inappropriate content" },
  { value: "harassment", label: "Harassment or abuse" },
  { value: "fake_profile", label: "Fake profile" },
  { value: "spam", label: "Spam" },
  { value: "underage", label: "Underage user" },
  { value: "other", label: "Other" },
];

export function ReportModal({
  reportedClerkId,
  contentType,
  contentRef,
  onClose,
}: {
  reportedClerkId: string;
  contentType: ReportContentType;
  contentRef?: string;
  onClose: () => void;
}) {
  const api = useApi();
  const [reason, setReason] = useState<ReportReason>("inappropriate_content");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      await api.createReport({ reportedClerkId, contentType, contentRef, reason, details: details.trim() || undefined });
      setDone(true);
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
      >
        {done ? (
          <>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">Report submitted</p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Thanks — our team will review it. You can keep using SoulSync as normal.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full rounded-full bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
            >
              Done
            </button>
          </>
        ) : (
          <>
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">Report {contentType}</p>
            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-400">Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              className="mt-1 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-white"
            />
            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-full bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {submitting ? "Submitting…" : "Submit report"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
