interface IntroPoint {
  icon: string;
  text: string;
}

interface Props {
  title: string;
  points: IntroPoint[];
  ctaLabel: string;
  onContinue: () => void;
}

// A short, friendly interstitial shown before a long questionnaire — sets expectations
// (time, effort) and re-motivates before asking someone to fill in 10+ minutes of forms.
export function IntroScreen({ title, points, ctaLabel, onContinue }: Props) {
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

      <button
        type="button"
        onClick={onContinue}
        className="mt-10 rounded-full bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600"
      >
        {ctaLabel}
      </button>
    </div>
  );
}
