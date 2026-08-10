import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { Logo } from "./Logo";
import { ProfileAvatarButton } from "./ProfileAvatarButton";
import { ChatNavLink } from "./ChatNavLink";
import { NotificationBell } from "./NotificationBell";
import { UnreadCountProvider } from "../hooks/useUnreadCount";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <UnreadCountProvider>
    <div className="min-h-svh flex flex-col bg-gradient-to-b from-brand-50/60 via-white to-white dark:from-brand-950/10 dark:via-neutral-950 dark:to-neutral-950">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <SignedIn>
              <Link
                to="/matches"
                className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                Matches
              </Link>
              <ChatNavLink />
              <NotificationBell />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <ProfileAvatarButton />
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">{children}</main>
    </div>
    </UnreadCountProvider>
  );
}
