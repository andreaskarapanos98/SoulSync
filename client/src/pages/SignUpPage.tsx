import { SignUp } from "@clerk/clerk-react";
import { NativeGoogleButton } from "../components/NativeGoogleButton";
import { NativeAuthCard } from "../components/NativeAuthCard";

// Native-only full page — see SignInPage.tsx, same reasoning. Google sign-up runs through
// the same flow (Clerk creates the account automatically for a first-time Google user).
export function SignUpPage() {
  return (
    <NativeAuthCard title="Create your account" subtitle="Join SoulSync and find who actually fits">
      <NativeGoogleButton label="Continue with Google" />
      <SignUp routing="virtual" fallbackRedirectUrl="/matches" />
    </NativeAuthCard>
  );
}
