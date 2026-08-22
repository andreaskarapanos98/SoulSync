import { useEffect, useRef, useState } from "react";
import type { MessageDTO } from "@soulsync/shared-types";
import { mediaUrl } from "../../utils/mediaUrl";

interface Props {
  message: MessageDTO;
  mine: boolean;
  showSeen: boolean;
  onEdit: (id: string, body: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReport: (messageId: string) => void;
  onOpenGift: (id: string) => void;
}

export function MessageBubble({ message, mine, showSeen, onEdit, onDelete, onReport, onOpenGift }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(message.body);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function saveEdit() {
    if (!editDraft.trim()) return;
    setBusy(true);
    try {
      await onEdit(message.id, editDraft);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    setBusy(true);
    try {
      await onDelete(message.id);
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  if (message.deleted) {
    return (
      <div className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
        <p className="max-w-[75%] rounded-2xl bg-neutral-50 px-4 py-2 text-sm italic text-neutral-400 dark:bg-neutral-900 dark:text-neutral-600">
          {mine ? "You deleted this message" : "This message was deleted"}
        </p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col items-end">
        <div className="flex w-full max-w-[75%] items-center gap-2">
          <input
            type="text"
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveEdit()}
            autoFocus
            className="flex-1 rounded-full border border-brand-300 bg-white px-3 py-1.5 text-sm text-neutral-900 focus:outline-none dark:border-brand-700 dark:bg-neutral-900 dark:text-white"
          />
          <button
            type="button"
            onClick={saveEdit}
            disabled={busy || !editDraft.trim()}
            className="text-sm font-medium text-brand-600 disabled:opacity-50 dark:text-brand-400"
          >
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} disabled={busy} className="text-sm text-neutral-400">
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className={`flex items-center gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}>
        {message.giftId ? (
          mine || message.giftOpenedAt ? (
            <div
              className={`flex max-w-[75%] items-center gap-2 rounded-2xl px-3 py-2 ${mine ? "bg-brand-500 text-white" : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"}`}
            >
              <span className="text-xl">{message.giftEmoji}</span>
              <span className="text-sm">{mine ? `You sent a ${message.giftLabel}` : `Sent you a ${message.giftLabel}`}</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onOpenGift(message.id)}
              className="animate-gift-glow-pulse flex max-w-[75%] items-center gap-2 rounded-2xl bg-brand-50 px-4 py-3 text-sm font-medium text-brand-600 dark:bg-brand-950/40 dark:text-brand-400"
            >
              🎁 Tap to open your gift
            </button>
          )
        ) : message.audioUrl ? (
          <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${mine ? "bg-brand-500" : "bg-neutral-100 dark:bg-neutral-800"}`}>
            <audio controls src={mediaUrl(message.audioUrl)} className="h-9 w-56 max-w-full" />
          </div>
        ) : message.imageUrl ? (
          // Fixed size (not w-full/max-w-%), deliberately: this sits in a flex item with
          // items-end/items-start, which shrink-to-fit rather than stretch — a percentage
          // width has nothing definite to resolve against there, so the image would
          // silently fall back to its own natural pixel size instead of filling the bubble.
          <a href={mediaUrl(message.imageUrl)} target="_blank" rel="noreferrer" className="block w-64 max-w-full overflow-hidden rounded-2xl">
            <img src={mediaUrl(message.imageUrl)} alt="" className="h-48 w-full object-cover" />
          </a>
        ) : message.videoUrl ? (
          <div className="w-64 max-w-full overflow-hidden rounded-2xl">
            <video controls src={mediaUrl(message.videoUrl)} className="h-48 w-full object-cover" />
          </div>
        ) : (
          <p
            className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
              mine ? "bg-brand-500 text-white" : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
            }`}
          >
            {message.body}
          </p>
        )}
        {mine && (
          <div ref={menuRef} className="relative shrink-0 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ⋯
            </button>
            {menuOpen && (
              <div
                className={`absolute top-full z-10 mt-1 w-28 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900 ${
                  mine ? "right-0" : "left-0"
                }`}
              >
                {!message.audioUrl && !message.imageUrl && !message.videoUrl && !message.giftId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditDraft(message.body);
                      setEditing(true);
                      setMenuOpen(false);
                    }}
                    className="block w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  >
                    Edit
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setConfirmingDelete(true);
                    setMenuOpen(false);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
        {!mine && !message.deleted && (
          <div ref={menuRef} className="relative shrink-0 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-6 w-6 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute left-0 top-full z-10 mt-1 w-28 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onReport(message.id);
                  }}
                  className="block w-full px-3 py-1.5 text-left text-neutral-700 hover:bg-brand-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  🚩 Report
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmingDelete && (
        <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
          Delete this message?
          <button type="button" onClick={confirmDelete} disabled={busy} className="font-medium text-red-600 disabled:opacity-50">
            Yes
          </button>
          <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy} className="font-medium text-neutral-400">
            No
          </button>
        </div>
      )}

      {(message.editedAt || showSeen) && (
        <span className="mt-0.5 text-xs text-neutral-400">
          {message.editedAt ? "edited" : ""}
          {message.editedAt && showSeen ? " · " : ""}
          {showSeen ? "Seen" : ""}
        </span>
      )}
    </div>
  );
}
