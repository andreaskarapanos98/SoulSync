import { useEffect, useState } from "react";
import type { HealthCheckResponse } from "@soulsync/shared-types";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

function App() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then((data: HealthCheckResponse) => setHealth(data))
      .catch((err) => setError(String(err)));
  }, []);

  return (
    <section id="center">
      <h1>SoulSync</h1>
      {error && <p style={{ color: "crimson" }}>API error: {error}</p>}
      {!error && !health && <p>Checking API connection…</p>}
      {health && (
        <p>
          API status: <strong>{health.status}</strong> ({health.timestamp})
        </p>
      )}
    </section>
  );
}

export default App;
