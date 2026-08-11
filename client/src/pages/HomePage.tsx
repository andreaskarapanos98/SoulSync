import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SignedIn, SignedOut, SignUpButton } from "@clerk/clerk-react";
import type { MeDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { LogoMark } from "../components/Logo";

const FEATURES = [
  {
    icon: "🧮",
    title: "A real scoring engine, not a swipe deck",
    body: "Every answer you give is run through dozens of weighted compatibility dimensions — not a vibe, an actual calculation.",
  },
  {
    icon: "🚫",
    title: "Your deal breakers, respected",
    body: "Mark what's truly non-negotiable and we remove anyone who crosses it — before a percentage is ever calculated.",
  },
  {
    icon: "🎙️",
    title: "Hear them before you unlock",
    body: "Possibility to listen a short voice introduction, before spending a single coin.",
  },
  {
    icon: "✅",
    title: "Get Verified",
    body: "A quick identity check earns you a badge on your profile — verified people are trusted more, and get into conversations faster.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "About Me",
    body: "Tell us who you really are — your personality, lifestyle, values, and goals. Every answer is a real input.",
  },
  {
    n: "02",
    title: "Ideal Soulmate",
    body: "Define who you're looking for in the same detail, and mark the deal breakers that are truly non-negotiable for you.",
  },
  {
    n: "03",
    title: "Your Profile",
    body: "Add your photos and a short voice introduction — so someone can hear you before they ever unlock a conversation.",
  },
  {
    n: "04",
    title: "See Your Matches",
    body: "Get a real compatibility score, broken down by category, calculated both ways — so you know it's mutual.",
  },
];

const SAMPLE_BREAKDOWN = [
  { label: "Relationship Goals", percent: 92 },
  { label: "Personality", percent: 84 },
  { label: "Values", percent: 78 },
  { label: "Lifestyle", percent: 70 },
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
          Stop swiping. Start matching with people who actually <span className="text-brand-500">fit</span>.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-neutral-600 dark:text-neutral-400">
          SoulSync scores real compatibility across dozens of dimensions — personality, values, lifestyle, family
          goals, and more — calculated both ways, so you know it's mutual before you say a word.
        </p>
        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <SignUpButton mode="modal">
            <button className="rounded-full bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition hover:bg-brand-600">
              Get started free
            </button>
          </SignUpButton>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">Free to build your profile · No swiping · Real math</span>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">How it works</h2>
        <p className="mt-3 text-neutral-600 dark:text-neutral-400">
          Four short steps between signing up and seeing a real compatibility score.
        </p>
      </div>
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div
            key={s.n}
            className="rounded-2xl border border-brand-100 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <span className="text-sm font-bold text-brand-400">{s.n}</span>
            <h3 className="mt-2 text-lg font-semibold text-neutral-900 dark:text-white">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function AlgorithmSection() {
  return (
    <section className="border-y border-brand-100 bg-brand-50/50 dark:border-neutral-800 dark:bg-neutral-900/40">
      <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 lg:grid-cols-2 lg:items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1 text-xs font-semibold text-brand-700 dark:border-brand-900 dark:bg-neutral-950 dark:text-brand-300">
            <LogoMark size={14} /> How the score works
          </span>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            A compatibility score you can actually trust
          </h2>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">
            Unlike swipe apps, SoulSync doesn't guess. Your answers and theirs are run through a weighted scoring
            engine across every part of the questionnaire — relationship goals, personality, values, lifestyle,
            family, and more — with your deal breakers enforced before a single point is ever calculated.
          </p>
          <ul className="mt-6 flex flex-col gap-3 text-sm text-neutral-700 dark:text-neutral-300">
            <li className="flex items-start gap-2">
              <span className="text-brand-500">✓</span> Every category is weighted by how many real questions feed
              into it — no single answer can fake a high score.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-500">✓</span> Deal breakers are absolute — cross one, and that match is
              never shown to you, no matter how the rest scores.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-brand-500">✓</span> Every score is calculated in both directions, so a high
              match means you both actually fit what the other is looking for.
            </li>
          </ul>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white p-6 shadow-sm shadow-brand-100/50 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Example breakdown</p>
          <div className="mt-4 flex flex-col gap-3">
            {SAMPLE_BREAKDOWN.map((row) => (
              <div key={row.label} className="flex items-center gap-3">
                <span className="w-32 shrink-0 text-sm text-neutral-700 dark:text-neutral-300">{row.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${row.percent}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">
                  {row.percent}%
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-neutral-400">Illustrative — your real breakdown appears on every match.</p>
        </div>
      </div>
    </section>
  );
}

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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

function FinalCta() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 text-center">
      <div className="rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 px-8 py-16 shadow-xl shadow-brand-500/20">
        <h2 className="text-3xl font-bold tracking-tight text-white">Find out who you're actually compatible with</h2>
        <p className="mx-auto mt-3 max-w-xl text-brand-50">
          It takes about ten minutes to build your profile. What you get back is a real number, not a guess.
        </p>
        <SignUpButton mode="modal">
          <button className="mt-8 rounded-full bg-white px-8 py-3 text-base font-semibold text-brand-600 shadow-lg transition hover:bg-brand-50">
            Get started free
          </button>
        </SignUpButton>
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
          ? "Your profile is complete — take a look at your matches."
          : "Finish setting up your profile to get started."}
      </p>

      {me.onboardingStatus === "complete" && (
        <Link
          to="/matches"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600"
        >
          💘 See your matches
        </Link>
      )}

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

export function HomePage() {
  return (
    <div className="flex flex-1 flex-col">
      <SignedOut>
        <Hero />
        <HowItWorks />
        <AlgorithmSection />
        <FeatureGrid />
        <FinalCta />
      </SignedOut>
      <SignedIn>
        <Dashboard />
      </SignedIn>
    </div>
  );
}
