import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@clerk/clerk-react";
import { io, type Socket } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const ChatSocketContext = createContext<Socket | null>(null);

// One Socket.IO connection per signed-in session, shared by every chat-facing hook/page
// (ChatThreadPage, ChatPage, useUnreadCount) so there's a single source of live updates
// instead of each one polling the API on its own timer. `auth` is a function rather than
// a plain object so a reconnect (e.g. after the native app was backgrounded) always
// hands over a *fresh* Clerk token instead of a stale one captured at first connect.
export function ChatSocketProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, getToken } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  useEffect(() => {
    if (!isSignedIn) {
      setSocket(null);
      return;
    }

    const s = io(API_URL, {
      auth: (cb) => {
        getTokenRef.current().then((token) => cb({ token }));
      },
    });
    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [isSignedIn]);

  return <ChatSocketContext.Provider value={socket}>{children}</ChatSocketContext.Provider>;
}

export function useChatSocket(): Socket | null {
  return useContext(ChatSocketContext);
}
