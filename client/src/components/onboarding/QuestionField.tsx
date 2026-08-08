import type { AnswerValue, QuestionDTO } from "@soulsync/shared-types";

interface Props {
  question: QuestionDTO;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

const textInputClass =
  "rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white dark:focus:ring-brand-900";

export function QuestionField({ question, value, onChange }: Props) {
  switch (question.type) {
    case "text":
      return (
        <input
          type="text"
          className={textInputClass}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "date":
      return (
        <input
          type="date"
          className={textInputClass}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
          className={textInputClass}
          min={question.min}
          max={question.max}
          value={typeof value === "number" ? value : ""}
          onChange={(e) => onChange(Number(e.target.value))}
        />
      );

    case "scale": {
      const min = question.min ?? 1;
      const max = question.max ?? 5;
      const current = typeof value === "number" ? value : Math.round((min + max) / 2);
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <span className="w-6 text-center text-sm font-medium text-neutral-700 dark:text-neutral-300">
            {current}
          </span>
        </div>
      );
    }

    case "single_select":
      return (
        <select
          className={textInputClass}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="" disabled>
            Select…
          </option>
          {question.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );

    case "multi_select": {
      const selected = new Set(Array.isArray(value) ? value : []);
      return (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {question.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                className="accent-brand-500"
                checked={selected.has(o.value)}
                onChange={(e) => {
                  const next = new Set(selected);
                  if (e.target.checked) next.add(o.value);
                  else next.delete(o.value);
                  onChange(Array.from(next));
                }}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
  }
}
