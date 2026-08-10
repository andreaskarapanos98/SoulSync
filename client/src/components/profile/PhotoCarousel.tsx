import { useState } from "react";
import type { PhotoDTO } from "@soulsync/shared-types";
import { LogoMark } from "../Logo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export function PhotoCarousel({ photos }: { photos: PhotoDTO[] }) {
  const [index, setIndex] = useState(0);

  if (photos.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-t-3xl bg-brand-50 dark:bg-brand-950/20">
        <LogoMark size={48} className="opacity-40" />
      </div>
    );
  }

  const current = photos[Math.min(index, photos.length - 1)];

  function go(delta: number) {
    setIndex((i) => (i + delta + photos.length) % photos.length);
  }

  return (
    <div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-3xl bg-brand-50 dark:bg-brand-950/20">
        <img src={`${API_URL}${current.url}`} alt="" className="h-full w-full object-cover" />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              title="Previous photo"
              className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white hover:bg-black/60"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              title="Next photo"
              className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-lg text-white hover:bg-black/60"
            >
              ›
            </button>
            <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  title={`Photo ${i + 1}`}
                  className={`h-1.5 w-1.5 rounded-full transition ${i === index ? "bg-white" : "bg-white/50"}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto p-3">
          {photos.map((p, i) => (
            <button key={p.id} type="button" onClick={() => setIndex(i)} className="shrink-0">
              <img
                src={`${API_URL}${p.url}`}
                alt=""
                className={`h-16 w-16 rounded-lg object-cover ${i === index ? "ring-2 ring-brand-500" : "opacity-70"}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
