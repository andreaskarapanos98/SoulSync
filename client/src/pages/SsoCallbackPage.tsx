import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// The middle hop of an OAuth flow (Google, etc.) — Clerk lands the browser here first to
// finish exchanging the provider's code for a session, then auto-navigates on.
//
// Both the sign-in and sign-up destinations have to be spelled out. A Google account
// that isn't linked to a SoulSync account yet doesn't complete as a sign-in at all:
// Clerk transfers it to a sign-up, and without a sign-up destination that branch has
// nowhere to go and the flow dies here — leaving the native app's callback waiting for
// a session that never arrives.
export function SsoCallbackPage() {
  const nativeCallback = `${window.location.origin}/oauth-native-callback`;
  return (
    <AuthenticateWithRedirectCallback
      signInForceRedirectUrl={nativeCallback}
      signUpForceRedirectUrl={nativeCallback}
      continueSignUpUrl={nativeCallback}
    />
  );
}
