import coinImg from "../assets/coin.png";

/**
 * The 🪙 emoji renders as flat grey on some platforms/fonts and gold on others, which
 * users read as two different currencies. This is the one actual coin image everywhere.
 */
export function CoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <img src={coinImg} alt="" className={`inline-block shrink-0 align-[-0.15em] ${className}`} />;
}
