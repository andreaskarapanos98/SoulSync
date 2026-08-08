import type { QuestionDTO } from "@soulsync/shared-types";

interface Props {
  question: QuestionDTO;
  value: string[] | undefined;
  onChange: (value: string[]) => void;
}

// Reorderable list (up/down, no drag dependency) capturing a full best-to-worst ranking.
// An empty array is a deliberate "I don't care" — distinct from `undefined` (untouched).
export function RankingField({ question, value, onChange }: Props) {
  const options = question.options ?? [];
  const dontCare = value !== undefined && value.length === 0;
  const order = value && value.length > 0 ? value : options.map((o) => o.value);
  const labelByValue = new Map(options.map((o) => [o.value, o.label]));

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <div className="flex flex-col gap-2">
      {!question.required && (
        <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
          <input
            type="checkbox"
            checked={dontCare}
            onChange={(e) => onChange(e.target.checked ? [] : options.map((o) => o.value))}
          />
          I don't care
        </label>
      )}
      {!dontCare && (
        <ol className="flex flex-col gap-1">
          {order.map((optValue, i) => (
            <li
              key={optValue}
              className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <span>
                <span className="mr-2 text-neutral-400">{i + 1}.</span>
                {labelByValue.get(optValue) ?? optValue}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  className="rounded px-2 py-0.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-neutral-800"
                >
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
