import type * as confetti from "canvas-confetti";

interface ParticlePreset {
  kind: "particles";
  /** Multiple bursts, staggered a bit apart — e.g. rose petals raining across the top. */
  bursts: confetti.Options[];
}

interface ChoreographedPreset {
  kind: "champagne-pop" | "ring-box";
}

export type GiftAnimationPreset = ParticlePreset | ChoreographedPreset;

function single(options: confetti.Options): ParticlePreset {
  return { kind: "particles", bursts: [options] };
}

/**
 * giftId -> animation preset. Gifts absent from this map (chocolates/teddy/bouquet, or
 * any future gift added without a bespoke entry) fall back to the generic particle-ring
 * burst in GiftAnimationOverlay — every gift always animates, this is just the opt-in
 * upgrade to something more specific.
 */
export const GIFT_ANIMATIONS: Record<string, GiftAnimationPreset> = {
  // Floats gently upward — negative gravity, narrow-ish cone.
  heart: single({ particleCount: 14, angle: 90, spread: 45, startVelocity: 10, gravity: -0.4, ticks: 220, scalar: 1.2 }),
  kiss: single({ particleCount: 12, angle: 90, spread: 25, startVelocity: 11, gravity: -0.5, ticks: 220, scalar: 1.2 }),
  flame: single({ particleCount: 16, angle: 90, spread: 30, startVelocity: 15, gravity: -0.6, ticks: 160, scalar: 1.1 }),

  // Bursts outward from center in every direction.
  hearts: single({ particleCount: 28, angle: 90, spread: 360, startVelocity: 22, gravity: 0.5, ticks: 180, scalar: 1.1 }),
  sparkles: single({ particleCount: 36, angle: 90, spread: 360, startVelocity: 14, gravity: 0.3, ticks: 130, scalar: 0.8 }),
  diamond: single({ particleCount: 24, angle: 90, spread: 360, startVelocity: 10, gravity: 0.2, ticks: 140, scalar: 0.9 }),

  // Fast, narrow, arcs downward like a shot arrow.
  cupid: single({ particleCount: 6, angle: 65, spread: 8, startVelocity: 48, gravity: 0.9, ticks: 120, scalar: 1.4 }),

  // Rains down from the top edge — several staggered bursts across the width read as a
  // procession rather than one clump falling in a single spot.
  rose: {
    kind: "particles",
    bursts: [0.2, 0.4, 0.6, 0.8].map((x) => ({
      particleCount: 6,
      angle: 270,
      spread: 40,
      startVelocity: 3,
      gravity: 1,
      ticks: 260,
      scalar: 1.3,
      origin: { x, y: -0.05 },
    })),
  },

  // Real multi-colored confetti pieces (no emoji shape) fired from both bottom corners —
  // reads better than a wall of repeated 🎉 glyphs for a "celebration" moment.
  confetti: {
    kind: "particles",
    bursts: [
      { particleCount: 45, angle: 60, spread: 65, startVelocity: 40, gravity: 0.9, ticks: 200, origin: { x: 0, y: 1 }, colors: ["#f43f5e", "#fda4af", "#fde68a", "#ffffff"] },
      { particleCount: 45, angle: 120, spread: 65, startVelocity: 40, gravity: 0.9, ticks: 200, origin: { x: 1, y: 1 }, colors: ["#f43f5e", "#fda4af", "#fde68a", "#ffffff"] },
    ],
  },

  champagne: { kind: "champagne-pop" },
  ring: { kind: "ring-box" },
};

/** True for the "confetti"/celebration gift — the one particle preset that intentionally uses real confetti pieces, not an emoji shape. */
export function usesRealConfettiPieces(giftId: string): boolean {
  return giftId === "confetti";
}
