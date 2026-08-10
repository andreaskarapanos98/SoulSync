import { Link } from "react-router-dom";

export function CoinsCancelPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 py-20 text-center">
      <span className="text-4xl">😕</span>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900 dark:text-white">Payment cancelled</h1>
      <p className="mt-2 text-neutral-500 dark:text-neutral-400">No charge was made — you can try again anytime.</p>
      <Link
        to="/coins"
        className="mt-6 rounded-full bg-brand-500 px-6 py-2 text-sm font-semibold text-white hover:bg-brand-600"
      >
        Back to coins
      </Link>
    </div>
  );
}
