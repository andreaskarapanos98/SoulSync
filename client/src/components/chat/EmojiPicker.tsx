import { useEffect, useRef, useState } from "react";

const EMOJIS = [
  "😀", "😂", "😍", "😘", "😉", "😊", "🥰", "😎", "🤔", "😢",
  "😭", "😡", "👍", "👎", "👏", "🙌", "🔥", "💯", "❤️", "💕",
  "💖", "💔", "🎉", "✨", "🙏", "😴", "😅", "🤗", "😜", "🥳",
  "😳", "🥺", "😏", "😇", "🤩", "😋", "🍷", "🌹", "☕", "🌙",
];

export function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
        title="Add an emoji"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
      >
        😊
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 grid w-64 grid-cols-8 gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
          {EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                onSelect(e);
                setOpen(false);
              }}
              className="rounded text-lg hover:bg-brand-50 dark:hover:bg-neutral-800"
            >
              {e}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
