import { useEffect, useState } from "react";
import type { MatchesResponseDTO, UnlockCostTierDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { MatchCard } from "../components/matches/MatchCard";

const DEFAULT_UNLOCK_COST_TIERS: UnlockCostTierDTO[] = [
  { minCompatibility: 100, coins: 300 },
  { minCompatibility: 98, coins: 200 },
  { minCompatibility: 95, coins: 160 },
  { minCompatibility: 90, coins: 130 },
  { minCompatibility: 80, coins: 100 },
  { minCompatibility: 70, coins: 70 },
  { minCompatibility: 60, coins: 50 },
  { minCompatibility: 0, coins: 25 },
];

type Filter = "matches" | "unlocked";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "matches", label: "Matches" },
  { key: "unlocked", label: "Unlocked" },
];

export function MatchesPage() {
  const api = useApi();
  const [matches, setMatches] = useState<MatchesResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("matches");
  const [unlockCostTiers, setUnlockCostTiers] = useState<UnlockCostTierDTO[]>(DEFAULT_UNLOCK_COST_TIERS);

  useEffect(() => {
    api
      .getMatches()
      .then((res) => {
        setMatches(res);
        if (res.yourSoulmates.length > 0) api.trackEvent("match_viewed");
      })
      .catch((err) => setError(String(err)));
    api.getCoinPackages().then((res) => setUnlockCostTiers(res.unlockCostTiers)).catch(() => {});
  }, [api]);

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load matches: {error}</p>;
  if (!matches) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Finding your matches…</p>;

  // Unlocking moves someone out of Matches and into Unlocked — the two lists never overlap.
  const list = matches.yourSoulmates.filter((m) => (filter === "unlocked" ? m.unlocked : !m.unlocked));

  function handleUnlocked(clerkId: string) {
    setMatches((prev) =>
      prev
        ? { ...prev, yourSoulmates: prev.yourSoulmates.map((m) => (m.clerkId === clerkId ? { ...m, unlocked: true } : m)) }
        : prev,
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Matches</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">People who fit what you're looking for.</p>

      <div className="mt-6 flex gap-2 rounded-full bg-brand-50 p-1 dark:bg-neutral-900">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              filter === f.key
                ? "bg-white text-brand-600 shadow-sm dark:bg-neutral-800 dark:text-brand-400"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-200 py-16 text-center dark:border-neutral-800">
          <span className="text-3xl">💌</span>
          <p className="text-neutral-600 dark:text-neutral-400">
            {filter === "unlocked"
              ? "You haven't unlocked anyone yet — unlock a match to start chatting."
              : "No new matches here yet — check back soon."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MatchCard key={m.clerkId} match={m} perspective="yourSoulmates" unlockCostTiers={unlockCostTiers} onUnlocked={handleUnlocked} />
          ))}
        </div>
      )}
    </div>
  );
}
