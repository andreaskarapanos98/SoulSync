import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { OnboardingAboutMePage } from "./pages/OnboardingAboutMePage";
import { OnboardingPreferencesPage } from "./pages/OnboardingPreferencesPage";
import { ProfileEditPage } from "./pages/ProfileEditPage";
import { MatchesPage } from "./pages/MatchesPage";
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
      </Routes>
    </Layout>
  );
}

export default App;
