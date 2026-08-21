import { SignIn } from "@clerk/clerk-react";
import { NativeGoogleButton, hideClerkSocialAppearance } from "../components/NativeGoogleButton";

// Native-only full page (Layout.tsx sends "Sign in" here instead of opening Clerk's
// modal). Clerk's own Google button is hidden and replaced by one that runs the flow in
// the system browser — see NativeGoogleButton for why.
export function SignInPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center px-6 py-10">
      <NativeGoogleButton label="Continue with Google" />
      <div className="mb-4 flex w-full items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        or
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <SignIn routing="virtual" fallbackRedirectUrl="/matches" appearance={hideClerkSocialAppearance} />
    </div>
  );
}
