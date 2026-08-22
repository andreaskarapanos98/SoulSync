import { SignIn } from "@clerk/clerk-react";
import { NativeGoogleButton } from "../components/NativeGoogleButton";
import { NativeAuthCard } from "../components/NativeAuthCard";

// Native-only full page (Layout.tsx sends "Sign in" here instead of opening Clerk's
// modal). Clerk's own Google button can't work in a WebView, so it's hidden and replaced
// by NativeGoogleButton, laid out where a social button normally sits — above the
// email/password form inside the same card, rather than floating on its own.
export function SignInPage() {
  return (
    <NativeAuthCard title="Sign in to SoulSync" subtitle="Welcome back! Please sign in to continue">
      <NativeGoogleButton label="Continue with Google" />
      <SignIn routing="virtual" fallbackRedirectUrl="/matches" />
    </NativeAuthCard>
  );
}
