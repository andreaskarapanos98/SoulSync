import type { ReactNode } from "react";

/**
 * Wraps the native sign-in/sign-up pages so our Google button and Clerk's own form read
 * as one card instead of two stacked panels: our own heading on top, the social button
 * where a social button belongs, an "or" divider, then Clerk's form with its card chrome
 * and duplicate heading stripped (see the .native-auth-card rules in index.css — Clerk's
 * styles beat its `appearance` prop, so those are applied as CSS).
 *
 * `children` is expected to be [social button, Clerk component] in that order.
 */
export function NativeAuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const [social, clerkForm] = Array.isArray(children) ? children : [null, children];

  return (
    <div className="mx-auto w-full max-w-sm px-6 py-8">
      <div className="native-auth-card rounded-2xl border border-neutral-200 bg-white px-6 pt-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <h1 className="text-center text-xl font-semibold text-neutral-900 dark:text-white">{title}</h1>
        <p className="mt-1 text-center text-sm text-neutral-500 dark:text-neutral-400">{subtitle}</p>

        <div className="mt-6">{social}</div>

        <div className="mb-1 flex items-center gap-3 text-xs text-neutral-400">
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
          or
          <span className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
        </div>

        {clerkForm}
      </div>
    </div>
  );
}
