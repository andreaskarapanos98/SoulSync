import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AnswerValue, QuestionDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { ApiError } from "../services/api";
import { QuestionField } from "../components/onboarding/QuestionField";
import { IntroScreen } from "../components/onboarding/IntroScreen";
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
  const [showMandatoryNotice, setShowMandatoryNotice] = useState(false);
  const [missingKeys, setMissingKeys] = useState<Set<string>>(new Set());
  const [apiErrors, setApiErrors] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    Promise.all([api.getQuestions("about_me"), api.getAboutMeAnswers()])
      .then(([questionsRes, answersRes]) => {
        setQuestions(questionsRes.questions);
        setAnswers(answersRes.answers);
      })
      .catch((err) => setLoadError(String(err)));
    api.trackEvent("onboarding_started");
    // api is a fresh object every render (memoized on getToken identity); safe to
    // omit here since we only want this to run once on mount.
  }, []);

  if (showIntro) {
    return (
      <IntroScreen
        title="Let's get to know you"
        points={[
          { icon: "⏱️", text: "This process will take around 10 minutes." },
          { icon: "🕰️", text: "Please take your time and fill in all the information." },
          { icon: "💞", text: "Your soulmate is out there waiting for you to match." },
        ]}
        ctaLabel="Let's start"
        onContinue={() => setShowIntro(false)}
        requireConsent
      />
    );
  }

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

  function handleAnswerChange(key: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (missingKeys.has(key) && !isEmpty(value)) {
      setMissingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  async function goToStep(delta: number) {
    setShowMandatoryNotice(false);
    setApiErrors([]);

    if (delta > 0) {
      const missing = stepQuestions.filter((q) => q.required && isEmpty(answers[q.key]));
      if (missing.length > 0) {
        setMissingKeys(new Set(missing.map((q) => q.key)));
        setShowMandatoryNotice(true);
        return;
      }
    }
    setMissingKeys(new Set());

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
      setApiErrors(err instanceof ApiError && err.issues ? err.issues : [String(err)]);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
    <div className="rounded-3xl border border-brand-100 bg-white/80 p-8 shadow-sm shadow-brand-100/50 dark:border-neutral-800 dark:bg-neutral-900/60 dark:shadow-none">
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

      {showMandatoryNotice && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
          All questions are mandatory.
        </p>
      )}
      {apiErrors.length > 0 && (
        <ul className="mt-4 list-inside list-disc rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {apiErrors.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {stepQuestions.map((q) => (
          <div key={q.key} className="flex flex-col gap-2">
            <label
              className={`text-sm font-medium ${missingKeys.has(q.key) ? "text-red-600 dark:text-red-400" : "text-neutral-900 dark:text-white"}`}
            >
              {q.label}
              {q.required && <span className="text-brand-500"> *</span>}
            </label>
            <QuestionField
              question={q}
              value={answers[q.key]}
              onChange={(value) => handleAnswerChange(q.key, value)}
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
    </div>
  );
}
