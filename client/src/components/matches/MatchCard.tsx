import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { MatchCardDTO, UnlockCostTierDTO } from "@soulsync/shared-types";
import { useApi } from "../../hooks/useApi";
import { useCoinBalance } from "../../hooks/useCoinBalance";
import { ApiError } from "../../services/api";
import { unlockCostForCompatibility } from "../../utils/unlockCost";
import { LogoMark } from "../Logo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function MatchCard({
  match,
  unlockCostTiers,
  onUnlocked,
}: {
  match: MatchCardDTO;
  unlockCostTiers: UnlockCostTierDTO[];
  onUnlocked: (clerkId: string) => void;
}) {
  const api = useApi();
  const { setBalance } = useCoinBalance();
  const unlockCost = unlockCostForCompatibility(match.compatibility, unlockCostTiers);
  const location = [match.city, match.country].filter(Boolean).join(", ");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockAnimating, setUnlockAnimating] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  function toggleVoiceIntro(e: React.MouseEvent) {
    e.preventDefault();
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else audio.play();
  }

  async function confirmUnlock() {
    setUnlocking(true);
    setUnlockError(null);
    try {
      const res = await api.unlockUser(match.clerkId);
      if (res.coinBalance !== undefined) setBalance(res.coinBalance);
      setConfirming(false);
      setUnlockAnimating(true);
      // Let the crack/pop-open animation play before swapping in the unlocked state.
      window.setTimeout(() => {
        setUnlockAnimating(false);
        onUnlocked(match.clerkId);
      }, 700);
    } catch (err) {
      setUnlockError(
        err instanceof ApiError && err.status === 402
          ? `You don't have enough coins for this. Unlocking costs ${unlockCost} coins.`
          : String(err),
      );
    } finally {
      setUnlocking(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm shadow-brand-100/40 transition hover:shadow-md hover:shadow-brand-200/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
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
        {match.voiceIntroUrl && (
          <>
            <audio
              ref={audioRef}
              src={`${API_URL}${match.voiceIntroUrl}`}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => setPlaying(false)}
            />
            <button
              type="button"
              onClick={toggleVoiceIntro}
              className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              {playing ? "⏸ Playing…" : "🎙️ Hear Me"}
            </button>
          </>
        )}
        {unlockAnimating ? (
          <div className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center">
            <span className="absolute animate-lock-crack-out text-xl">🔒</span>
            <span className="absolute animate-lock-pop-in text-xl">🔓</span>
          </div>
        ) : (
          !match.unlocked && (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              title="Unlock this profile"
              className="absolute bottom-2 right-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition hover:bg-black/70"
            >
              🔒
            </button>
          )
        )}
      </div>
      <div className="p-4">
        <p className="font-semibold text-neutral-900 dark:text-white">
          {match.firstName || "Someone new"}
          {match.age !== undefined && <span className="font-normal text-neutral-500"> · {match.age}</span>}
        </p>
        {location && <p className="mt-0.5 text-sm text-neutral-500 dark:text-neutral-400">{location}</p>}

        {match.unlocked && (
          <div className="mt-3 flex gap-2">
            <Link
              to={`/profiles/${match.clerkId}`}
              className="flex-1 rounded-full border border-brand-200 py-2 text-center text-sm font-medium text-brand-600 transition hover:bg-brand-50 dark:border-neutral-700 dark:text-brand-400 dark:hover:bg-neutral-800"
            >
              View Profile
            </Link>
            <Link
              to={`/chat/${match.clerkId}`}
              className="flex-1 rounded-full bg-brand-500 py-2 text-center text-sm font-semibold text-white hover:bg-brand-600"
            >
              Chat
            </Link>
          </div>
        )}
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !unlocking && setConfirming(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-neutral-900"
          >
            <p className="text-lg font-semibold text-neutral-900 dark:text-white">
              Unlock {match.firstName || "this profile"}?
            </p>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
              Unlocking lets you view their full profile and start a chat. Costs{" "}
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">🪙 {unlockCost}</span>.
            </p>
            {unlockError && (
              <p className="mt-3 text-sm text-red-600">
                {unlockError}{" "}
                <Link to="/coins" className="font-semibold underline">
                  Buy coins
                </Link>
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={unlocking}
                className="rounded-full border border-neutral-300 px-5 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmUnlock}
                disabled={unlocking}
                className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {unlocking ? "Unlocking…" : "Yes, unlock"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
