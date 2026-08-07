import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AnswerValue, QuestionDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { ApiError } from "../services/api";
import { QuestionField } from "../components/onboarding/QuestionField";
import { ABOUT_ME_CATEGORY_ORDER, CATEGORY_TITLES } from "../utils/onboardingCategories";
import "./OnboardingAboutMePage.css";

function isEmpty(value: AnswerValue | undefined): boolean {
  return value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
}

export function OnboardingAboutMePage() {
  const api = useApi();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<QuestionDTO[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([api.getQuestions("about_me"), api.getAboutMeAnswers()])
      .then(([questionsRes, answersRes]) => {
        setQuestions(questionsRes.questions);
        setAnswers(answersRes.answers);
      })
      .catch((err) => setLoadError(String(err)));
    // api is a fresh object every render (memoized on getToken identity); safe to
    // omit here since we only want this to run once on mount.
  }, []);

  if (loadError) return <p style={{ color: "crimson" }}>Couldn't load questionnaire: {loadError}</p>;
  if (!questions) return <p>Loading your questionnaire…</p>;

  const categories = ABOUT_ME_CATEGORY_ORDER.filter((c) => questions.some((q) => q.category === c));

  if (done) {
    return (
      <div className="onboarding-page">
        <h2>About Me — done</h2>
        <p>Thanks! We've saved everything. Next you'll describe your ideal soulmate.</p>
        <button type="button" onClick={() => navigate("/")}>
          Back home
        </button>
      </div>
    );
  }

  const currentCategory = categories[stepIndex];
  const stepQuestions = questions
    .filter((q) => q.category === currentCategory)
    .sort((a, b) => a.order - b.order);

  function buildStepPayload() {
    return Object.fromEntries(
      stepQuestions
        .map((q) => [q.key, answers[q.key]] as const)
        .filter(([, v]) => !isEmpty(v)),
    );
  }

  async function goToStep(delta: number) {
    setErrors([]);

    if (delta > 0) {
      const missing = stepQuestions.filter((q) => q.required && isEmpty(answers[q.key]));
      if (missing.length > 0) {
        setErrors(missing.map((q) => `"${q.label}" is required`));
        return;
      }
    }

    const payload = buildStepPayload();
    setSaving(true);
    try {
      if (Object.keys(payload).length > 0) {
        await api.saveAboutMeAnswers(payload);
      }
      if (delta > 0 && stepIndex === categories.length - 1) {
        setDone(true);
      } else {
        setStepIndex((i) => Math.min(Math.max(i + delta, 0), categories.length - 1));
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
        <div
          className="progress-fill"
          style={{ width: `${((stepIndex + 1) / categories.length) * 100}%` }}
        />
      </div>
      <p className="step-indicator">
        Step {stepIndex + 1} of {categories.length}
      </p>
      <h2>{CATEGORY_TITLES[currentCategory] ?? currentCategory}</h2>

      {errors.length > 0 && (
        <ul className="error-list">
          {errors.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      <div className="question-list">
        {stepQuestions.map((q) => (
          <div className="question-field" key={q.key}>
            <label>
              {q.label}
              {q.required && <span className="required-mark"> *</span>}
            </label>
            <QuestionField
              question={q}
              value={answers[q.key]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [q.key]: value }))}
            />
          </div>
        ))}
      </div>

      <div className="step-nav">
        <button type="button" disabled={stepIndex === 0 || saving} onClick={() => goToStep(-1)}>
          Back
        </button>
        <button type="button" disabled={saving} onClick={() => goToStep(1)}>
          {saving ? "Saving…" : stepIndex === categories.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
