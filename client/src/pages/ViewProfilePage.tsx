import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ProfileDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { LogoMark } from "../components/Logo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function ViewProfilePage() {
  const { clerkId } = useParams<{ clerkId: string }>();
  const api = useApi();
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clerkId) return;
    api.getPublicProfile(clerkId).then(setProfile).catch((err) => setError(String(err)));
  }, [api, clerkId]);

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load profile: {error}</p>;
  if (!profile) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading profile…</p>;

  const primaryPhoto = profile.photos.find((p) => p.isPrimary) ?? profile.photos[0];
  const location = [profile.city, profile.country].filter(Boolean).join(", ");

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <Link to="/matches" className="text-sm text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
        ← Back to matches
      </Link>

      <div className="mt-4 overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-sm shadow-brand-100/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
        <div className="relative aspect-[4/3] bg-brand-50 dark:bg-brand-950/20">
          {primaryPhoto ? (
            <img src={`${API_URL}${primaryPhoto.url}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <LogoMark size={48} className="opacity-40" />
            </div>
          )}
        </div>

        {profile.photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto p-3">
            {profile.photos.map((p) => (
              <img
                key={p.id}
                src={`${API_URL}${p.url}`}
                alt=""
                className="h-16 w-16 shrink-0 rounded-lg object-cover"
              />
            ))}
          </div>
        )}

        <div className="p-6">
          <h1 className="text-xl font-semibold text-neutral-900 dark:text-white">
            {profile.firstName || "Someone"}
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

          {profile.traits.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">About</p>
              <div className="flex flex-wrap gap-2">
                {profile.traits.map((t) => (
                  <span
                    key={t.key}
                    className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 dark:bg-brand-950/40 dark:text-brand-300"
                  >
                    {t.label}: {Array.isArray(t.value) ? t.value.join(", ") : String(t.value)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-neutral-100 p-4 dark:border-neutral-800">
          <Link
            to={`/chat/${clerkId}`}
            className="flex-1 rounded-full bg-brand-500 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-600"
          >
            💬 Message
          </Link>
        </div>
      </div>
    </div>
  );
}
