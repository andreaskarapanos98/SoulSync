import type { ReactNode } from "react";
import { useInView } from "../hooks/useInView";

/**
 * Lifts its children into place the first time they're scrolled to. `delay` staggers
 * siblings (a grid of cards arriving one after another reads as deliberate, where all of
 * them at once reads as a page-load flash).
 *
 * Under prefers-reduced-motion the animation is switched off in CSS and the opacity-0 is
 * dropped the moment the element is in view, so the content still simply appears.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={`${inView ? "animate-reveal-up" : "opacity-0"} ${className}`}
      style={inView && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
