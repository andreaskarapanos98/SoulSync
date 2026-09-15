// Placeholder bubbles for the thread's first load. A skeleton that matches the real
// layout reads as "this is nearly here" rather than the blank "Loading chat…" line it
// replaces, and it stops the header/composer from jumping into place a moment later.
const ROWS = [
  { mine: false, width: "w-40" },
  { mine: true, width: "w-28" },
  { mine: false, width: "w-56" },
  { mine: true, width: "w-44" },
  { mine: false, width: "w-32" },
];

export function ChatSkeleton() {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden px-4 py-6 sm:px-0" aria-hidden>
      {ROWS.map((row, i) => (
        <div key={i} className={`flex ${row.mine ? "justify-end" : "justify-start"}`}>
          <div
            className={`animate-skeleton-pulse h-9 ${row.width} rounded-2xl ${
              row.mine ? "bg-brand-200 dark:bg-brand-950/50" : "bg-neutral-200 dark:bg-neutral-800"
            }`}
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        </div>
      ))}
    </div>
  );
}
