import { useState } from "react";
import { Link } from "react-router-dom";

interface IntroPoint {
  icon: string;
  text: string;
}

interface Props {
  title: string;
  points: IntroPoint[];
  ctaLabel: string;
  onContinue: () => void;
  // Shown only on the very first onboarding step — asking again on every subsequent
  // intro screen would just be repetitive friction.
  requireConsent?: boolean;
}

// A short, friendly interstitial shown before a long questionnaire — sets expectations
// (time, effort) and re-motivates before asking someone to fill in 10+ minutes of forms.
export function IntroScreen({ title, points, ctaLabel, onContinue, requireConsent }: Props) {
  const [consented, setConsented] = useState(false);
  const blocked = Boolean(requireConsent) && !consented;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <span className="text-4xl">💕</span>
      <h2 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">{title}</h2>

      <ul className="mt-8 flex flex-col gap-4 text-left">
        {points.map((p) => (
          <li key={p.text} className="flex items-start gap-3">
            <span className="text-xl leading-none">{p.icon}</span>
            <span className="text-neutral-600 dark:text-neutral-400">{p.text}</span>
          </li>
        ))}
      </ul>

      {requireConsent && (
        <label className="mt-8 flex items-start gap-2 text-left text-sm text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={consented}
            onChange={(e) => setConsented(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          <span>
            I confirm I'm at least 18 years old and agree to the{" "}
            <Link to="/legal/terms" target="_blank" className="text-brand-600 underline dark:text-brand-400">
              Terms of Service
            </Link>
            ,{" "}
            <Link to="/legal/privacy" target="_blank" className="text-brand-600 underline dark:text-brand-400">
              Privacy Policy
            </Link>
            , and{" "}
            <Link to="/legal/community-guidelines" target="_blank" className="text-brand-600 underline dark:text-brand-400">
              Community Guidelines
            </Link>
            , including how my photos and voice recordings will be processed.
          </span>
        </label>
      )}

      <button
        type="button"
        onClick={onContinue}
        disabled={blocked}
        className="mt-10 rounded-full bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 disabled:opacity-40"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
