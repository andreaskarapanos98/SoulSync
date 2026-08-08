import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AnswerValue, QuestionDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { ApiError } from "../services/api";
import { QuestionField } from "../components/onboarding/QuestionField";
import { ABOUT_ME_CATEGORY_ORDER, CATEGORY_TITLES } from "../utils/onboardingCategories";

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

  if (loadError)
    return <p className="mx-auto max-w-lg px-6 py-16 text-red-600">Couldn't load questionnaire: {loadError}</p>;
  if (!questions) return <p className="mx-auto max-w-lg px-6 py-16 text-neutral-500">Loading your questionnaire…</p>;

  const categories = ABOUT_ME_CATEGORY_ORDER.filter((c) => questions.some((q) => q.category === c));

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16">
        <h2 className="text-2xl font-semibold text-neutral-900 dark:text-white">About Me — done</h2>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Thanks! We've saved everything. Next you'll describe your ideal soulmate.
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
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className="h-full bg-brand-500 transition-all"
          style={{ width: `${((stepIndex + 1) / categories.length) * 100}%` }}
        />
      </div>
      <p className="mt-2 text-sm text-neutral-500">
        Step {stepIndex + 1} of {categories.length}
      </p>
      <h2 className="mt-1 text-xl font-semibold text-neutral-900 dark:text-white">
        {CATEGORY_TITLES[currentCategory] ?? currentCategory}
      </h2>

      {errors.length > 0 && (
        <ul className="mt-4 list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {errors.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {stepQuestions.map((q) => (
          <div key={q.key} className="flex flex-col gap-2">
            <label className="text-sm font-medium text-neutral-900 dark:text-white">
              {q.label}
              {q.required && <span className="text-brand-500"> *</span>}
            </label>
            <QuestionField
              question={q}
              value={answers[q.key]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [q.key]: value }))}
            />
          </div>
        ))}
      </div>

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
          {saving ? "Saving…" : stepIndex === categories.length - 1 ? "Finish" : "Next"}
        </button>
      </div>
    </div>
  );
}
