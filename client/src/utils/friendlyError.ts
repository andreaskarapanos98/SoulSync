import { ApiError } from "../services/api";

/**
 * Turns whatever a failed request threw into something worth showing a person.
 *
 * Call sites used to render String(err), which puts things like
 * "Error: API request failed with status 500" or "TypeError: Failed to fetch" in front of
 * the user — the status code is noise to them, and "Failed to fetch" reads like a bug
 * when it usually just means their connection dropped.
 */
export function friendlyError(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (err instanceof ApiError) {
    // A chat ban carries the raw expiry so it can be shown in the *viewer's* timezone
    // rather than whatever the server rendered in.
    if (err.chatBanUntil) {
      const until = new Date(err.chatBanUntil).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      return `You're restricted from chatting until ${until}.`;
    }
    // Validation problems from the server are already written for people.
    if (err.issues?.length) return err.issues.join(" ");

    switch (err.status) {
      case 401:
        return "Your session has expired — please sign in again.";
      case 402:
        return "You don't have enough coins for that.";
      case 403:
        return "You don't have access to that.";
      case 404:
        return "We couldn't find that — it may have been removed.";
      case 413:
        return "That file is too large.";
      case 429:
        return "That was a little too quick — give it a moment and try again.";
      default:
        return err.status >= 500 ? "Something went wrong on our end. Please try again in a moment." : fallback;
    }
  }

  // fetch() rejects with a TypeError when the network is the problem; the exact wording
  // ("Failed to fetch" / "NetworkError..." / "Load failed") differs per browser.
  if (err instanceof Error && /fetch|network|load failed/i.test(err.message)) {
    return typeof navigator !== "undefined" && navigator.onLine === false
      ? "You're offline — check your connection and try again."
      : "Couldn't reach SoulSync. Check your connection and try again.";
  }

  return fallback;
}
