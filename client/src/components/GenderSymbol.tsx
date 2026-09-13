import type { Gender } from "@soulsync/shared-types";

const SYMBOL: Record<Gender, string> = {
  man: "♂",
  woman: "♀",
  non_binary: "⚧",
};

const LABEL: Record<Gender, string> = {
  man: "Man",
  woman: "Woman",
  non_binary: "Non-binary",
};

export function GenderSymbol({ gender }: { gender?: Gender }) {
  if (!gender) return null;
  return (
    <span title={LABEL[gender]} aria-label={LABEL[gender]} className="text-neutral-400 dark:text-neutral-500">
      {SYMBOL[gender]}
    </span>
  );
}
