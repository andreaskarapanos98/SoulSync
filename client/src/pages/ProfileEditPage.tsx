import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { OwnProfileDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { PhotoUploader } from "../components/profile/PhotoUploader";
import { VoiceRecorder } from "../components/profile/VoiceRecorder";
import "./OnboardingAboutMePage.css";
import "./ProfileEditPage.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function ProfileEditPage() {
  const api = useApi();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<OwnProfileDTO | null>(null);
  const [bioDraft, setBioDraft] = useState("");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        setProfile(p);
        setBioDraft(p.bio);
      })
      .catch((err) => setLoadError(String(err)));
  }, []);

  if (loadError) return <p style={{ color: "crimson" }}>Couldn't load profile: {loadError}</p>;
  if (!profile) return <p>Loading your profile…</p>;

  async function handleSaveBio() {
    setSavingBio(true);
    try {
      const result = await api.saveBio(bioDraft);
      setProfile((prev) =>
        prev ? { ...prev, bio: bioDraft, missingRequired: result.missingRequired } : prev,
      );
    } finally {
      setSavingBio(false);
    }
  }

  async function handleUploadPhoto(file: File) {
    const result = await api.uploadPhoto(file);
    setProfile((prev) =>
      prev ? { ...prev, photos: result.photos, missingRequired: result.missingRequired } : prev,
    );
  }

  async function handleDeletePhoto(photoId: string) {
    const result = await api.deletePhoto(photoId);
    setProfile((prev) =>
      prev ? { ...prev, photos: result.photos, missingRequired: result.missingRequired } : prev,
    );
  }

  async function handleSetPrimaryPhoto(photoId: string) {
    const result = await api.setPrimaryPhoto(photoId);
    setProfile((prev) =>
      prev ? { ...prev, photos: result.photos, missingRequired: result.missingRequired } : prev,
    );
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

  const isComplete = profile.missingRequired.length === 0;

  return (
    <div className="onboarding-page profile-edit-page">
      <h2>Your Profile</h2>

      {!isComplete && (
        <p className="profile-missing">Still needed: {profile.missingRequired.join(", ")}</p>
      )}
      {isComplete && <p className="profile-complete">Your profile is complete!</p>}

      <section>
        <h3>Photos</h3>
        <PhotoUploader
          photos={profile.photos}
          onUpload={handleUploadPhoto}
          onDelete={handleDeletePhoto}
          onSetPrimary={handleSetPrimaryPhoto}
          onSetFocalPoint={handleSetFocalPoint}
        />
      </section>

      <section>
        <h3>Bio</h3>
        <textarea value={bioDraft} maxLength={500} rows={4} onChange={(e) => setBioDraft(e.target.value)} />
        <div className="step-nav">
          <span>{bioDraft.length}/500</span>
          <button type="button" onClick={handleSaveBio} disabled={savingBio}>
            {savingBio ? "Saving…" : "Save bio"}
          </button>
        </div>
      </section>

      <section>
        <h3>Voice Introduction</h3>
        <VoiceRecorder
          existingUrl={profile.voiceIntro ? `${API_URL}${profile.voiceIntro.url}` : null}
          onSave={handleSaveVoiceIntro}
          onDelete={handleDeleteVoiceIntro}
        />
      </section>

      <button type="button" onClick={() => navigate("/")}>
        Back home
      </button>
    </div>
  );
}
