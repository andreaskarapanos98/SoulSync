import type { CategoryCompatibilityDTO } from "@soulsync/shared-types";
import { CATEGORY_TITLES } from "../../utils/onboardingCategories";

export function CompatibilityBreakdown({ items }: { items: CategoryCompatibilityDTO[] }) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Compatibility Breakdown</p>
      {items.map((item) => (
        <div key={item.category} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-sm text-neutral-700 dark:text-neutral-300">
            {CATEGORY_TITLES[item.category] ?? item.category}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${item.percent}%` }} />
          </div>
          <span className="w-10 shrink-0 text-right text-sm font-medium text-neutral-600 dark:text-neutral-400">
            {item.percent}%
          </span>
        </div>
      ))}
    </div>
  );
}
