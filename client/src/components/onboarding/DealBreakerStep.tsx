import type { QuestionDTO } from "@soulsync/shared-types";

interface Props {
  // Preference questions flagged canBeDealBreaker.
  questions: QuestionDTO[];
  value: Record<string, string[]>;
  onChange: (key: string, unacceptableValues: string[]) => void;
  missingKeys?: Set<string>;
}

// Each deal breaker is phrased as a plain yes/no question here, independent of how its
// preference question is phrased elsewhere in the wizard. "Yes" stores the about_me
// option values that make the trait true (validated against the about_me question's own
// options by the backend), "No" stores an empty array — both count as answered.
const DEAL_BREAKER_CONFIG: Record<string, { question: string; yesValues: string[] }> = {
  has_children: {
    question: "Would it be a deal breaker if your soulmate already has children?",
    yesValues: ["one", "two", "three_plus"],
  },
  smoking: {
    question: "Would it be a deal breaker if your soulmate smokes cigarettes?",
    yesValues: ["occasionally", "regularly", "daily"],
  },
  vaping: {
    question: "Would it be a deal breaker if your soulmate uses electronic cigarettes?",
    yesValues: ["occasionally", "regularly", "daily"],
  },
  relationship_type: {
    question: "Would it be a deal breaker if your soulmate is looking for an open relationship?",
    yesValues: ["open"],
  },
};

export function DealBreakerStep({ questions, value, onChange, missingKeys }: Props) {
  return (
    <div className="flex flex-col gap-6">
      {questions.map((q) => {
        const config = DEAL_BREAKER_CONFIG[q.key];
        if (!config) return null;

        const answer = value[q.key];
        const answered = answer !== undefined;
        const isYes = answered && answer.length > 0;
        const isNo = answered && answer.length === 0;
        const isMissing = missingKeys?.has(q.key);

        return (
          <div key={q.key} className="flex flex-col gap-2">
            <label
              className={`text-sm font-medium ${isMissing ? "text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-white"}`}
            >
              {config.question} <span className="text-brand-500">*</span>
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => onChange(q.key, config.yesValues)}
                className={`rounded-full border px-6 py-2 text-sm font-medium transition ${
                  isYes
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => onChange(q.key, [])}
                className={`rounded-full border px-6 py-2 text-sm font-medium transition ${
                  isNo
                    ? "border-brand-500 bg-brand-500 text-white"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
                }`}
              >
                No
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
