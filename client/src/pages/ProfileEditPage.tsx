import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { OwnProfileDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { useProfilePhoto } from "../hooks/useProfilePhoto";
import { PhotoUploader } from "../components/profile/PhotoUploader";
import { VoiceRecorder } from "../components/profile/VoiceRecorder";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { CoinIcon } from "../components/CoinIcon";
import { ApiError } from "../services/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function ProfileEditPage() {
  const api = useApi();
  const navigate = useNavigate();
  const { refresh: refreshAvatarPhoto } = useProfilePhoto();
  const [profile, setProfile] = useState<OwnProfileDTO | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingBio, setSavingBio] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);
  const [startingVerification, setStartingVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [verificationInsufficientFunds, setVerificationInsufficientFunds] = useState(false);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        setBioDraft(p.bio);
      })
      .catch((err) => setLoadError(String(err)));
  }, []);

  if (loadError)
    return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load profile: {loadError}</p>;
  if (!profile) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading your profile…</p>;

  async function handleSaveBio() {
    setSavingBio(true);
    try {
      const result = await api.saveBio(bioDraft);
      setProfile((prev) =>
        prev ? { ...prev, bio: bioDraft, missingRequired: result.missingRequired } : prev,
      );
      setBioSaved(true);
      setTimeout(() => setBioSaved(false), 2500);
    } finally {
      setSavingBio(false);
    }
  }

  async function handleUploadPhoto(file: File) {
    const result = await api.uploadPhoto(file);
    setProfile((prev) =>
      prev ? { ...prev, photos: result.photos, missingRequired: result.missingRequired } : prev,
    );
    // The first photo uploaded becomes primary automatically — keep the header avatar in sync.
    refreshAvatarPhoto();
  }

  async function handleDeletePhoto(photoId: string) {
    const result = await api.deletePhoto(photoId);
    setProfile((prev) =>
      prev ? { ...prev, photos: result.photos, missingRequired: result.missingRequired } : prev,
    );
    // Deleting the primary photo promotes a different one — keep the header avatar in sync.
    refreshAvatarPhoto();
  }

  async function handleSetPrimaryPhoto(photoId: string) {
    const result = await api.setPrimaryPhoto(photoId);
    setProfile((prev) =>
      prev ? { ...prev, photos: result.photos, missingRequired: result.missingRequired } : prev,
    );
    refreshAvatarPhoto();
  }

  async function handleSetFocalPoint(photoId: string, x: number, y: number) {
    const result = await api.setPhotoFocalPoint(photoId, x, y);
    setProfile((prev) => (prev ? { ...prev, photos: result.photos } : prev));
  }

  async function handleSaveVoiceIntro(blob: Blob, durationSec: number) {
    const result = await api.uploadVoiceIntro(blob, durationSec);
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            voiceIntro: result.voiceIntro,
            missingRequired: result.missingRequired ?? prev.missingRequired,
          }
        : prev,
    );
  }

  async function handleDeleteVoiceIntro() {
    await api.deleteVoiceIntro();
    setProfile((prev) => (prev ? { ...prev, voiceIntro: null } : prev));
  }

  async function handleGetVerified() {
    setStartingVerification(true);
    setVerificationError(null);
    setVerificationInsufficientFunds(false);
    try {
      const { url } = await api.startVerification();
      window.location.href = url;
    } catch (err) {
      const insufficientFunds = err instanceof ApiError && err.status === 402;
      setVerificationInsufficientFunds(insufficientFunds);
      setVerificationError(
        insufficientFunds
          ? `You don't have enough coins for this. Verification costs ${profile?.verificationCostCoins ?? 60} coins.`
          : String(err),
      );
      setStartingVerification(false);
    }
  }

  const isComplete = profile.missingRequired.length === 0;

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Your Profile</h2>

      {!isComplete && (
        <p className="mt-2 text-sm text-brand-600 dark:text-brand-400">
          Still needed: {profile.missingRequired.join(", ")}
        </p>
      )}
      {isComplete && (
        <p className="mt-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Your profile is complete!
        </p>
      )}

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Photos</h3>
        <PhotoUploader
          photos={profile.photos}
          onUpload={handleUploadPhoto}
          onDelete={handleDeletePhoto}
          onSetPrimary={handleSetPrimaryPhoto}
          onSetFocalPoint={handleSetFocalPoint}
        />
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Bio</h3>
        <textarea
          value={bioDraft}
          maxLength={500}
          rows={4}
          onChange={(e) => setBioDraft(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 bg-white p-3 text-sm text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:ring-brand-900"
        />
        <div className="mt-2 flex items-center justify-end gap-3">
          {bioSaved && (
            <span className="text-sm font-medium text-green-600 dark:text-green-400">Saved ✓</span>
          )}
          <span className="text-xs text-neutral-500">{bioDraft.length}/500</span>
          <button
            type="button"
            onClick={handleSaveBio}
            disabled={savingBio}
            className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {savingBio ? "Saving…" : "Save bio"}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Voice Introduction</h3>
        <VoiceRecorder
          existingUrl={profile.voiceIntro ? `${API_URL}${profile.voiceIntro.url}` : null}
          onSave={handleSaveVoiceIntro}
          onDelete={handleDeleteVoiceIntro}
        />
      </section>

      <section className="mt-8">
        <h3 className="mb-3 text-sm font-semibold text-neutral-900 dark:text-white">Verification</h3>
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          {profile.verificationStatus === "verified" && (
            <p className="flex items-center gap-2 text-sm font-medium text-neutral-700 dark:text-neutral-300">
              <VerifiedBadge /> You're verified
            </p>
          )}

          {profile.verificationStatus === "pending" && (
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Verification in progress — this can take a few minutes.
              </p>
              <button
                type="button"
                onClick={handleGetVerified}
                disabled={startingVerification}
                className="mt-2 text-xs text-neutral-400 underline hover:text-neutral-600 disabled:opacity-50 dark:hover:text-neutral-300"
              >
                Still stuck? Start a new verification
              </button>
            </div>
          )}

          {(profile.verificationStatus === "unverified" || profile.verificationStatus === "failed") && (
            <div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                {profile.verificationStatus === "failed"
                  ? "That attempt didn't succeed — you can try again."
                  : "Verify your identity to show a badge on your profile and build trust with matches."}
                {profile.verificationPaid && " You've already paid, so this is free."}
              </p>
              <button
                type="button"
                onClick={handleGetVerified}
                disabled={startingVerification}
                className="mt-3 flex items-center gap-1.5 rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {startingVerification ? (
                  "Redirecting…"
                ) : profile.verificationPaid ? (
                  "Try Again"
                ) : (
                  <>
                    Get Verified — <CoinIcon /> {profile.verificationCostCoins}
                  </>
                )}
              </button>
            </div>
          )}

          {verificationError && (
            <p className="mt-3 text-sm text-red-600">
              {verificationError}{" "}
              {verificationInsufficientFunds && (
                <Link to="/coins" className="font-semibold underline">
                  Buy coins
                </Link>
              )}
            </p>
          )}
        </div>
      </section>

      <button
        type="button"
        onClick={() => navigate("/")}
        className="mt-10 rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
      >
        Back home
      </button>
    </div>
  );
}
