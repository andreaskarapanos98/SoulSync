import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import type { MessageDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { useUnreadCount } from "../hooks/useUnreadCount";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { LogoMark } from "../components/Logo";
import { EmojiPicker } from "../components/chat/EmojiPicker";
import { VoiceMessageButton } from "../components/chat/VoiceMessageButton";
import { GiftPicker } from "../components/chat/GiftPicker";
import { GiftAnimationOverlay } from "../components/chat/GiftAnimationOverlay";
import { CameraCapture } from "../components/chat/CameraCapture";
import { MessageBubble } from "../components/chat/MessageBubble";
import { ReportModal } from "../components/ReportModal";
import { ApiError } from "../services/api";
import { playIncomingSound, playTypingSound } from "../utils/sounds";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL_MS = 4000;
const TYPING_PING_THROTTLE_MS = 1500;
const TYPING_SOUND_THROTTLE_MS = 120;

// A chat-ban error carries the raw expiry as an ISO string so it's rendered in the
// *viewer's* timezone rather than baking in whatever timezone the server rendered it in.
// Falls back to `.message` (never `String(err)`, which would prepend "Error: ").
function formatChatError(err: unknown): string {
  if (err instanceof ApiError && err.chatBanUntil) {
    const until = new Date(err.chatBanUntil).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
    return `You're restricted from chatting until ${until}`;
  }
  if (err instanceof Error) return err.message;
  return String(err);
}

export function ChatThreadPage() {
  const { clerkId } = useParams<{ clerkId: string }>();
  const api = useApi();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const { refresh: refreshUnreadCount } = useUnreadCount();
  const { setBalance } = useCoinBalance();
  const [messages, setMessages] = useState<MessageDTO[] | null>(null);
  const [openingGift, setOpeningGift] = useState<{ giftId: string; emoji: string; label: string } | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [otherName, setOtherName] = useState("");
  const [otherPhoto, setOtherPhoto] = useState<string | undefined>();
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const [otherCompatibility, setOtherCompatibility] = useState<number | null>(null);
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
        setOtherCompatibility(res.otherCompatibility);

        // Fetching messages marks this conversation read server-side — refresh the
        // nav badge immediately instead of waiting on its own independent poll timer.
        refreshUnreadCount();
      })
      .catch((err) => setError(formatChatError(err)));
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
      setSendError(formatChatError(err));
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
      setSendError(formatChatError(err));
    }
  }

  async function sendPhotoFile(file: File) {
    if (!clerkId) return;
    setUploadingMedia(true);
    setSendError(null);
    try {
      await api.sendMediaMessage(clerkId, file);
      load();
    } catch (err) {
      setSendError(formatChatError(err));
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow selecting the same file again later
    if (!file) return;
    await sendPhotoFile(file);
  }

  async function handleSendGift(giftId: string) {
    if (!clerkId) return;
    setSendError(null);
    try {
      const res = await api.sendGift(clerkId, giftId);
      setBalance(res.coinBalance);
      load();
    } catch (err) {
      setSendError(
        err instanceof ApiError && err.status === 402
          ? "You don't have enough coins for that gift."
          : formatChatError(err),
      );
    }
  }

  async function handleOpenGift(messageId: string) {
    try {
      const res = await api.openGift(messageId);
      setOpeningGift({
        giftId: res.message.giftId ?? "",
        emoji: res.message.giftEmoji ?? "🎁",
        label: res.message.giftLabel ?? "Gift",
      });
    } catch (err) {
      setSendError(formatChatError(err));
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
    // Fixed full-screen takeover on mobile (like Instagram/WhatsApp) so the on-screen
    // keyboard resizes the *message list* instead of scrolling the header out of view —
    // h-dvh tracks the visual viewport as the keyboard opens/closes, unlike svh/lvh.
    // Desktop/tablet (sm:) keeps the original inline layout, completely unchanged.
    <div className="fixed inset-0 z-20 flex h-dvh flex-col bg-white sm:static sm:z-auto sm:mx-auto sm:h-auto sm:w-full sm:max-w-2xl sm:flex-1 sm:bg-transparent sm:px-6 sm:py-8 dark:bg-neutral-950">
      {openingGift && (
        <GiftAnimationOverlay
          giftId={openingGift.giftId}
          emoji={openingGift.emoji}
          label={openingGift.label}
          onDone={() => {
            setOpeningGift(null);
            load();
          }}
        />
      )}
      {cameraOpen && <CameraCapture onSend={sendPhotoFile} onClose={() => setCameraOpen(false)} />}
      <div
        className="flex shrink-0 items-center gap-3 border-b border-neutral-200 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:px-0 sm:pt-0 dark:border-neutral-800"
      >
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
          <p className="flex items-center gap-1.5 font-semibold text-neutral-900 dark:text-white">
            {otherName || "Someone"}
            {otherCompatibility !== null && (
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                {otherCompatibility}%
              </span>
            )}
          </p>
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

      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-6 sm:px-0">
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
                onOpenGift={handleOpenGift}
              />
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {sendError && (
        <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 sm:mx-0 dark:bg-red-950/30 dark:text-red-400">
          {sendError}
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileSelected} className="hidden" />

      {/* Emoji/attach/camera/gift are common actions but there isn't room for them
          inline on a narrow phone alongside the text input — collapsed behind a
          single "+" toggle below sm, shown inline as before at sm and up. */}
      {showMobileActions && (
        <div className="flex items-center gap-1 px-4 pb-2 sm:hidden">
          <EmojiPicker onSelect={(emoji) => handleDraftChange(draft + emoji)} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
            title="Send a photo or video"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          >
            {uploadingMedia ? "…" : "📎"}
          </button>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            disabled={uploadingMedia}
            title="Take a photo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          >
            📷
          </button>
          <GiftPicker onSend={handleSendGift} />
        </div>
      )}

      <div
        className="flex shrink-0 items-center gap-1 border-t border-neutral-200 px-4 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-0 sm:pb-4 dark:border-neutral-800"
      >
        <button
          type="button"
          onClick={() => setShowMobileActions((v) => !v)}
          title="More"
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl text-neutral-500 hover:bg-neutral-100 sm:hidden dark:hover:bg-neutral-800 ${
            showMobileActions ? "rotate-45" : ""
          } transition-transform`}
        >
          +
        </button>

        <span className="hidden shrink-0 items-center gap-1 sm:flex">
          <EmojiPicker onSelect={(emoji) => handleDraftChange(draft + emoji)} />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingMedia}
            title="Send a photo or video"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          >
            {uploadingMedia ? "…" : "📎"}
          </button>
          <button
            type="button"
            onClick={() => setCameraOpen(true)}
            disabled={uploadingMedia}
            title="Take a photo"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-800"
          >
            📷
          </button>
        </span>

        <input
          type="text"
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={(e) => {
            handleKeyDownSound();
            if (e.key === "Enter" && !sending) handleSend();
          }}
          placeholder="Type a message…"
          className="min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:ring-brand-900"
        />

        <span className="hidden shrink-0 sm:block">
          <GiftPicker onSend={handleSendGift} />
        </span>

        <VoiceMessageButton onSend={handleSendVoice} />

        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="shrink-0 rounded-full bg-brand-500 px-3 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50 sm:px-5"
        >
          <span className="sm:hidden">➤</span>
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
}
