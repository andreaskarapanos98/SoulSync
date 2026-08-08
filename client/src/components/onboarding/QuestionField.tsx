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
      const max = question.max ?? 10;
      const hasValue = typeof value === "number";
      // Unset starts the thumb at the leftmost position, greyed out — it must look
      // untouched, not like a real (misleading) default answer, since this is mandatory.
      const current = hasValue ? value : min;
      // Covers a mouse click that lands exactly on the default (min) position, which
      // wouldn't otherwise fire a change event since the value doesn't move.
      const commitIfUnset = () => {
        if (!hasValue) onChange(current);
      };
      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            value={current}
            onPointerDown={commitIfUnset}
            onChange={(e) => onChange(Number(e.target.value))}
            className={`flex-1 ${hasValue ? "accent-brand-500" : "accent-neutral-300 dark:accent-neutral-700"}`}
          />
          <span
            className={`w-16 text-center text-sm font-medium ${hasValue ? "text-neutral-700 dark:text-neutral-300" : "text-neutral-400 dark:text-neutral-600"}`}
          >
            {hasValue ? current : "Not set"}
          </span>
        </div>
      );
    }

    case "number_range": {
      const min = question.min ?? 18;
      const max = question.max ?? 99;
      const [lo, hi] =
        Array.isArray(value) && value.length === 2 && typeof value[0] === "number"
          ? (value as number[])
          : [min, max];
      const options = Array.from({ length: max - min + 1 }, (_, i) => min + i);
      const labelFor = (n: number) => (n === max ? `${n}+` : String(n));
      // Low end pinned to "max+" (e.g. 60+) has no meaningful upper bound — lock "to" at max.
      const noUpperBound = lo === max;

      return (
        <div className="flex items-center gap-3">
          <select
            className={textInputClass}
            value={lo}
            onChange={(e) => {
              const nextLo = Number(e.target.value);
              onChange([nextLo, nextLo === max ? max : Math.max(nextLo, hi)]);
            }}
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {labelFor(n)}
              </option>
            ))}
          </select>
          <span className="text-sm text-neutral-500">to</span>
          <select
            className={`${textInputClass} disabled:cursor-not-allowed disabled:opacity-50`}
            value={noUpperBound ? max : hi}
            disabled={noUpperBound}
            onChange={(e) => {
              const nextHi = Number(e.target.value);
              onChange([Math.min(lo, nextHi), nextHi]);
            }}
          >
            {options.map((n) => (
              <option key={n} value={n}>
                {labelFor(n)}
              </option>
            ))}
          </select>
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
      const selected = new Set(Array.isArray(value) ? (value as string[]) : []);
      const exclusiveValues = new Set(question.options?.filter((o) => o.exclusive).map((o) => o.value));

      function toggle(optionValue: string, checked: boolean, isExclusive: boolean) {
        // Checking an exclusive option (e.g. "No pets") clears everything else; checking
        // any other option clears whichever exclusive option was selected. They can never
        // coexist.
        const next = isExclusive
          ? new Set(checked ? [optionValue] : [])
          : new Set([...selected].filter((v) => !exclusiveValues.has(v)));
        if (!isExclusive) {
          if (checked) next.add(optionValue);
          else next.delete(optionValue);
        }
        onChange(Array.from(next));
      }

      return (
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {question.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-1.5 text-sm text-neutral-700 dark:text-neutral-300">
              <input
                type="checkbox"
                className="accent-brand-500"
                checked={selected.has(o.value)}
                onChange={(e) => toggle(o.value, e.target.checked, Boolean(o.exclusive))}
              />
              {o.label}
            </label>
          ))}
        </div>
      );
    }
  }
}
