import type { MatchCardDTO } from "@soulsync/shared-types";
import { LogoMark } from "../Logo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function MatchCard({ match }: { match: MatchCardDTO }) {
  const location = [match.city, match.country].filter(Boolean).join(", ");

  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm shadow-brand-100/40 transition hover:shadow-md hover:shadow-brand-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
      <div className="relative aspect-[4/3] bg-brand-50 dark:bg-brand-950/20">
        {match.photoUrl ? (
          <img src={`${API_URL}${match.photoUrl}`} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <LogoMark size={40} className="opacity-40" />
          </div>
        )}
        <div className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/95 text-sm font-bold text-white shadow-md">
          {match.compatibility}%
        </div>
        {match.hasVoiceIntro && (
          <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            🎙️ Voice intro
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-neutral-900 dark:text-white">
          {match.firstName || "Someone new"}
          {match.age !== undefined && <span className="font-normal text-neutral-500"> · {match.age}</span>}
        </p>
        {location && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{location}</p>}
      </div>
    </div>
  );
}
