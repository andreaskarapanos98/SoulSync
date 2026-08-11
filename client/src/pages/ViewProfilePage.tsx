import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { ProfileDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { PhotoCarousel } from "../components/profile/PhotoCarousel";
import { CompatibilityBreakdown } from "../components/profile/CompatibilityBreakdown";
import { ReportModal } from "../components/ReportModal";
import { VerifiedBadge } from "../components/VerifiedBadge";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function ViewProfilePage() {
  const { clerkId } = useParams<{ clerkId: string }>();
  const api = useApi();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!clerkId) return;
    api.getPublicProfile(clerkId).then(setProfile).catch((err) => setError(String(err)));
  }, [api, clerkId]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleBlock() {
    if (!clerkId) return;
    if (!window.confirm("Block this person? They won't be able to message you and won't appear in your matches.")) return;
    setBlocking(true);
    try {
      await api.blockUser(clerkId);
      navigate("/matches");
    } finally {
      setBlocking(false);
    }
  }

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load profile: {error}</p>;
  if (!profile) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading profile…</p>;

  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <div className="flex items-center justify-between">
        <Link to="/matches" className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
          ← Back to matches
        </Link>

        {clerkId && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              title="More options"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setReporting(true);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  🚩 Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleBlock();
                  }}
                  disabled={blocking}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-50 disabled:opacity-50 dark:hover:bg-neutral-800"
                >
                  🚫 Block
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {reporting && clerkId && (
        <ReportModal reportedClerkId={clerkId} contentType="profile" onClose={() => setReporting(false)} />
      )}

      <div className="mt-4 overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm shadow-brand-100/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
        <PhotoCarousel
          photos={profile.photos}
          badge={
            profile.compatibility !== undefined && (
              <div className="absolute right-2 top-2 flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/95 text-sm font-bold text-white shadow-md">
                {profile.compatibility}%
              </div>
            )
          }
        />

        <div className="p-6">
          <h1 className="flex items-center gap-1.5 text-xl font-semibold text-neutral-900 dark:text-white">
            {profile.firstName || "Someone"}
            {profile.verified && <VerifiedBadge size={18} />}
            {profile.age !== undefined && <span className="font-normal text-neutral-500"> · {profile.age}</span>}
          </h1>
          {location && <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{location}</p>}
          {profile.occupation && (
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{profile.occupation}</p>
          )}

          {profile.bio && (
            <p className="mt-4 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{profile.bio}</p>
          )}

          {profile.voiceIntro && (
            <div className="mt-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">Voice intro</p>
              <audio controls src={`${API_URL}${profile.voiceIntro.url}`} className="w-full" />
            </div>
          )}

          {profile.compatibilityByCategory && profile.compatibilityByCategory.length > 0 && (
            <div className="mt-6">
              <CompatibilityBreakdown items={profile.compatibilityByCategory} />
            </div>
          )}

          {profile.locked && (
            <p className="mt-4 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-700 dark:bg-brand-950/30 dark:text-brand-300">
              🔒 Unlock this profile from the matches page to see their full bio, photos, and start chatting.
            </p>
          )}
        </div>

        <div className="flex gap-3 border-t border-neutral-100 p-4 dark:border-neutral-800">
          {profile.locked ? (
            <Link
              to="/matches"
              className="flex-1 rounded-full bg-brand-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-600"
            >
              🔒 Go unlock
            </Link>
          ) : (
            <Link
              to={`/chat/${clerkId}`}
              className="flex-1 rounded-full bg-brand-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-600"
            >
              💬 Message
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
