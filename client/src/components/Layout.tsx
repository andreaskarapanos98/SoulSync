import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, SignUpButton, useSignIn } from "@clerk/clerk-react";
import { Capacitor } from "@capacitor/core";
import { Logo } from "./Logo";
import { ProfileAvatarButton } from "./ProfileAvatarButton";
import { ChatNavLink } from "./ChatNavLink";
import { NotificationBell } from "./NotificationBell";
import { CoinBalanceBadge } from "./CoinBalanceBadge";
import { AdminNavLink } from "./AdminNavLink";
import { MobileTabBar } from "./MobileTabBar";
import { UnreadCountProvider } from "../hooks/useUnreadCount";
import { CoinBalanceProvider } from "../hooks/useCoinBalance";
import { ProfilePhotoProvider } from "../hooks/useProfilePhoto";

export function Layout({ children }: { children: ReactNode }) {
  const { signIn } = useSignIn();

  // Google refuses to render its consent screen inside an embedded WebView, so Clerk's
  // own modal Google button silently fails in the wrapped Android app — it can open
  // Google in an external tab but nothing brings the user back afterwards. This button
  // drives the same OAuth flow manually with an explicit round-trip: /sso-callback lets
  // Clerk finish the exchange, then /oauth-native-callback bridges the resulting session
  // back into the app's own WebView (see NativeAuthBridge.tsx). Desktop/regular web never
  // hits this — Clerk's modal Google button already works fine there.
  async function handleNativeGoogleSignIn() {
    if (!signIn) return;
    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: `${window.location.origin}/oauth-native-callback`,
    });
  }

  return (
    <UnreadCountProvider>
    <CoinBalanceProvider>
    <ProfilePhotoProvider>
    <div className="min-h-svh flex flex-col bg-gradient-to-b from-brand-50/60 via-white to-white dark:from-brand-950/10 dark:via-neutral-950 dark:to-neutral-950">
      <header
        className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/80"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <SignedIn>
              <Link
                to="/matches"
                className="hidden rounded-full px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-brand-50 hover:text-brand-600 sm:block dark:text-neutral-200 dark:hover:bg-neutral-800"
              >
                💘 Soulmates
              </Link>
              <span className="hidden sm:block">
                <ChatNavLink />
              </span>
              <CoinBalanceBadge />
              <NotificationBell />
              <span className="hidden sm:block">
                <AdminNavLink />
              </span>
            </SignedIn>
            <SignedOut>
              {Capacitor.isNativePlatform() && (
                <button
                  type="button"
                  onClick={handleNativeGoogleSignIn}
                  title="Continue with Google"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 text-sm font-bold text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                >
                  G
                </button>
              )}
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
              <span className="hidden sm:block">
                <ProfileAvatarButton />
              </span>
            </SignedIn>
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col pb-16 sm:pb-0">{children}</main>

      <SignedIn>
        <MobileTabBar />
      </SignedIn>

      <footer className="hidden border-t border-neutral-200 px-6 py-6 text-xs text-neutral-400 sm:block dark:border-neutral-800">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
          <span>🔞 SoulSync is for adults 18+ only.</span>
          <nav className="flex flex-wrap gap-x-4 gap-y-1">
            <Link to="/legal/privacy" className="hover:text-neutral-700 dark:hover:text-neutral-200">
              Privacy
            </Link>
            <Link to="/legal/terms" className="hover:text-neutral-700 dark:hover:text-neutral-200">
              Terms
            </Link>
            <Link to="/legal/community-guidelines" className="hover:text-neutral-700 dark:hover:text-neutral-200">
              Community Guidelines
            </Link>
            <Link to="/legal/cookies" className="hover:text-neutral-700 dark:hover:text-neutral-200">
              Cookies
            </Link>
            <Link to="/legal/refunds" className="hover:text-neutral-700 dark:hover:text-neutral-200">
              Refunds
            </Link>
          </nav>
        </div>
      </footer>
    </div>
    </ProfilePhotoProvider>
    </CoinBalanceProvider>
    </UnreadCountProvider>
  );
}
