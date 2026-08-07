import type { ImportanceLevel, PreferenceAnswerValue, QuestionDTO } from "@soulsync/shared-types";
import { QuestionField } from "./QuestionField";

const IMPORTANCE_OPTIONS: { value: ImportanceLevel; label: string }[] = [
  { value: "doesnt_matter", label: "Doesn't matter" },
  { value: "slight_preference", label: "Slight preference" },
  { value: "important", label: "Important" },
  { value: "very_important", label: "Very important" },
  { value: "must_have", label: "Must have" },
];

interface Props {
  question: QuestionDTO;
  value: PreferenceAnswerValue | undefined;
  onChange: (value: PreferenceAnswerValue) => void;
}

export function PreferenceQuestionField({ question, value, onChange }: Props) {
  return (
    <div className="preference-field">
      {question.valueCaptured !== false && (
        <QuestionField
          question={question}
          value={value?.value}
          onChange={(v) => onChange({ ...value, value: v, importance: value?.importance as ImportanceLevel })}
        />
      )}
      <select
        value={value?.importance ?? ""}
        onChange={(e) => onChange({ ...value, importance: e.target.value as ImportanceLevel })}
      >
        <option value="" disabled>
          How important is this?
        </option>
        {IMPORTANCE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
