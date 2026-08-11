import { useEffect } from "react";

const PARTICLE_COUNT = 10;
const AUTO_DISMISS_MS = 2500;

export function GiftAnimationOverlay({ emoji, label, onDone }: { emoji: string; label: string; onDone: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDone, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i;
    const delay = 0.25 + (i % 3) * 0.07;
    return { angle, delay };
  });

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <div className="relative flex h-64 w-64 items-center justify-center">
        {particles.map((p, i) => (
          <span
            key={i}
            className="animate-gift-particle-burst absolute text-3xl"
            style={
              {
                "--particle-angle": `${p.angle}deg`,
                animationDelay: `${p.delay}s`,
              } as React.CSSProperties
            }
          >
            {emoji}
          </span>
        ))}
        <div className="animate-gift-pop-in flex flex-col items-center gap-2">
          <span className="text-7xl drop-shadow-lg">{emoji}</span>
          <span className="rounded-full bg-white/90 px-4 py-1 text-sm font-semibold text-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-100">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}
