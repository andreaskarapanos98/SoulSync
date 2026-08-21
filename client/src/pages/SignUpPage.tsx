import { SignUp, useSignIn } from "@clerk/clerk-react";

// Native-only full page — see SignInPage.tsx, same reasoning. Sign-up via Google also
// goes through signIn.authenticateWithRedirect (Clerk routes a first-time Google user
// through the sign-in flow automatically and creates their account).
export function SignUpPage() {
  const { signIn } = useSignIn();

  async function handleGoogleSignUp() {
    if (!signIn) return;
    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: `${window.location.origin}/sso-callback`,
      redirectUrlComplete: `${window.location.origin}/oauth-native-callback`,
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center px-6 py-10">
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-full border border-neutral-300 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
      >
        Continue with Google
      </button>
      <div className="mb-4 flex w-full items-center gap-3 text-xs text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        or
        <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
      </div>
      <SignUp
        routing="virtual"
        fallbackRedirectUrl="/matches"
        appearance={{ elements: { socialButtonsBlockButton: "hidden", dividerRow: "hidden", cardBox: "shadow-none" } }}
      />
    </div>
  );
}
