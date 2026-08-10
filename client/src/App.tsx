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
import { RequireAuth } from "./components/RequireAuth";
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
      </Routes>
    </Layout>
  );
}

export default App;
