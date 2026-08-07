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
    <div className="question-list">
      {questions.map((q) => {
        const options = aboutMeOptionsByKey[q.key] ?? [];
        const selected = new Set(value[q.key] ?? []);
        return (
          <div className="question-field" key={q.key}>
            <label>Which of these would be a deal breaker for "{q.label}"?</label>
            <div className="checkbox-group">
              {options.map((o) => (
                <label key={o.value}>
                  <input
                    type="checkbox"
                    checked={selected.has(o.value)}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(o.value);
                      else next.delete(o.value);
                      onChange(q.key, Array.from(next));
                    }}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
