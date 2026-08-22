import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { useApi } from "./useApi";
import { mediaUrl } from "../utils/mediaUrl";

interface ProfilePhotoContextValue {
  photoUrl: string | null;
  refresh: () => void;
}

const ProfilePhotoContext = createContext<ProfilePhotoContextValue>({ photoUrl: null, refresh: () => {} });

export function ProfilePhotoProvider({ children }: { children: ReactNode }) {
  const api = useApi();
  const { isSignedIn } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!isSignedIn) return;
    api
      .getProfile()
      .then((p) => {
        const photo = p.photos.find((ph) => ph.isPrimary) ?? p.photos[0];
        setPhotoUrl(photo ? mediaUrl(photo.url) : null);
      })
      .catch(() => {});
  }, [api, isSignedIn]);

  useEffect(() => {
    if (!isSignedIn) {
      setPhotoUrl(null);
      return;
    }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn]);

  return <ProfilePhotoContext.Provider value={{ photoUrl, refresh }}>{children}</ProfilePhotoContext.Provider>;
}

export function useProfilePhoto() {
  return useContext(ProfilePhotoContext);
}
