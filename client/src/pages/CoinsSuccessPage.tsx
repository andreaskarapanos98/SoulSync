import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useCoinBalance } from "../hooks/useCoinBalance";
import { CoinIcon } from "../components/CoinIcon";

export function CoinsSuccessPage() {
  const { balance, refresh } = useCoinBalance();

  useEffect(() => {
    // Stripe's webhook usually lands within a second or two of the redirect — poll a
    // couple of times so the balance shown here is fresh rather than stale-until-next-poll.
    refresh();
    const t1 = window.setTimeout(refresh, 1500);
    const t2 = window.setTimeout(refresh, 4000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      <span className="text-4xl">🎉</span>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">Payment successful!</h1>
      <p className="mt-2 inline-flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
        Your coin balance is now <CoinIcon /> {balance}.
      </p>
      <Link
        to="/matches"
        className="mt-6 rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Back to matches
      </Link>
    </div>
  );
}
