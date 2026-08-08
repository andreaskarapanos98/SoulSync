import type { AnswerValue, QuestionDTO } from "@soulsync/shared-types";
import { QuestionField } from "./QuestionField";
import { RankingField } from "./RankingField";

interface Props {
  question: QuestionDTO;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

// Dispatches to the right input by scoringMechanic. Every mechanic except "ranking"
// captures the same shape as an about_me answer, so it reuses QuestionField directly.
export function PreferenceQuestionField({ question, value, onChange }: Props) {
  if (question.scoringMechanic === "ranking") {
    return (
      <RankingField
        question={question}
        value={Array.isArray(value) ? value : undefined}
        onChange={onChange}
      />
    );
  }
  return <QuestionField question={question} value={value} onChange={onChange} />;
}
