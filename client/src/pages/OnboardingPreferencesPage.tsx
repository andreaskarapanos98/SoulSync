import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AnswerValue, PreferenceAnswerValue, QuestionDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { ApiError } from "../services/api";
import { PreferenceQuestionField } from "../components/onboarding/PreferenceQuestionField";
import { DealBreakerStep } from "../components/onboarding/DealBreakerStep";
import { ABOUT_ME_CATEGORY_ORDER, CATEGORY_TITLES } from "../utils/onboardingCategories";
import "./OnboardingAboutMePage.css";

function isEmptyValue(value: AnswerValue | undefined): boolean {
  return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

function isAnswered(question: QuestionDTO, entry: PreferenceAnswerValue | undefined): boolean {
  if (!entry?.importance) return false;
  if (question.valueCaptured === false) return true;
  return !isEmptyValue(entry.value);
}

export function OnboardingPreferencesPage() {
  const api = useApi();
  const navigate = useNavigate();

  const [preferenceQuestions, setPreferenceQuestions] = useState<QuestionDTO[] | null>(null);
  const [aboutMeQuestions, setAboutMeQuestions] = useState<QuestionDTO[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, PreferenceAnswerValue>>({});
  const [dealBreakers, setDealBreakers] = useState<Record<string, string[]>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

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

  if (loadError) return <p style={{ color: "crimson" }}>Couldn't load questionnaire: {loadError}</p>;
  if (!preferenceQuestions || !aboutMeQuestions) return <p>Loading your ideal soulmate questionnaire…</p>;

  const categories = ABOUT_ME_CATEGORY_ORDER.filter((c) =>
    preferenceQuestions.some((q) => q.category === c),
  );
  const dealBreakerQuestions = preferenceQuestions.filter((q) => q.canBeDealBreaker);
  const steps = [...categories, "deal_breakers"] as const;
  const currentStep = steps[stepIndex];
  const isDealBreakerStep = currentStep === "deal_breakers";

  if (done) {
    return (
      <div className="onboarding-page">
        <h2>Ideal Soulmate — done</h2>
        <p>Thanks! We've saved your preferences and deal breakers.</p>
        <button type="button" onClick={() => navigate("/")}>
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
        .map((q) => [q.key, answers[q.key]] as const)
        .filter(([, entry]) => entry?.importance),
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
    <div className="onboarding-page">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }} />
      </div>
      <p className="step-indicator">
        Step {stepIndex + 1} of {steps.length}
      </p>
      <h2>{CATEGORY_TITLES[currentStep] ?? currentStep}</h2>

      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      {isDealBreakerStep ? (
        <DealBreakerStep
          questions={dealBreakerQuestions}
          aboutMeOptionsByKey={aboutMeOptionsByKey}
          value={dealBreakers}
          onChange={(key, values) => setDealBreakers((prev) => ({ ...prev, [key]: values }))}
        />
      ) : (
        <div className="question-list">
          {stepQuestions.map((q) => (
            <div className="question-field" key={q.key}>
              <label>
                {q.label}
                {q.required && <span className="required-mark"> *</span>}
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

      <div className="step-nav">
        <button type="button" disabled={stepIndex === 0 || saving} onClick={() => goToStep(-1)}>
          Back
        </button>
        <button type="button" disabled={saving} onClick={() => goToStep(1)}>
          {saving ? "Saving…" : stepIndex === steps.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
