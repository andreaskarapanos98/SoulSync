/** Animated "…" for the chat header — three dots bouncing in sequence. */
export function TypingDots({ label = "Typing" }: { label?: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-brand-500">
      {label}
      <span className="flex items-end gap-0.5 pb-0.5">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="animate-typing-dot h-1 w-1 rounded-full bg-brand-500"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </span>
    </span>
  );
}
