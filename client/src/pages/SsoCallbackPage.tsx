import { AuthenticateWithRedirectCallback } from "@clerk/clerk-react";

// The middle hop of an OAuth flow (Google, etc.) — Clerk lands the browser here first to
// finish exchanging the provider's code for a session, then auto-navigates on to
// whatever redirectUrlComplete was originally given (see OAuthNativeCallbackPage for the
// native-app leg of that).
export function SsoCallbackPage() {
  return <AuthenticateWithRedirectCallback />;
}
