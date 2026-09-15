import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/**
 * Without this, any render-time exception unmounts the whole tree and leaves a blank
 * white page with nothing to do but guess at a refresh. Class component because React
 * still has no hook equivalent for componentDidCatch.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keeps the stack in the console for anyone debugging from a user's report; the
    // server-side error log only ever sees API failures, not render crashes.
    console.error("Render error:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-24 text-center">
        <span className="text-5xl">😵‍💫</span>
        <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
          Sorry — that's on us. Reloading usually sorts it out.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Reload the page
          </button>
          <a
            href="/"
            className="rounded-full border border-neutral-300 px-5 py-2.5 text-sm font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
          >
            Go home
          </a>
        </div>
      </div>
    );
  }
}
