import { useRef, useState } from "react";
import type { PhotoDTO } from "@soulsync/shared-types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const MAX_PHOTOS = 5;

interface Props {
  photos: PhotoDTO[];
  onUpload: (file: File) => Promise<void>;
  onDelete: (photoId: string) => Promise<void>;
  onSetPrimary: (photoId: string) => Promise<void>;
  onSetFocalPoint: (photoId: string, x: number, y: number) => Promise<void>;
}

/** Circular avatar preview — drag anywhere inside it to reposition the crop. */
function AvatarCropper({
  photo,
  onChange,
}: {
  photo: PhotoDTO;
  onChange: (x: number, y: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);

  const position = live ?? photo.focalPoint;

  function positionFromPointer(clientX: number, clientY: number) {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.min(100, Math.max(0, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  }

  function handlePointerDown(e: React.PointerEvent) {
    draggingRef.current = true;
    (e.target as Element).setPointerCapture(e.pointerId);
    const next = positionFromPointer(e.clientX, e.clientY);
    if (next) setLive(next);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!draggingRef.current) return;
    const next = positionFromPointer(e.clientX, e.clientY);
    if (next) setLive(next);
  }

  function handlePointerUp() {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (live) onChange(live.x, live.y);
  }

  return (
    <div
      ref={frameRef}
      className="h-36 w-36 cursor-grab touch-none overflow-hidden rounded-full border-2 border-brand-500 active:cursor-grabbing"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <img
        src={`${API_URL}${photo.url}`}
        alt=""
        className="h-full w-full pointer-events-none object-cover"
        style={{ objectPosition: `${position.x}% ${position.y}%` }}
        draggable={false}
      />
    </div>
  );
}

export function PhotoUploader({ photos, onUpload, onDelete, onSetPrimary, onSetFocalPoint }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const primaryPhoto = photos.find((p) => p.isPrimary);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setBusy(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {primaryPhoto && (
        <div className="flex flex-col items-center gap-2">
          <AvatarCropper
            photo={primaryPhoto}
            onChange={(x, y) => onSetFocalPoint(primaryPhoto.id, x, y)}
          />
          <p className="text-xs text-neutral-500">Drag to adjust your profile picture</p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={`relative flex aspect-square flex-col justify-end overflow-hidden rounded-lg border-2 ${photo.isPrimary ? "border-brand-500" : "border-transparent"}`}
          >
            <img src={`${API_URL}${photo.url}`} alt="" className="absolute inset-0 h-full w-full object-cover" />
            {photo.isPrimary ? (
              <span className="relative z-10 m-1 self-start rounded bg-brand-500 px-1.5 py-0.5 text-[11px] font-medium text-white">
                Primary
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onSetPrimary(photo.id)}
                disabled={busy}
                className="relative z-10 m-1 self-start rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white"
              >
                Make primary
              </button>
            )}
            <button
              type="button"
              onClick={() => onDelete(photo.id)}
              disabled={busy}
              className="relative z-10 m-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white"
            >
              Remove
            </button>
          </div>
        ))}
        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
            className="aspect-square rounded-lg border-2 border-dashed border-neutral-300 text-sm text-neutral-500 hover:border-brand-400 hover:text-brand-600 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-400"
          >
            {busy ? "Uploading…" : "+ Add photo"}
          </button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}
