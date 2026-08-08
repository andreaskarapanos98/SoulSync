import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/clerk-react";
import type { HealthCheckResponse, MeDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

const FEATURES = [
  {
    icon: "💯",
    title: "Real compatibility scores",
    body: "Not a swipe deck. We compare who you are with what someone else is looking for — and show you the percentage, both ways.",
  },
  {
    icon: "🎙️",
    title: "Hear them before you unlock",
    body: "Every profile includes a 30-second voice introduction you can listen to for free, before spending a single coin.",
  },
  {
    icon: "🚫",
    title: "Your deal breakers, respected",
    body: "Set the things that are truly non-negotiable for you. We'll never surface a match that crosses them.",
  },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50 to-white dark:from-brand-950/20 dark:to-neutral-950" />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center sm:py-32">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-900 dark:bg-brand-950/40 dark:text-brand-300">
          A compatibility-based relationship app
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-neutral-900 sm:text-6xl dark:text-white">
          Find who you're actually <span className="text-brand-500">compatible</span> with
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          SoulSync isn't another swipe-based dating app. Tell us who you are and who you're looking
          for — we'll do the math and show you a real compatibility percentage, calculated both ways.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <SignUpButton mode="modal">
            <button className="rounded-full bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600">
              Get started free
            </button>
          </SignUpButton>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-24">
      <div className="grid gap-6 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-4 text-lg font-semibold text-neutral-900 dark:text-white">{f.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

type StepStatus = "done" | "current" | "upcoming";

function OnboardingStep({
  status,
  title,
  to,
  linkLabel,
}: {
  status: StepStatus;
  title: string;
  to: string;
  linkLabel: string;
}) {
  const badge =
    status === "done" ? (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-sm font-semibold text-white">
        ✓
      </span>
    ) : status === "current" ? (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-brand-500 text-sm font-semibold text-brand-500">
        •
      </span>
    ) : (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-neutral-200 text-sm text-neutral-300 dark:border-neutral-800 dark:text-neutral-700">
        ·
      </span>
    );

  return (
    <div className="flex items-center gap-4 rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
      {badge}
      <span
        className={
          status === "upcoming"
            ? "flex-1 text-neutral-400 dark:text-neutral-600"
            : "flex-1 font-medium text-neutral-900 dark:text-white"
        }
      >
        {title}
      </span>
      {status !== "upcoming" && (
        <Link to={to} className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function Dashboard() {
  const api = useApi();
  const [me, setMe] = useState<MeDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMe().then(setMe).catch((err) => setError(String(err)));
  }, [api]);

  if (error) return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load your account: {error}</p>;
  if (!me) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading your account…</p>;

  const order = ["not_started", "about_me", "preferences", "complete"];
  const stepIndex = order.indexOf(me.onboardingStatus === "profile" ? "preferences" : me.onboardingStatus);

  function statusFor(step: number): StepStatus {
    if (stepIndex > step || me!.onboardingStatus === "complete") return "done";
    if (stepIndex === step) return "current";
    return "upcoming";
  }

  return (
    <section className="mx-auto w-full max-w-lg px-6 py-16">
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Welcome back</h2>
      <p className="mt-1 text-neutral-600 dark:text-neutral-400">
        {me.onboardingStatus === "complete"
          ? "Your profile is complete — matching is coming soon."
          : "Finish setting up your profile to get started."}
      </p>

      <div className="mt-8 flex flex-col gap-3">
        <OnboardingStep
          status={statusFor(0) === "upcoming" ? "current" : statusFor(0)}
          title="About Me"
          to="/onboarding/about-me"
          linkLabel={me.onboardingStatus === "not_started" ? "Start" : "Edit"}
        />
        <OnboardingStep
          status={statusFor(1)}
          title="Ideal Soulmate"
          to="/onboarding/preferences"
          linkLabel={me.onboardingStatus === "about_me" ? "Start" : "Edit"}
        />
        <OnboardingStep
          status={statusFor(2)}
          title="Your Profile"
          to="/profile/edit"
          linkLabel={me.onboardingStatus === "preferences" ? "Start" : "Edit"}
        />
      </div>
    </section>
  );
}

function HealthFooter() {
  const [health, setHealth] = useState<HealthCheckResponse | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  return (
    <footer className="mt-auto py-6 text-center text-xs text-neutral-300 dark:text-neutral-700">
      {health ? `API connected` : "API unreachable"}
    </footer>
  );
}

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SignedOut>
        <Hero />
        <FeatureGrid />
      </SignedOut>
      <SignedIn>
        <Dashboard />
      </SignedIn>
      <HealthFooter />
    </div>
  );
}
