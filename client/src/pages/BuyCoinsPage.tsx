import { useEffect, useState } from "react";
import type { CoinPackagesResponseDTO, UnlockCostTierDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { ApiError } from "../services/api";
import { CoinIcon } from "../components/CoinIcon";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);
}

// Tiers arrive highest-to-lowest minCompatibility; the range's upper bound is one below
// the next-higher tier's floor (e.g. a 98 floor next to a 100 floor reads as "98-99%").
function tierRangeLabel(tiers: UnlockCostTierDTO[], index: number): string {
  const tier = tiers[index];
  if (tier.minCompatibility >= 100) return "100%";
  const upper = index > 0 ? tiers[index - 1].minCompatibility - 1 : 100;
  return `${tier.minCompatibility}–${upper}%`;
}

export function BuyCoinsPage() {
  const api = useApi();
  const [data, setData] = useState<CoinPackagesResponseDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [buyingId, setBuyingId] = useState<string | null>(null);

  useEffect(() => {
    api.getCoinPackages().then(setData).catch((err) => setError(String(err)));
  }, [api]);

  async function handleBuy(packageId: string) {
    setBuyingId(packageId);
    setError(null);
    try {
      const { url } = await api.createCoinCheckout(packageId);
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 503
          ? "Coin purchases aren't set up yet — check back soon."
          : String(err),
      );
      setBuyingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">Buy SoulSync Coins</h1>
      <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
        Coins unlock full profiles so you can view details and start chatting.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {!data ? (
        <p className="mt-8 text-neutral-500 dark:text-neutral-400">Loading packages…</p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {data.packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex items-center justify-between rounded-2xl border border-brand-100 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div>
                <p className="flex items-center gap-1.5 text-lg font-semibold text-neutral-900 dark:text-white">
                  <CoinIcon className="h-5 w-5" /> {pkg.coins}
                </p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                  {formatPrice(pkg.priceCents, pkg.currency)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleBuy(pkg.id)}
                disabled={buyingId !== null}
                className="rounded-full bg-brand-500 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {buyingId === pkg.id ? "Redirecting…" : "Buy"}
              </button>
            </div>
          ))}
        </div>
      )}

      {data && (
        <div className="mt-10">
          <h2 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Unlock cost by compatibility</h2>
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
            The higher your match, the more it costs to unlock — and the more it's worth it.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-sm">
              <tbody>
                {data.unlockCostTiers.map((tier, i) => (
                  <tr
                    key={tier.minCompatibility}
                    className="border-t border-neutral-100 first:border-t-0 dark:border-neutral-800"
                  >
                    <td className="px-4 py-2 text-neutral-600 dark:text-neutral-400">
                      {tierRangeLabel(data.unlockCostTiers, i)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-neutral-800 dark:text-neutral-200">
                      <span className="inline-flex items-center gap-1">
                        {tier.minCompatibility >= 100 ? "❤️" : <CoinIcon />} {tier.coins} Coins
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
