import { useEffect, useRef, useState } from "react";

/**
 * Reports once when an element first scrolls into view, then stops observing — used to
 * trigger the landing page's reveal animations and the score bars filling in.
 *
 * Falls back to "visible" wherever IntersectionObserver isn't available, so content can
 * never end up permanently hidden behind a missing browser API.
 */
export function useInView<T extends HTMLElement>(rootMargin = "0px 0px -12% 0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setInView(true);
        observer.disconnect();
      },
      { rootMargin, threshold: 0.05 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView };
}
