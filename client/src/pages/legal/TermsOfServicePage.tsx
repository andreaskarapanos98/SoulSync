import { Link } from "react-router-dom";
import { LegalPageLayout } from "../../components/legal/LegalPageLayout";
import { LegalSection } from "../../components/legal/LegalSection";

export function TermsOfServicePage() {
  return (
    <LegalPageLayout title="Terms of Service">
      <LegalSection title="1. Acceptance">
        <p>
          By creating an account you agree to these Terms, our{" "}
          <Link to="/legal/privacy" className="text-brand-600 underline dark:text-brand-400">
            Privacy Policy
          </Link>
          , and our{" "}
          <Link to="/legal/community-guidelines" className="text-brand-600 underline dark:text-brand-400">
            Community Guidelines
          </Link>
          . If you don't agree, don't use SoulSync.
        </p>
      </LegalSection>

      <LegalSection title="2. Eligibility">
        <p>
          You must be at least 18 years old and legally able to form a binding contract to use
          SoulSync. By creating an account you confirm you meet this requirement.
        </p>
      </LegalSection>

      <LegalSection title="3. Your account">
        <p>
          You're responsible for the accuracy of what you tell us and for keeping your account
          secure. One account per person — impersonating someone else, or creating a
          fake/duplicate profile, is a violation of these Terms and our Community Guidelines.
        </p>
      </LegalSection>

      <LegalSection title="4. Coins and unlocking">
        <p>
          Coins are a virtual currency used only within SoulSync. Unlocking a profile spends
          coins based on that match's compatibility score, shown before you confirm. Coins have
          no cash value outside the app and cannot be transferred between accounts. See our{" "}
          <Link to="/legal/refunds" className="text-brand-600 underline dark:text-brand-400">
            Refund Policy
          </Link>{" "}
          for what happens if a purchase fails or is disputed.
        </p>
      </LegalSection>

      <LegalSection title="5. Gifts">
        <p>
          You can send other users optional virtual gifts in chat using coins. Like coins
          themselves, gifts have no cash value, can't be exchanged back into coins or money,
          and can't be transferred, resold, or redeemed outside the app. A gift is spent the
          moment you send it — whether or not the recipient ever opens it. Sending a gift
          doesn't entitle you to a response, a conversation, or anything else from the
          recipient.
        </p>
      </LegalSection>

      <LegalSection title="6. Get Verified">
        <p>
          You can optionally verify your identity for a one-time coin fee. Verification is
          performed by Stripe Identity: you provide a government-issued ID and a live selfie
          directly to Stripe, which SoulSync never receives. Paying the fee buys you the ability
          to complete verification, not a single attempt — if a check fails or is abandoned, you
          can retry at no additional coin cost once the original fee has been paid. The verified
          badge is cosmetic: it shows other users you've completed identity verification, but it
          doesn't unlock any additional feature or guarantee anything about your conduct.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>
          Full detail is in our{" "}
          <Link to="/legal/community-guidelines" className="text-brand-600 underline dark:text-brand-400">
            Community Guidelines
          </Link>
          . In short: no harassment, no fake profiles, no soliciting money from other users, no
          illegal content, no scraping or automated access, no attempting to bypass the unlock
          system or the coin economy.
        </p>
      </LegalSection>

      <LegalSection title="8. Reporting, blocking, and moderation">
        <p>
          You can report or block any user, profile, photo, voice recording, or message
          directly in the app. We review reports and may warn, suspend, or permanently ban
          accounts that violate these Terms or our Community Guidelines, at our discretion and
          without a refund of previously spent coins.
        </p>
      </LegalSection>

      <LegalSection title="9. Termination">
        <p>
          You can delete your account at any time from your account settings. We may suspend or
          terminate accounts that violate these Terms, engage in fraud, or pose a safety risk to
          other users.
        </p>
      </LegalSection>

      <LegalSection title="10. Content you post">
        <p>
          You keep ownership of your photos, voice recordings, and messages. By uploading them
          you give us a license to store and display them within the app to users you match
          with, for as long as your account exists.
        </p>
      </LegalSection>

      <LegalSection title="11. Disclaimers">
        <p>
          SoulSync provides a compatibility score to help you find people who might be a good
          fit — it's a tool, not a guarantee of romantic or personal compatibility. A verified
          badge confirms someone completed Stripe Identity's ID check — it doesn't vouch for
          their character or intentions. We're not responsible for the conduct of other users,
          on or off the app.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes">
        <p>We may update these Terms as the product evolves. Material changes will be reflected here with an updated date.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
