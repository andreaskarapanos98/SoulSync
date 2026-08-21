import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { useApi } from "../hooks/useApi";
import { useProfilePhoto } from "../hooks/useProfilePhoto";
import { DefaultAvatarIcon } from "./DefaultAvatarIcon";

// Shows the user's own profile photo (falling back to the app mark) instead of Clerk's
// generic avatar. Clicking it opens a small menu (View Profile / Edit Profile / Sign
// Out) instead of opening Clerk's own account UI. Photo comes from the shared
// ProfilePhotoProvider so it updates the moment ProfileEditPage changes the primary
// photo, instead of only on next mount/refresh.
export function ProfileAvatarButton({ openUpward = false }: { openUpward?: boolean }) {
  const { userId } = useAuth();
  const { signOut } = useClerk();
  const { photoUrl } = useProfilePhoto();
  const api = useApi();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // AdminNavLink is desktop-only (hidden on the mobile tab bar), and the wrapped native
  // app has no address bar to type /admin into — this is the only way to reach it there.
  useEffect(() => {
    api.getMe().then((me) => setIsAdmin(me.isAdmin)).catch(() => {});
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
            <DefaultAvatarIcon size={20} />
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 w-44 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900 ${
            openUpward ? "bottom-full mb-2" : "mt-2"
          }`}
        >
          {userId && (
            <Link
              to={`/profiles/${userId}`}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              👤 View Profile
            </Link>
          )}
          <Link
            to="/profile/edit"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            ✏️ Edit Profile
          </Link>
          <Link
            to="/"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            💕 Questionnaires
          </Link>
          <Link
            to="/account"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            ⚙️ Account Settings
          </Link>
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
            >
              🛠️ Admin
            </Link>
          )}
          <button
            type="button"
            onClick={() => signOut()}
            className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            🚪 Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
