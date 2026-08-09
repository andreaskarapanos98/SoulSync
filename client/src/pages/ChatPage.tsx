import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { ConversationSummaryDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { LogoMark } from "../components/Logo";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ChatPage() {
  const api = useApi();
  const [conversations, setConversations] = useState<ConversationSummaryDTO[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getConversations().then(({ conversations }) => setConversations(conversations)).catch((err) => setError(String(err)));
  }, [api]);

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load chats: {error}</p>;
  if (!conversations) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading your chats…</p>;

  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Chats</h1>

      {conversations.length === 0 ? (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-2xl border border-dashed border-brand-200 py-16 text-center dark:border-neutral-800">
          <span className="text-3xl">💬</span>
          <p className="text-neutral-600 dark:text-neutral-400">No conversations yet.</p>
          <Link to="/matches" className="mt-2 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Go say hello to a match
          </Link>
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {conversations.map((c) => (
            <Link
              key={c.clerkId}
              to={`/chat/${c.clerkId}`}
              className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 transition hover:bg-brand-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-brand-200 dark:border-neutral-700">
                {c.photoUrl ? (
                  <img src={`${API_URL}${c.photoUrl}`} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-brand-50 dark:bg-brand-950/40">
                    <LogoMark size={20} />
                  </span>
                )}
                {c.unread && (
                  <span className="absolute right-0 top-0 h-3 w-3 rounded-full border-2 border-white bg-brand-500 dark:border-neutral-900" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium text-neutral-900 dark:text-white">
                  {c.firstName || "Someone"}
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-600 dark:bg-brand-950/40 dark:text-brand-400">
                    {c.compatibility}%
                  </span>
                </p>
                <p className={`truncate text-sm ${c.unread ? "font-semibold text-neutral-900 dark:text-white" : "text-neutral-500 dark:text-neutral-400"}`}>
                  {c.lastMessageFromMe ? "You: " : ""}
                  {c.lastMessage}
                </p>
              </div>
              <span className="shrink-0 text-xs text-neutral-400">{timeAgo(c.lastMessageAt)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
