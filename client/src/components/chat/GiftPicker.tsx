import { useEffect, useRef, useState } from "react";
import type { GiftDTO } from "@soulsync/shared-types";
import { useApi } from "../../hooks/useApi";
import { CoinIcon } from "../CoinIcon";

export function GiftPicker({ onSend, disabled }: { onSend: (giftId: string) => void; disabled?: boolean }) {
  const api = useApi();
  const [open, setOpen] = useState(false);
  const [gifts, setGifts] = useState<GiftDTO[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggle() {
    if (!open && !gifts) {
      api.getGiftCatalog().then((res) => setGifts(res.gifts)).catch(() => setGifts([]));
    }
    setOpen((o) => !o);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        disabled={disabled}
        title="Send a gift"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
      >
        🎁
      </button>
      {open && (
        <div className="absolute bottom-full right-0 mb-2 w-64 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {!gifts ? (
            <p className="p-2 text-sm text-neutral-400">Loading…</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {gifts.map((gift) => (
                <button
                  key={gift.id}
                  type="button"
                  onClick={() => {
                    onSend(gift.id);
                    setOpen(false);
                  }}
                  className="flex flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-center hover:bg-brand-50 dark:hover:bg-neutral-800"
                >
                  <span className="text-2xl">{gift.emoji}</span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">{gift.label}</span>
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    <CoinIcon className="h-3 w-3" /> {gift.coins}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
