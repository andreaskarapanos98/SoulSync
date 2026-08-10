import type { ReactNode } from "react";

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-lg font-semibold text-neutral-900 dark:text-white">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}
