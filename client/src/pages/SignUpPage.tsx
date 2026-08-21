import { SignUp } from "@clerk/clerk-react";
import { NativeGoogleButton, hideClerkSocialAppearance } from "../components/NativeGoogleButton";

// Native-only full page — see SignInPage.tsx, same reasoning. Google sign-up runs through
// the same flow (Clerk creates the account automatically for a first-time Google user).
export function SignUpPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center px-6 py-10">
      <NativeGoogleButton label="Continue with Google" />
      <div className="mb-4 flex w-full items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        or
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <SignUp routing="virtual" fallbackRedirectUrl="/matches" appearance={hideClerkSocialAppearance} />
    </div>
  );
}
