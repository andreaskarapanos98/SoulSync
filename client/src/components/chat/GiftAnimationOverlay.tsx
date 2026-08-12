import { useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { GIFT_ANIMATIONS, usesRealConfettiPieces } from "../../utils/giftAnimations";

const PARTICLE_COUNT = 10;
const AUTO_DISMISS_MS = 2500;
const CHOREOGRAPHED_DISMISS_MS = 3200;

// shapeFromText re-renders the emoji to an offscreen canvas — cheap, but no reason to
// redo it every time the same gift is opened again in this tab.
const shapeCache = new Map<string, confetti.Shape>();
function shapeFor(emoji: string): confetti.Shape {
  let shape = shapeCache.get(emoji);
  if (!shape) {
    shape = confetti.shapeFromText({ text: emoji });
    shapeCache.set(emoji, shape);
  }
  return shape;
}

export function GiftAnimationOverlay({
  giftId,
  emoji,
  label,
  onDone,
}: {
  giftId: string;
  emoji: string;
  label: string;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const preset = GIFT_ANIMATIONS[giftId];
  const choreographed = preset?.kind === "champagne-pop" || preset?.kind === "ring-box";

  useEffect(() => {
    const timer = window.setTimeout(onDone, choreographed ? CHOREOGRAPHED_DISMISS_MS : AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDone]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const instance = confetti.create(canvasRef.current, { resize: true });

    if (preset?.kind === "particles") {
      const shape = usesRealConfettiPieces(giftId) ? undefined : shapeFor(emoji);
      preset.bursts.forEach((options, i) => {
        window.setTimeout(() => {
          instance({ ...options, ...(shape ? { shapes: [shape] } : {}) });
        }, i * 150);
      });
    } else if (preset?.kind === "champagne-pop") {
      const fizz = GIFT_ANIMATIONS.sparkles;
      if (fizz.kind === "particles") {
        window.setTimeout(() => {
          fizz.bursts.forEach((options) => instance({ ...options, shapes: [shapeFor("✨")], origin: { x: 0.5, y: 0.62 } }));
        }, 350);
      }
    }

    return () => instance.reset();
  }, [preset, giftId, emoji]);

  return (
    <div
      onClick={onDone}
      className="fixed inset-0 z-50 flex cursor-pointer items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-40" />
      <div className="relative flex h-64 w-64 items-center justify-center">
        {preset?.kind === "champagne-pop" ? (
          <ChampagnePop label={label} />
        ) : preset?.kind === "ring-box" ? (
          <RingBox label={label} />
        ) : (
          <GenericBurst emoji={emoji} label={label} />
        )}
      </div>
    </div>
  );
}

function GenericBurst({ emoji, label }: { emoji: string; label: string }) {
  const particles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    angle: (360 / PARTICLE_COUNT) * i,
    delay: 0.25 + (i % 3) * 0.07,
  }));
  return (
    <>
      {particles.map((p, i) => (
        <span
          key={i}
          className="animate-gift-particle-burst absolute text-3xl"
          style={{ "--particle-angle": `${p.angle}deg`, animationDelay: `${p.delay}s` } as React.CSSProperties}
        >
          {emoji}
        </span>
      ))}
      <div className="animate-gift-pop-in flex flex-col items-center gap-2">
        <span className="text-7xl drop-shadow-lg">{emoji}</span>
        <GiftLabel label={label} />
      </div>
    </>
  );
}

function ChampagnePop({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <span className="animate-champagne-wobble absolute inset-0 flex items-center justify-center text-7xl drop-shadow-lg">
          🍾
        </span>
        <span className="animate-cork-fly absolute left-1/2 top-2 text-xl" style={{ animationDelay: "0.35s" }}>
          🟤
        </span>
      </div>
      <span className="animate-gift-pop-in" style={{ animationDelay: "0.35s", opacity: 0, animationFillMode: "forwards" }}>
        <GiftLabel label={label} />
      </span>
    </div>
  );
}

function RingBox({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative h-20 w-24" style={{ perspective: "400px" }}>
        <div className="absolute bottom-0 h-11 w-24 rounded-b-lg bg-brand-500 shadow-lg" />
        <div
          className="animate-ring-box-lid-open absolute top-0 h-9 w-24 rounded-t-lg bg-brand-600"
          style={{ transformOrigin: "bottom", transformStyle: "preserve-3d" }}
        />
        <div
          className="animate-ring-pop-in absolute inset-0 flex items-center justify-center text-4xl"
          style={{ animationDelay: "0.35s", opacity: 0, animationFillMode: "forwards" }}
        >
          💍
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg">
          <div
            className="animate-ring-shine-sweep absolute inset-y-0 w-8 bg-gradient-to-r from-transparent via-white/70 to-transparent"
            style={{ animationDelay: "0.9s", opacity: 0, animationFillMode: "forwards" }}
          />
        </div>
      </div>
      <span className="animate-gift-pop-in" style={{ animationDelay: "0.35s", opacity: 0, animationFillMode: "forwards" }}>
        <GiftLabel label={label} />
      </span>
    </div>
  );
}

function GiftLabel({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/90 px-4 py-1 text-sm font-semibold text-neutral-800 dark:bg-neutral-900/90 dark:text-neutral-100">
      {label}
    </span>
  );
}
