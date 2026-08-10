import { Link } from "react-router-dom";
import { useCoinBalance } from "../hooks/useCoinBalance";

export function CoinBalanceBadge() {
  const { balance } = useCoinBalance();

  return (
    <Link
      to="/coins"
      title="Buy coins"
      className="flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-sm font-semibold text-brand-700 hover:bg-brand-100 dark:bg-neutral-800 dark:text-brand-300 dark:hover:bg-neutral-700"
    >
      🪙 {balance}
    </Link>
  );
}
