import { useEffect, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import type { HealthCheckResponse } from "@soulsync/shared-types";
import "./App.css";

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

function ProtectedMe() {
  const { getToken } = useAuth();
  const [me, setMe] = useState<{ userId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getToken()
      .then((token) =>
        fetch(`${API_URL}/api/v1/me`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      )
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      })
      .then(setMe)
      .catch((err) => setError(String(err)));
  }, [getToken]);

  if (error) return <p style={{ color: "crimson" }}>/api/v1/me error: {error}</p>;
  if (!me) return <p>Calling protected route…</p>;
  return (
    <p>
      Protected route confirms Clerk userId: <code>{me.userId}</code>
    </p>
  );
}

function App() {
  return (
    <section id="center">
      <h1>SoulSync</h1>
      <HealthStatus />

      <SignedOut>
        <SignInButton mode="modal" />
      </SignedOut>

      <SignedIn>
        <UserButton />
        <ProtectedMe />
      </SignedIn>
    </section>
  );
}

export default App;
