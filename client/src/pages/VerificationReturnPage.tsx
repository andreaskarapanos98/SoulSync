import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { VerificationStatus } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { VerifiedBadge } from "../components/VerifiedBadge";

const POLL_INTERVAL_MS = 4000;
const SLOW_AFTER_MS = 75000;

export function VerificationReturnPage() {
  const api = useApi();
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [slow, setSlow] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    function poll() {
      api
        .getMe()
        .then((me) => {
          setStatus(me.verificationStatus);
          if (Date.now() - startedAtRef.current > SLOW_AFTER_MS) setSlow(true);
        })
        .catch((err) => setError(String(err)));
    }
    poll();
    const interval = window.setInterval(poll, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRetry() {
    setRetrying(true);
    try {
      const { url } = await api.startVerification();
      window.location.href = url;
    } catch (err) {
      setError(String(err));
      setRetrying(false);
    }
  }

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't check verification status: {error}</p>;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      {(status === null || status === "pending") && (
        <>
          <span className="text-4xl">🔎</span>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">Checking your documents…</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">This usually takes under a minute.</p>
          {slow && (
            <p className="mt-4 text-sm text-neutral-400">
              This is taking longer than usual — occasionally manual review is needed. We'll notify you the moment it's done.
            </p>
          )}
        </>
      )}

      {status === "verified" && (
        <>
          <span className="text-4xl">🎉</span>
          <h1 className="mt-4 flex items-center gap-2 text-2xl font-semibold text-neutral-900 dark:text-white">
            <VerifiedBadge size={28} /> You're verified!
          </h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">The checkmark now shows on your profile.</p>
        </>
      )}

      {status === "failed" && (
        <>
          <span className="text-4xl">😕</span>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">We couldn't verify you this time</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">
            This can happen if the document photo wasn't clear enough. You can try again.
          </p>
          <button
            type="button"
            onClick={handleRetry}
            disabled={retrying}
            className="mt-6 rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {retrying ? "Redirecting…" : "Try again"}
          </button>
        </>
      )}

      {status === "unverified" && (
        <>
          <span className="text-4xl">🤔</span>
          <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">No verification in progress</h1>
          <p className="mt-2 text-neutral-500 dark:text-neutral-400">Head back to your profile to get started.</p>
        </>
      )}

      <Link
        to="/profile/edit"
        className="mt-8 rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        Back to profile
      </Link>
    </div>
  );
}
