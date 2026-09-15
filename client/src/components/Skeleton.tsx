/**
 * Placeholder block for content that's still loading. A shape that matches what's coming
 * reads as "nearly there" and keeps the page from jumping once it lands, which a centred
 * "Loading…" line does neither of.
 */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-skeleton-pulse rounded-lg bg-neutral-200 dark:bg-neutral-800 ${className}`} />;
}

/** Row placeholder for list screens (conversations, matches) — avatar + two lines. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-neutral-100 p-3 dark:border-neutral-800">
      <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-3.5 w-32" />
        <Skeleton className="h-3 w-48 max-w-full" />
      </div>
    </div>
  );
}

/** Card placeholder for the match grid — image area plus a name line. */
export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 dark:border-neutral-800">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  );
}
