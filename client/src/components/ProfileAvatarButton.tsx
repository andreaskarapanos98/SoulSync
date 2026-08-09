import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useApi } from "../hooks/useApi";
import { LogoMark } from "./Logo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

// Shows the user's own profile photo (falling back to the app mark) instead of Clerk's
// generic avatar. Clicking it opens a small menu (Edit Profile / Sign Out) instead of
// opening Clerk's own account UI.
export function ProfileAvatarButton() {
  const api = useApi();
  const { signOut } = useClerk();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api
      .getProfile()
      .then((p) => {
        const photo = p.photos.find((ph) => ph.isPrimary) ?? p.photos[0];
        setPhotoUrl(photo ? `${API_URL}${photo.url}` : null);
      })
      .catch(() => {});
  }, [api]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Your account"
        className="block h-9 w-9 shrink-0 overflow-hidden rounded-full border border-brand-200 dark:border-neutral-700"
      >
        {photoUrl ? (
          <img src={photoUrl} alt="Your profile" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center bg-brand-50 dark:bg-brand-950/40">
            <LogoMark size={18} />
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          <Link
            to="/profile/edit"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Edit Profile
          </Link>
          <button
            type="button"
            onClick={() => signOut()}
            className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
