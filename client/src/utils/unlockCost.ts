import type { UnlockCostTierDTO } from "@soulsync/shared-types";

// Mirrors the lookup in server/src/services/coinService.ts's unlockCostForCompatibility —
// tiers must be ordered highest-to-lowest minCompatibility for the first match to win.
export function unlockCostForCompatibility(compatibility: number, tiers: UnlockCostTierDTO[]): number {
  const tier = tiers.find((t) => compatibility >= t.minCompatibility);
  return tier?.coins ?? tiers[tiers.length - 1]?.coins ?? 0;
}
