import type { AnswerValue, QuestionDTO } from "@soulsync/shared-types";

interface Props {
  question: QuestionDTO;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function QuestionField({ question, value, onChange }: Props) {
  switch (question.type) {
    case "text":
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );

    case "number":
      return (
        <input
          type="number"
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
        <div className="scale-field">
          <input
            type="range"
            min={min}
            max={max}
            value={current}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="scale-value">{current}</span>
        </div>
      );
    }

    case "single_select":
      return (
        <select value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
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
        <div className="checkbox-group">
          {question.options?.map((o) => (
            <label key={o.value}>
              <input
                type="checkbox"
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
