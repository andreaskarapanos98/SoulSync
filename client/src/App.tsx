import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { OnboardingAboutMePage } from "./pages/OnboardingAboutMePage";
import { OnboardingPreferencesPage } from "./pages/OnboardingPreferencesPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { MatchesPage } from "./pages/MatchesPage";
import { ChatPage } from "./pages/ChatPage";
import { ChatThreadPage } from "./pages/ChatThreadPage";
import { ViewProfilePage } from "./pages/ViewProfilePage";
import { BuyCoinsPage } from "./pages/BuyCoinsPage";
import { CoinsSuccessPage } from "./pages/CoinsSuccessPage";
import { CoinsCancelPage } from "./pages/CoinsCancelPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { AdminUserDetailPage } from "./pages/admin/AdminUserDetailPage";
import { AdminReportsPage } from "./pages/admin/AdminReportsPage";
import { AdminPaymentsPage } from "./pages/admin/AdminPaymentsPage";
import { AdminErrorsPage } from "./pages/admin/AdminErrorsPage";
import { AdminQuestionsPage } from "./pages/admin/AdminQuestionsPage";
import { AdminFunnelPage } from "./pages/admin/AdminFunnelPage";
import { PrivacyPolicyPage } from "./pages/legal/PrivacyPolicyPage";
import { TermsOfServicePage } from "./pages/legal/TermsOfServicePage";
import { CommunityGuidelinesPage } from "./pages/legal/CommunityGuidelinesPage";
import { CookiePolicyPage } from "./pages/legal/CookiePolicyPage";
import { RefundPolicyPage } from "./pages/legal/RefundPolicyPage";
import { AccountSettingsPage } from "./pages/AccountSettingsPage";
import { RequireAuth } from "./components/RequireAuth";
import { RequireAdmin } from "./components/RequireAdmin";
import { Layout } from "./components/Layout";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
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
      </Routes>
    </Layout>
  );
}

export default App;
