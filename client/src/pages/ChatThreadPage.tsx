import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import type { MessageDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { LogoMark } from "../components/Logo";
import { EmojiPicker } from "../components/chat/EmojiPicker";
import { VoiceMessageButton } from "../components/chat/VoiceMessageButton";
import { MessageBubble } from "../components/chat/MessageBubble";
import { ReportModal } from "../components/ReportModal";
import { playIncomingSound, playTypingSound } from "../utils/sounds";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL_MS = 4000;
const TYPING_PING_THROTTLE_MS = 1500;
const TYPING_SOUND_THROTTLE_MS = 120;

export function ChatThreadPage() {
  const { clerkId } = useParams<{ clerkId: string }>();
  const api = useApi();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { refresh: refreshUnreadCount } = useUnreadCount();
  const [messages, setMessages] = useState<MessageDTO[] | null>(null);
  const [otherName, setOtherName] = useState("");
  const [otherPhoto, setOtherPhoto] = useState<string | undefined>();
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportingUser, setReportingUser] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleBlock() {
    if (!clerkId) return;
    if (!window.confirm("Block this person? They won't be able to message you and won't appear in your matches.")) return;
    setBlocking(true);
    try {
      await api.blockUser(clerkId);
      navigate("/chat");
    } finally {
      setBlocking(false);
    }
  }

  function handleDraftChange(value: string) {
    setDraft(value);
    if (!clerkId || !value.trim()) return;
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
    setSendError(null);
    try {
      await api.sendMessage(clerkId, draft);
      setDraft("");
      load();
    } catch (err) {
      setSendError(String(err));
    } finally {
      setSending(false);
    }
  }

  async function handleSendVoice(blob: Blob, durationSec: number) {
    if (!clerkId) return;
    setSendError(null);
    try {
      await api.sendVoiceMessage(clerkId, blob, durationSec);
      load();
    } catch (err) {
      setSendError(String(err));
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow selecting the same file again later
    if (!clerkId || !file) return;
    setUploadingMedia(true);
    setSendError(null);
    try {
      await api.sendMediaMessage(clerkId, file);
      load();
    } catch (err) {
      setSendError(String(err));
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleEditMessage(messageId: string, body: string) {
    await api.editMessage(messageId, body);
    load();
  }

  async function handleDeleteMessage(messageId: string) {
    await api.deleteMessage(messageId);
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
        {clerkId && (
          <Link
            to={`/profiles/${clerkId}`}
            title={`View ${otherName || "profile"}`}
            className="block h-10 w-10 shrink-0 overflow-hidden rounded-full border border-brand-200 dark:border-neutral-700"
          >
            {otherPhoto ? (
              <img src={`${API_URL}${otherPhoto}`} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-brand-50 dark:bg-brand-950/40">
                <LogoMark size={16} />
              </span>
            )}
          </Link>
        )}
        <div className="flex-1">
          <p className="font-semibold text-neutral-900 dark:text-white">{otherName || "Someone"}</p>
          {otherIsTyping && <p className="text-xs text-brand-500">Typing…</p>}
        </div>

        {clerkId && (
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              title="More options"
              className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              ⋮
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-10 mt-1 w-40 overflow-hidden rounded-xl border border-neutral-200 bg-white py-1 shadow-lg dark:border-neutral-700 dark:bg-neutral-900">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportingUser(true);
                  }}
                  className="block w-full px-4 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  🚩 Report
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    handleBlock();
                  }}
                  disabled={blocking}
                  className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-neutral-50 disabled:opacity-50 dark:hover:bg-neutral-800"
                >
                  🚫 Block
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {reportingUser && clerkId && (
        <ReportModal reportedClerkId={clerkId} contentType="user" onClose={() => setReportingUser(false)} />
      )}
      {reportingMessageId && clerkId && (
        <ReportModal
          reportedClerkId={clerkId}
          contentType="message"
          contentRef={reportingMessageId}
          onClose={() => setReportingMessageId(null)}
        />
      )}

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto py-6">
        {messages.length === 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-400">Say hello 👋</p>
        ) : (
          messages.map((m, i) => {
            const mine = m.fromClerkId === userId;
            return (
              <MessageBubble
                key={m.id}
                message={m}
                mine={mine}
                showSeen={mine && i === lastMineIndex && lastMineSeen}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                onReport={setReportingMessageId}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
          {sendError}
        </p>
      )}

      <div className="flex items-center gap-1 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <EmojiPicker onSelect={(emoji) => handleDraftChange(draft + emoji)} />
        <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelected} className="hidden" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingMedia}
          title="Send a photo or video"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
        >
          {uploadingMedia ? "…" : "📎"}
        </button>
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
