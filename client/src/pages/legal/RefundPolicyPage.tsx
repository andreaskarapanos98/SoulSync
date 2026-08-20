import { Link } from "react-router-dom";
import { LegalPageLayout } from "../../components/legal/LegalPageLayout";
import { LegalSection } from "../../components/legal/LegalSection";

export function RefundPolicyPage() {
  return (
    <LegalPageLayout title="Refund Policy">
      <LegalSection title="Coins are digital goods">
        <p>
          SoulSync Coins are a virtual currency delivered to your account immediately after
          payment. Because they're digital content that begins being usable right away, coin
          purchases are generally final and non-refundable once delivered — including coins
          already spent unlocking a profile, sending a gift, or starting identity verification.
        </p>
        <p>
          If you're in the EU/EEA or UK: by completing a coin purchase, you expressly request
          delivery to begin immediately and acknowledge that this waives the standard statutory
          right of withdrawal for digital content once it starts, in line with EU/UK consumer
          law for digital goods.
        </p>
      </LegalSection>

      <LegalSection title="When we will refund">
        <ul className="list-disc pl-5">
          <li>You were charged but coins were never credited to your account (a failed or duplicate delivery).</li>
          <li>You were charged twice for the same purchase.</li>
          <li>You were charged an incorrect amount due to a pricing error on our side.</li>
        </ul>
        <p>
          Our webhook automatically records every completed and failed payment, so we can
          verify these cases against your actual account history — see the copy of your
          transactions in your account data export.
        </p>
      </LegalSection>

      <LegalSection title="When we generally won't refund">
        <ul className="list-disc pl-5">
          <li>You changed your mind after coins were delivered or spent.</li>
          <li>You unlocked a profile and were unsatisfied with the interaction that followed.</li>
          <li>You sent a gift and didn't get the response you were hoping for.</li>
          <li>
            Your identity verification was declined — the fee buys the ability to verify, so you
            can retry at no additional coin cost (see our{" "}
            <Link to="/legal/terms" className="text-brand-600 underline dark:text-brand-400">
              Terms of Service
            </Link>
            ), but the original fee itself isn't refunded.
          </li>
          <li>
            Your account was restricted from chatting, suspended, or banned for violating our
            Terms or Community Guidelines.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="How to request one">
        <p>
          Contact support through the app with your account email and, if possible, the
          approximate date and amount of the charge. We'll check it against our payment records
          and respond as quickly as we can.
        </p>
      </LegalSection>

      <LegalSection title="Chargebacks">
        <p>
          Please contact us before filing a chargeback with your bank or card issuer — we can
          usually resolve legitimate billing issues faster directly. Accounts with unresolved
          chargebacks may be suspended pending investigation.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
