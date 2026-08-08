import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AnswerValue, QuestionDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { ApiError } from "../services/api";
import { PreferenceQuestionField } from "../components/onboarding/PreferenceQuestionField";
import { DealBreakerStep } from "../components/onboarding/DealBreakerStep";
import { IntroScreen } from "../components/onboarding/IntroScreen";
import { ABOUT_ME_CATEGORY_ORDER, CATEGORY_TITLES } from "../utils/onboardingCategories";

function isEmptyValue(value: AnswerValue | undefined): boolean {
  return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

// Ranking questions treat an empty array as a deliberate "I don't care", not "unanswered" —
// only `undefined` (never touched) counts as unanswered for them.
function isAnswered(question: QuestionDTO, value: AnswerValue | undefined): boolean {
  if (question.scoringMechanic === "ranking") return value !== undefined;
  return !isEmptyValue(value);
}

function includeInPayload(question: QuestionDTO, value: AnswerValue | undefined): boolean {
  if (question.scoringMechanic === "ranking") return value !== undefined;
  return !isEmptyValue(value);
}

export function OnboardingPreferencesPage() {
  const api = useApi();
  const navigate = useNavigate();

  const [preferenceQuestions, setPreferenceQuestions] = useState<QuestionDTO[] | null>(null);
  const [aboutMeQuestions, setAboutMeQuestions] = useState<QuestionDTO[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [dealBreakers, setDealBreakers] = useState<Record<string, string[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getQuestions("preference"),
      api.getQuestions("about_me"),
      api.getPreferenceAnswers(),
      api.getDealBreakers(),
    ])
      .then(([prefRes, aboutMeRes, answersRes, dealBreakersRes]) => {
        setPreferenceQuestions(prefRes.questions);
        setAboutMeQuestions(aboutMeRes.questions);
        setAnswers(answersRes.answers);
        setDealBreakers(dealBreakersRes.dealBreakers);
      })
      .catch((err) => setLoadError(String(err)));
  }, []);

  if (showIntro) {
    return (
      <IntroScreen
        title="Let's find your ideal soulmate"
        points={[
          { icon: "⏱️", text: "This process will take around 10 minutes." },
          { icon: "🕰️", text: "Please take your time and think carefully about what matters to you." },
          { icon: "💘", text: "The more honest you are, the better your matches will be." },
        ]}
        ctaLabel="Let's start"
        onContinue={() => setShowIntro(false)}
      />
    );
  }

  if (loadError)
    return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load questionnaire: {loadError}</p>;
  if (!preferenceQuestions || !aboutMeQuestions)
    return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading your ideal soulmate questionnaire…</p>;

  const categories = ABOUT_ME_CATEGORY_ORDER.filter((c) =>
    preferenceQuestions.some((q) => q.category === c),
  );
  const dealBreakerQuestions = preferenceQuestions.filter((q) => q.canBeDealBreaker);
  const steps = [...categories, "deal_breakers"] as const;
  const currentStep = steps[stepIndex];
  const isDealBreakerStep = currentStep === "deal_breakers";

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">Ideal Soulmate — done</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Thanks! We've saved your preferences and deal breakers.
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-6 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Back home
        </button>
      </div>
    );
  }

  const stepQuestions = preferenceQuestions
    .filter((q) => q.category === currentStep)
    .sort((a, b) => a.order - b.order);

  const aboutMeOptionsByKey = Object.fromEntries(
    aboutMeQuestions.filter((q) => q.options).map((q) => [q.key, q.options!]),
  );

  function buildStepPayload() {
    return Object.fromEntries(
      stepQuestions
        .map((q) => [q, answers[q.key]] as const)
        .filter(([q, value]) => includeInPayload(q, value))
        .map(([q, value]) => [q.key, value]),
    );
  }

  async function goToStep(delta: number) {
    setErrors([]);

    if (delta > 0 && !isDealBreakerStep) {
      const missing = stepQuestions.filter((q) => q.required && !isAnswered(q, answers[q.key]));
      if (missing.length > 0) {
        setErrors(missing.map((q) => `"${q.label}" is required`));
        return;
      }
    }

    setSaving(true);
    try {
      if (isDealBreakerStep) {
        await api.saveDealBreakers(dealBreakers);
      } else {
        const payload = buildStepPayload();
        if (Object.keys(payload).length > 0) {
          await api.savePreferenceAnswers(payload);
        }
      }

      if (delta > 0 && stepIndex === steps.length - 1) {
        setDone(true);
      } else {
        setStepIndex((i) => Math.min(Math.max(i + delta, 0), steps.length - 1));
      }
    } catch (err) {
      setErrors(err instanceof ApiError && err.issues ? err.issues : [String(err)]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-brand-500 transition-all"
          style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        Step {stepIndex + 1} of {steps.length}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-neutral-900 dark:text-white">
        {CATEGORY_TITLES[currentStep] ?? currentStep}
      </h2>

      {errors.length > 0 && (
        <ul className="mt-4 list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {errors.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      {isDealBreakerStep ? (
        <div className="mt-6">
          <DealBreakerStep
            questions={dealBreakerQuestions}
            aboutMeOptionsByKey={aboutMeOptionsByKey}
            value={dealBreakers}
            onChange={(key, values) => setDealBreakers((prev) => ({ ...prev, [key]: values }))}
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-6">
          {stepQuestions.map((q) => (
            <div key={q.key} className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-900 dark:text-white">
                {q.label}
                {q.required && <span className="text-brand-500"> *</span>}
              </label>
              <PreferenceQuestionField
                question={q}
                value={answers[q.key]}
                onChange={(value) => setAnswers((prev) => ({ ...prev, [q.key]: value }))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          disabled={stepIndex === 0 || saving}
          onClick={() => goToStep(-1)}
          className="rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-40 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-900"
        >
          Back
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => goToStep(1)}
          className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Saving…" : stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
