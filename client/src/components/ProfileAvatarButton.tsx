import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useApi } from "../hooks/useApi";
import { LogoMark } from "./Logo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Shows the user's own profile photo (falling back to the app mark) instead of Clerk's
// generic avatar, and links straight to their profile edit page instead of opening
// Clerk's account UI.
export function ProfileAvatarButton() {
  const api = useApi();
  const { signOut } = useClerk();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        const photo = p.photos.find((ph) => ph.isPrimary) ?? p.photos[0];
        setPhotoUrl(photo ? `${API_URL}${photo.url}` : null);
      })
      .catch(() => {});
  }, [api]);

  return (
    <div className="flex items-center gap-3">
      <Link
        to="/profile/edit"
        title="Your profile"
        className="block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-brand-200 dark:border-neutral-700"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand-50 dark:bg-brand-950/40">
            <LogoMark size={18} />
          </span>
        )}
      </Link>
      <button
        type="button"
        onClick={() => signOut()}
        className="text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
      >
        Sign out
      </button>
    </div>
  );
}
