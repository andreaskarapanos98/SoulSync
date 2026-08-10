import { useEffect, useState } from "react";
import type { CoinPackagesResponseDTO } from "@soulsync/shared-types";
import { useApi } from "../hooks/useApi";
import { ApiError } from "../services/api";

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(cents / 100);
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
                <p className="text-lg font-semibold text-neutral-900 dark:text-white">🪙 {pkg.coins}</p>
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
        <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-500">
          Unlocking a profile costs {data.unlockCostCoins} coins.
        </p>
      )}
    </div>
  );
}
