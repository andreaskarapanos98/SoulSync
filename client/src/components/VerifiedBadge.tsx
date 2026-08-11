/** Identity-verified checkmark — hand-written SVG rather than an emoji (✅ renders inconsistently across platforms), same reasoning as CoinIcon/DefaultAvatarIcon. */
export function VerifiedBadge({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      role="img"
      aria-label="Verified"
    >
      <title>Verified</title>
      <circle cx="12" cy="12" r="10" fill="#3b82f6" />
      <path d="M7.5 12.5l3 3 6-6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
