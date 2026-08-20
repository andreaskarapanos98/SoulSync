import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const LAST_UPDATED = "August 20, 2026";

export function LegalPageLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link to="/" className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
        ← Back home
      </Link>

      <h1 className="mt-4 text-3xl font-semibold text-neutral-900 dark:text-white">{title}</h1>
      <p className="mt-1 text-sm text-neutral-400">Last updated: {LAST_UPDATED}</p>

      <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        {children}
      </div>
    </div>
  );
}
