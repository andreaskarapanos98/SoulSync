/** Generic person silhouette shown until a user picks a profile photo — distinct from the app logo so it doesn't read as a branding mark. */
export function DefaultAvatarIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="text-brand-300 dark:text-brand-700"
    >
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" fill="currentColor" />
    </svg>
  );
}
