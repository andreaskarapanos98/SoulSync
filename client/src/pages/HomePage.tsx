import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react";
import type { HealthCheckResponse, MeDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function HealthStatus() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data: HealthCheckResponse) => setHealth(data))
      .catch((err) => setError(String(err)));
  }, []);

  if (error) return <p style={{ color: "crimson" }}>API error: {error}</p>;
  if (!health) return <p>Checking API connection…</p>;
  return (
    <p>
      API status: <strong>{health.status}</strong> ({health.timestamp})
    </p>
  );
}

function OnboardingStatus() {
  const api = useApi();
  const [me, setMe] = useState<MeDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMe().then(setMe).catch((err) => setError(String(err)));
  }, [api]);

  if (error) return <p style={{ color: "crimson" }}>/api/v1/me error: {error}</p>;
  if (!me) return <p>Loading your account…</p>;

  return (
    <>
      <p>
        Onboarding status: <strong>{me.onboardingStatus}</strong>
      </p>
      <p>
        <Link to="/onboarding/about-me">
          {me.onboardingStatus === "not_started" ? "Start About Me" : "Edit About Me answers"}
        </Link>
      </p>
      <p>
        {me.onboardingStatus === "not_started" ? (
          "Complete About Me first to unlock Ideal Soulmate"
        ) : (
          <Link to="/onboarding/preferences">
            {me.onboardingStatus === "about_me"
              ? "Start Ideal Soulmate"
              : "Edit Ideal Soulmate preferences"}
          </Link>
        )}
      </p>
      <p>
        {me.onboardingStatus === "not_started" || me.onboardingStatus === "about_me" ? (
          "Complete Ideal Soulmate first to unlock your Profile"
        ) : (
          <Link to="/profile/edit">
            {me.onboardingStatus === "preferences" ? "Start Your Profile" : "Edit Your Profile"}
          </Link>
        )}
      </p>
      {me.onboardingStatus === "complete" && <p>Onboarding complete — you're all set!</p>}
    </>
  );
}

export function HomePage() {
  return (
    <section id="center">
      <h1>SoulSync</h1>
      <HealthStatus />

      <SignedOut>
        <SignInButton mode="modal" />
      </SignedOut>

      <SignedIn>
        <UserButton />
        <OnboardingStatus />
      </SignedIn>
    </section>
  );
}
