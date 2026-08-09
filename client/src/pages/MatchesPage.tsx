import { useEffect, useState } from "react";
import type { MatchesResponseDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { MatchCard } from "../components/matches/MatchCard";

type Tab = "yourSoulmates" | "theirSoulmate";

const TABS: { key: Tab; label: string; blurb: string }[] = [
  { key: "yourSoulmates", label: "Your Soulmates", blurb: "People who fit what you're looking for." },
  { key: "theirSoulmate", label: "You're Their Soulmate", blurb: "People you fit what they're looking for." },
];

export function MatchesPage() {
  const api = useApi();
  const [matches, setMatches] = useState<MatchesResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("yourSoulmates");

  useEffect(() => {
    api.getMatches().then(setMatches).catch((err) => setError(String(err)));
  }, [api]);

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load matches: {error}</p>;
  if (!matches) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Finding your matches…</p>;

  const list = matches[tab];
  const activeTab = TABS.find((t) => t.key === tab)!;

  function handleUnlocked(clerkId: string) {
    setMatches((prev) => {
      if (!prev) return prev;
      const markUnlocked = (list: typeof prev.yourSoulmates) =>
        list.map((m) => (m.clerkId === clerkId ? { ...m, unlocked: true } : m));
      return { yourSoulmates: markUnlocked(prev.yourSoulmates), theirSoulmate: markUnlocked(prev.theirSoulmate) };
    });
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Matches</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Compatibility is calculated from your questionnaire, deal breakers, and theirs — both ways.
      </p>

      <div className="mt-6 flex gap-2 rounded-full bg-brand-50 p-1 dark:bg-neutral-900">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === t.key
                ? "bg-white text-brand-600 shadow-sm dark:bg-neutral-800 dark:text-brand-400"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{activeTab.blurb}</p>

      {list.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-200 py-16 text-center dark:border-neutral-800">
          <span className="text-3xl">💌</span>
          <p className="text-neutral-600 dark:text-neutral-400">No matches here yet — check back soon.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((m) => (
            <MatchCard key={m.clerkId} match={m} onUnlocked={handleUnlocked} />
          ))}
        </div>
      )}
    </div>
  );
}
