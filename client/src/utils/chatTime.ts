// Date/grouping helpers for the chat thread. Kept pure (no React, no Date.now() baked in
// where it can be passed) so the day-boundary logic is testable on its own.

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

export function isSameDay(aIso: string, bIso: string): boolean {
  return startOfDay(new Date(aIso)) === startOfDay(new Date(bIso));
}

/** "Today" / "Yesterday" / "Mon, 12 Sep" / "12 Sep 2025" for anything outside this year. */
export function dayLabel(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const dayDiff = Math.round((startOfDay(now) - startOfDay(date)) / 86_400_000);
  if (dayDiff === 0) return "Today";
  if (dayDiff === 1) return "Yesterday";
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  }
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

/** Clock time in the viewer's own locale/timezone, e.g. "14:32" or "2:32 PM". */
export function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

const GROUP_WINDOW_MS = 5 * 60 * 1000;

/**
 * Whether a message should visually attach to the one above it (same sender, close in
 * time) — tighter spacing, and only the last of the run carries a timestamp, the way
 * every mainstream chat app renders a burst of consecutive messages.
 */
export function groupsWithPrevious(
  previous: { fromClerkId: string; createdAt: string } | undefined,
  current: { fromClerkId: string; createdAt: string },
): boolean {
  if (!previous) return false;
  if (previous.fromClerkId !== current.fromClerkId) return false;
  if (!isSameDay(previous.createdAt, current.createdAt)) return false;
  return new Date(current.createdAt).getTime() - new Date(previous.createdAt).getTime() < GROUP_WINDOW_MS;
}
