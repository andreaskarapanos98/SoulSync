interface Props {
  size?: number;
  className?: string;
}

// Heart (soul) wrapped by an open ring (sync) — the two halves of the app's name as one mark.
export function LogoMark({ size = 32, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="soulsync-heart" x1="14" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>
      <path
        d="M32 55A26.4 26.4 0 0 1 49.4 11.3M32 9A26.4 26.4 0 0 1 14.6 52.7"
        stroke="#fda4af"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M32 48C21.5 40 12 31.5 12 21.5 12 14.6 17.4 10 23.5 10c3.6 0 7 1.8 8.5 5 1.5-3.2 4.9-5 8.5-5C46.6 10 52 14.6 52 21.5 52 31.5 42.5 40 32 48Z"
        fill="url(#soulsync-heart)"
      />
    </svg>
  );
}

export function Logo({ size = 32, className }: Props) {
  return (
    <span className="flex items-center gap-2">
      <LogoMark size={size} className={className} />
      <span className="text-lg font-semibold text-neutral-900 dark:text-white">SoulSync</span>
    </span>
  );
}
