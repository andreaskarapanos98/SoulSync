import { LogoMark } from "./Logo";

/**
 * Shown while a lazily-loaded route's chunk is in flight (see App.tsx). Deliberately
 * quiet — a route chunk usually lands in well under a second, so a heavy loading screen
 * would flash more than it reassures.
 */
export function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24" role="status" aria-label="Loading">
      <span className="animate-skeleton-pulse">
        <LogoMark size={32} />
      </span>
    </div>
  );
}
