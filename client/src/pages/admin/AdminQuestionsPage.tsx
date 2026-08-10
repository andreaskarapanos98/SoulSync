import { useEffect, useState } from "react";
import { useAdminApi } from "../../hooks/useAdminApi";
import { AdminLayout } from "../../components/admin/AdminLayout";
import type { AdminQuestion } from "../../services/adminApi";

const QUESTION_TYPES = ["single_select", "multi_select", "scale", "number", "number_range", "text", "date"];
const SCORING_MECHANICS = ["hard_filter", "ranking", "mini_scale", "relative_self", "checklist", "filler"];

const EMPTY_DRAFT = {
  key: "",
  category: "lifestyle",
  appliesTo: "about_me" as "about_me" | "preference",
  type: "text",
  label: "",
  required: false,
  order: 0,
  active: true,
  optionsJson: "",
  scoringMechanic: "",
};

export function AdminQuestionsPage() {
  const api = useAdminApi();
  const [questions, setQuestions] = useState<AdminQuestion[] | null>(null);
  const [appliesTo, setAppliesTo] = useState<"about_me" | "preference" | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function load() {
    api.listQuestions(appliesTo).then((res) => setQuestions(res.questions));
  }

  useEffect(load, [api, appliesTo]);

  async function handleToggleActive(q: AdminQuestion) {
    await api.updateQuestion(q._id, { active: !q.active });
    load();
  }

  async function handleCreate() {
    setError(null);
    let options;
    if (draft.optionsJson.trim()) {
      try {
        options = JSON.parse(draft.optionsJson);
      } catch {
        setError("Options must be valid JSON, e.g. [{\"value\":\"a\",\"label\":\"A\"}]");
        return;
      }
    }
    setBusy(true);
    try {
      await api.createQuestion({
        key: draft.key,
        category: draft.category as AdminQuestion["category"],
        appliesTo: draft.appliesTo,
        type: draft.type as AdminQuestion["type"],
        label: draft.label,
        required: draft.required,
        order: draft.order,
        active: draft.active,
        options,
        scoringMechanic: draft.scoringMechanic ? (draft.scoringMechanic as AdminQuestion["scoringMechanic"]) : undefined,
      });
      setDraft(EMPTY_DRAFT);
      setShowForm(false);
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Questionnaire</h1>
        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          {showForm ? "Cancel" : "+ New question"}
        </button>
      </div>

      <div className="mt-4 flex gap-2">
        {[undefined, "about_me", "preference"].map((v) => (
          <button
            key={v ?? "all"}
            type="button"
            onClick={() => setAppliesTo(v as typeof appliesTo)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              appliesTo === v
                ? "bg-brand-500 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"
            }`}
          >
            {v ?? "all"}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Key">
              <input value={draft.key} onChange={(e) => setDraft({ ...draft, key: e.target.value })} className={inputCls} />
            </Field>
            <Field label="Category">
              <input
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Applies to">
              <select
                value={draft.appliesTo}
                onChange={(e) => setDraft({ ...draft, appliesTo: e.target.value as "about_me" | "preference" })}
                className={inputCls}
              >
                <option value="about_me">about_me</option>
                <option value="preference">preference</option>
              </select>
            </Field>
            <Field label="Type">
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className={inputCls}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Label" full>
              <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} className={inputCls} />
            </Field>
            {draft.appliesTo === "preference" && (
              <Field label="Scoring mechanic">
                <select
                  value={draft.scoringMechanic}
                  onChange={(e) => setDraft({ ...draft, scoringMechanic: e.target.value })}
                  className={inputCls}
                >
                  <option value="">—</option>
                  {SCORING_MECHANICS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Order">
              <input
                type="number"
                value={draft.order}
                onChange={(e) => setDraft({ ...draft, order: Number(e.target.value) })}
                className={inputCls}
              />
            </Field>
            <Field label="Options (JSON, optional)" full>
              <textarea
                value={draft.optionsJson}
                onChange={(e) => setDraft({ ...draft, optionsJson: e.target.value })}
                rows={2}
                placeholder='[{"value":"a","label":"A"}]'
                className={`${inputCls} font-mono`}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
              <input
                type="checkbox"
                checked={draft.required}
                onChange={(e) => setDraft({ ...draft, required: e.target.checked })}
              />
              Required
            </label>
          </div>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={handleCreate}
            disabled={busy || !draft.key || !draft.label}
            className="mt-3 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Create
          </button>
        </div>
      )}

      <div className="mt-4 overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400">
              <th className="px-4 py-2">Key</th>
              <th className="px-4 py-2">Applies to</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Label</th>
              <th className="px-4 py-2">Active</th>
            </tr>
          </thead>
          <tbody>
            {!questions ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-neutral-400">
                  Loading…
                </td>
              </tr>
            ) : (
              questions.map((q) => (
                <tr key={q._id} className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
                  <td className="px-4 py-2 font-mono text-xs text-neutral-600 dark:text-neutral-400">{q.key}</td>
                  <td className="px-4 py-2 text-neutral-500">{q.appliesTo}</td>
                  <td className="px-4 py-2 text-neutral-500">{q.category}</td>
                  <td className="px-4 py-2 text-neutral-500">{q.type}</td>
                  <td className="px-4 py-2 text-neutral-700 dark:text-neutral-300">{q.label}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(q)}
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        q.active
                          ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400"
                          : "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400"
                      }`}
                    >
                      {q.active ? "active" : "inactive"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}

const inputCls =
  "w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white";

function Field({ label, full, children }: { label: string; full?: boolean; children: React.ReactNode }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</label>
      {children}
    </div>
  );
}
