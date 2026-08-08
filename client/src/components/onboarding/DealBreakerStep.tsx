import type { QuestionDTO, QuestionOptionDTO } from "@soulsync/shared-types";

interface Props {
  // Preference questions flagged canBeDealBreaker.
  questions: QuestionDTO[];
  // The matching about_me sibling's options — a deal breaker constrains the
  // candidate's actual trait, so the checkboxes come from the about_me option set.
  aboutMeOptionsByKey: Record<string, QuestionOptionDTO[]>;
  value: Record<string, string[]>;
  onChange: (key: string, unacceptableValues: string[]) => void;
}

export function DealBreakerStep({ questions, aboutMeOptionsByKey, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-3 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm leading-relaxed text-brand-900 dark:border-brand-900 dark:bg-brand-950/30 dark:text-brand-200">
        <span className="text-xl leading-none">🚫</span>
        <div>
          <p className="font-semibold">What's a deal breaker?</p>
          <p className="mt-1">
            Check a box below only if you could <strong>never</strong> accept that trait in a soulmate —
            no matter how well you match otherwise, anyone with a checked trait is removed from your
            matches entirely.
          </p>
          <p className="mt-1">
            Leaving a question fully unchecked is completely fine — it just means nothing there is
            non-negotiable for you, and it's already covered by how you ranked your preferences. Nothing
            here is required.
          </p>
        </div>
      </div>

      {questions.map((q) => {
        const options = aboutMeOptionsByKey[q.key] ?? [];
        const selected = new Set(value[q.key] ?? []);
        return (
          <div key={q.key} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-white">{q.label}</label>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Check any trait you could <strong>not</strong> accept. Leave unchecked if it doesn't matter to you.
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {options.map((o) => {
                const checked = selected.has(o.value);
                return (
                  <label
                    key={o.value}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${
                      checked
                        ? "border-red-300 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400"
                        : "border-neutral-200 text-neutral-700 dark:border-neutral-700 dark:text-neutral-300"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="accent-red-500"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(o.value);
                        else next.delete(o.value);
                        onChange(q.key, Array.from(next));
                      }}
                    />
                    {o.label}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
