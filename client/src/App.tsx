import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { OnboardingAboutMePage } from "./pages/OnboardingAboutMePage";
import { OnboardingPreferencesPage } from "./pages/OnboardingPreferencesPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { MatchesPage } from "./pages/MatchesPage";
import { ChatPage } from "./pages/ChatPage";
import { ChatThreadPage } from "./pages/ChatThreadPage";
import { ViewProfilePage } from "./pages/ViewProfilePage";
import { SignInPage } from "./pages/SignInPage";
import { SignUpPage } from "./pages/SignUpPage";
import { SsoCallbackPage } from "./pages/SsoCallbackPage";
import { OAuthNativeCallbackPage } from "./pages/OAuthNativeCallbackPage";
import { NativeOAuthStartPage } from "./pages/NativeOAuthStartPage";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { Layout } from "./components/Layout";
import { NativeAuthBridge } from "./components/NativeAuthBridge";
import { NativePushBridge } from "./components/NativePushBridge";
import { NotFoundPage } from "./pages/NotFoundPage";
import { RouteFallback } from "./components/RouteFallback";

// Split out of the main bundle: the admin dashboard is eight screens almost no account
// can even open, and the legal pages and payment/verification returns are visited rarely
// (often once, ever) — every user was downloading all of it before reaching their matches.
// The hot paths above (matches, chat, profiles, onboarding, auth) stay eager so navigating
// between the screens people actually live in never waits on a chunk.
const page = <T extends Record<string, React.ComponentType>>(
  loader: () => Promise<T>,
  name: keyof T,
) => lazy(() => loader().then((m) => ({ default: m[name] })));

const BuyCoinsPage = page(() => import("./pages/BuyCoinsPage"), "BuyCoinsPage");
const CoinsSuccessPage = page(() => import("./pages/CoinsSuccessPage"), "CoinsSuccessPage");
const CoinsCancelPage = page(() => import("./pages/CoinsCancelPage"), "CoinsCancelPage");
const VerificationReturnPage = page(() => import("./pages/VerificationReturnPage"), "VerificationReturnPage");
const AccountSettingsPage = page(() => import("./pages/AccountSettingsPage"), "AccountSettingsPage");
const AdminDashboardPage = page(() => import("./pages/admin/AdminDashboardPage"), "AdminDashboardPage");
const AdminUsersPage = page(() => import("./pages/admin/AdminUsersPage"), "AdminUsersPage");
const AdminUserDetailPage = page(() => import("./pages/admin/AdminUserDetailPage"), "AdminUserDetailPage");
const AdminReportsPage = page(() => import("./pages/admin/AdminReportsPage"), "AdminReportsPage");
const AdminPaymentsPage = page(() => import("./pages/admin/AdminPaymentsPage"), "AdminPaymentsPage");
const AdminErrorsPage = page(() => import("./pages/admin/AdminErrorsPage"), "AdminErrorsPage");
const AdminQuestionsPage = page(() => import("./pages/admin/AdminQuestionsPage"), "AdminQuestionsPage");
const AdminFunnelPage = page(() => import("./pages/admin/AdminFunnelPage"), "AdminFunnelPage");
const PrivacyPolicyPage = page(() => import("./pages/legal/PrivacyPolicyPage"), "PrivacyPolicyPage");
const TermsOfServicePage = page(() => import("./pages/legal/TermsOfServicePage"), "TermsOfServicePage");
const CommunityGuidelinesPage = page(() => import("./pages/legal/CommunityGuidelinesPage"), "CommunityGuidelinesPage");
const CookiePolicyPage = page(() => import("./pages/legal/CookiePolicyPage"), "CookiePolicyPage");
const RefundPolicyPage = page(() => import("./pages/legal/RefundPolicyPage"), "RefundPolicyPage");

function App() {
  return (
    <>
      <NativeAuthBridge />
      <NativePushBridge />
      <Layout>
      <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/sso-callback" element={<SsoCallbackPage />} />
        <Route path="/oauth-native-callback" element={<OAuthNativeCallbackPage />} />
        <Route path="/native-oauth-start" element={<NativeOAuthStartPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route
          path="/onboarding/about-me"
          element={
            <RequireAuth>
              <OnboardingAboutMePage />
            </RequireAuth>
          }
        />
        <Route
          path="/onboarding/preferences"
          element={
            <RequireAuth>
              <OnboardingPreferencesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profile/edit"
          element={
            <RequireAuth>
              <ProfileEditPage />
            </RequireAuth>
          }
        />
        <Route
          path="/matches"
          element={
            <RequireAuth>
              <MatchesPage />
            </RequireAuth>
          }
        />
        <Route
          path="/chat"
          element={
            <RequireAuth>
              <ChatPage />
            </RequireAuth>
          }
        />
        <Route
          path="/chat/:clerkId"
          element={
            <RequireAuth>
              <ChatThreadPage />
            </RequireAuth>
          }
        />
        <Route
          path="/profiles/:clerkId"
          element={
            <RequireAuth>
              <ViewProfilePage />
            </RequireAuth>
          }
        />
        <Route
          path="/coins"
          element={
            <RequireAuth>
              <BuyCoinsPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coins/success"
          element={
            <RequireAuth>
              <CoinsSuccessPage />
            </RequireAuth>
          }
        />
        <Route
          path="/verification/return"
          element={
            <RequireAuth>
              <VerificationReturnPage />
            </RequireAuth>
          }
        />
        <Route
          path="/coins/cancel"
          element={
            <RequireAuth>
              <CoinsCancelPage />
            </RequireAuth>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminDashboardPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminUsersPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/users/:clerkId"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminUserDetailPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminReportsPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/payments"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminPaymentsPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/errors"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminErrorsPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/questions"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminQuestionsPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route
          path="/admin/funnel"
          element={
            <RequireAuth>
              <RequireAdmin>
                <AdminFunnelPage />
              </RequireAdmin>
            </RequireAuth>
          }
        />
        <Route path="/legal/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/legal/terms" element={<TermsOfServicePage />} />
        <Route path="/legal/community-guidelines" element={<CommunityGuidelinesPage />} />
        <Route path="/legal/cookies" element={<CookiePolicyPage />} />
        <Route path="/legal/refunds" element={<RefundPolicyPage />} />
        <Route
          path="/account"
          element={
            <RequireAuth>
              <AccountSettingsPage />
            </RequireAuth>
          }
        />
        {/* Anything unrecognised — a mistyped URL, a stale link — landed on a blank page
            before this. */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
      </Layout>
    </>
  );
}

export default App;
