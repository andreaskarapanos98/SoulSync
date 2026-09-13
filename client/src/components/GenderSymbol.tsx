import type { Gender } from "@soulsync/shared-types";
import manIcon from "../assets/gender-man.png";
import womanIcon from "../assets/gender-woman.png";
import nonBinaryIcon from "../assets/gender-non-binary.png";

const ICON: Record<Gender, string> = {
  man: manIcon,
  woman: womanIcon,
  non_binary: nonBinaryIcon,
};

const LABEL: Record<Gender, string> = {
  man: "Man",
  woman: "Woman",
  non_binary: "Non-binary",
};

export function GenderSymbol({ gender, className = "h-3.5 w-3.5" }: { gender?: Gender; className?: string }) {
  if (!gender) return null;
  return (
    <img
      src={ICON[gender]}
      alt={LABEL[gender]}
      title={LABEL[gender]}
      // Solid-black source icons — dark:invert flips them to white on a dark background
      // instead of going invisible; the alpha channel (transparent background) is
      // untouched by the filter, so only the glyph itself flips color.
      className={`inline-block shrink-0 object-contain opacity-60 dark:opacity-70 dark:invert ${className}`}
    />
  );
}
