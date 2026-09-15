import { Link, useNavigate } from "react-router-dom";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-24 text-center">
      <span className="text-5xl">🧭</span>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">This page doesn't exist</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        The link may be out of date, or the page may have moved.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
        >
          Go back
        </button>
        <SignedIn>
          <Link
            to="/matches"
            className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Back to your matches
          </Link>
        </SignedIn>
        <SignedOut>
          <Link
            to="/"
            className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Back to home
          </Link>
        </SignedOut>
      </div>
    </div>
  );
}
