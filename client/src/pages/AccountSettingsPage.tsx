import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useClerk } from "@clerk/clerk-react";
import { useApi } from "../hooks/useApi";

export function AccountSettingsPage() {
  const api = useApi();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setError(null);
    try {
      const blob = await api.exportMyData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "soulsync-data-export.json";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(String(err));
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      await api.deleteMyAccount();
      await signOut();
      navigate("/");
    } catch (err) {
      setError(String(err));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Account Settings</h1>

      <div className="mt-6 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Export your data</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Download everything SoulSync has stored about your account — questionnaire answers,
          profile, messages, coin transactions, and notifications — as a JSON file.
        </p>
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="mt-3 rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {exporting ? "Preparing…" : "Download my data"}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-red-200 p-4 dark:border-red-900">
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Delete account</h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          Permanently deletes your sign-in, profile, photos, voice recordings, and questionnaire
          answers. This can't be undone. Financial records are kept for accounting purposes but
          are no longer tied to any personal information of yours. See our{" "}
          <Link to="/legal/privacy" className="text-brand-600 underline dark:text-brand-400">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">
          Type DELETE to confirm
        </p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
        />
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting || confirmText !== "DELETE"}
          className="mt-3 rounded-full bg-red-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40"
        >
          {deleting ? "Deleting…" : "Permanently delete my account"}
        </button>
      </div>
    </div>
  );
}
