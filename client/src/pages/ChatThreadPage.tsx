import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import type { MessageDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { LogoMark } from "../components/Logo";
import { EmojiPicker } from "../components/chat/EmojiPicker";
import { VoiceMessageButton } from "../components/chat/VoiceMessageButton";
import { playIncomingSound, playTypingSound } from "../utils/sounds";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL_MS = 4000;
const TYPING_PING_THROTTLE_MS = 1500;
const TYPING_SOUND_THROTTLE_MS = 120;

export function ChatThreadPage() {
  const { clerkId } = useParams<{ clerkId: string }>();
  const api = useApi();
  const { userId } = useAuth();
  const { refresh: refreshUnreadCount } = useUnreadCount();
  const [messages, setMessages] = useState<MessageDTO[] | null>(null);
  const [otherName, setOtherName] = useState("");
  const [otherPhoto, setOtherPhoto] = useState<string | undefined>();
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const seenMessageIdsRef = useRef<Set<string> | null>(null);
  const lastTypingPingRef = useRef(0);
  const lastTypingSoundRef = useRef(0);

  function load() {
    if (!clerkId) return;
    api
      .getMessages(clerkId)
      .then((res) => {
        // Play a sound for any message from the other person we haven't seen yet
        // (skips the very first load, which would otherwise sound off for history).
        if (seenMessageIdsRef.current) {
          const isNewIncoming = res.messages.some(
            (m) => m.fromClerkId !== userId && !seenMessageIdsRef.current!.has(m.id),
          );
          if (isNewIncoming) playIncomingSound();
        }
        seenMessageIdsRef.current = new Set(res.messages.map((m) => m.id));

        setMessages(res.messages);
        setOtherName(res.otherFirstName);
        setOtherPhoto(res.otherPhotoUrl);
        setOtherIsTyping(res.otherIsTyping);

        // Fetching messages marks this conversation read server-side — refresh the
        // nav badge immediately instead of waiting on its own independent poll timer.
        refreshUnreadCount();
      })
      .catch((err) => setError(String(err)));
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clerkId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!clerkId) return;
    const now = Date.now();
    if (now - lastTypingPingRef.current > TYPING_PING_THROTTLE_MS) {
      lastTypingPingRef.current = now;
      api.sendTyping(clerkId).catch(() => {});
    }
  }

  function handleKeyDownSound() {
    const now = Date.now();
    if (now - lastTypingSoundRef.current > TYPING_SOUND_THROTTLE_MS) {
      lastTypingSoundRef.current = now;
      playTypingSound();
    }
  }

  async function handleSend() {
    if (!clerkId || !draft.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(clerkId, draft);
      setDraft("");
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSending(false);
    }
  }

  async function handleSendVoice(blob: Blob, durationSec: number) {
    if (!clerkId) return;
    await api.sendVoiceMessage(clerkId, blob, durationSec);
    load();
  }

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load chat: {error}</p>;
  if (!messages) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading chat…</p>;

  const lastMineIndex = [...messages].map((m) => m.fromClerkId === userId).lastIndexOf(true);
  const lastMineSeen = lastMineIndex !== -1 && Boolean(messages[lastMineIndex].readAt);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-6 py-8">
      <div className="flex items-center gap-3 border-b border-neutral-200 pb-4 dark:border-neutral-800">
        <Link to="/chat" className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
          ←
        </Link>
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-brand-200 dark:border-neutral-700">
          {otherPhoto ? (
            <img src={`${API_URL}${otherPhoto}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center bg-brand-50 dark:bg-brand-950/40">
              <LogoMark size={16} />
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-neutral-900 dark:text-white">{otherName || "Someone"}</p>
          {otherIsTyping && <p className="text-xs text-brand-500">Typing…</p>}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-400">Say hello 👋</p>
        ) : (
          messages.map((m, i) => {
            const mine = m.fromClerkId === userId;
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {m.audioUrl ? (
                  <div
                    className={`max-w-[75%] rounded-2xl px-3 py-2 ${
                      mine ? "bg-brand-500" : "bg-neutral-100 dark:bg-neutral-800"
                    }`}
                  >
                    <audio controls src={`${API_URL}${m.audioUrl}`} className="h-9 w-56 max-w-full" />
                  </div>
                ) : (
                  <p
                    className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                      mine
                        ? "bg-brand-500 text-white"
                        : "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100"
                    }`}
                  >
                    {m.body}
                  </p>
                )}
                {mine && i === lastMineIndex && lastMineSeen && (
                  <span className="mt-0.5 text-xs text-neutral-400">Seen</span>
                )}
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-center gap-1 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <EmojiPicker onSelect={(emoji) => handleDraftChange(draft + emoji)} />
        <input
          type="text"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={(e) => {
            handleKeyDownSound();
            if (e.key === "Enter" && !sending) handleSend();
          }}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:ring-brand-900"
        />
        <VoiceMessageButton onSend={handleSendVoice} />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}
