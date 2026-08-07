import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { OnboardingAboutMePage } from "./pages/OnboardingAboutMePage";
import { OnboardingPreferencesPage } from "./pages/OnboardingPreferencesPage";
import { RequireAuth } from "./components/RequireAuth";
import "./App.css";

function App() {
  return (
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
    </Routes>
  );
}

export default App;
