import { Link } from "react-router-dom";
import { LegalPageLayout } from "../../components/legal/LegalPageLayout";
import { LegalSection } from "../../components/legal/LegalSection";

export function PrivacyPolicyPage() {
  return (
    <LegalPageLayout title="Privacy Policy">
      <LegalSection title="1. Who we are">
        <p>
          SoulSync ("we", "us") operates a compatibility-based relationship app. This policy
          explains what personal data we collect, why, how long we keep it, and the choices
          you have over it.
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul className="list-disc pl-5">
          <li>
            <strong>Account data:</strong> your email address (via our authentication
            provider, Clerk).
          </li>
          <li>
            <strong>Questionnaire answers:</strong> everything you tell us about yourself
            ("About Me") and what you're looking for ("Preferences"), including personality,
            lifestyle, values, and relationship-goal answers, and any deal breakers you set.
          </li>
          <li>
            <strong>Date of birth:</strong> your exact birth date, collected once during
            onboarding to confirm you're 18 or older. Only your derived age is ever shown to
            other users — your exact birth date is never displayed to anyone.
          </li>
          <li>
            <strong>Photos and voice recordings:</strong> profile photos and an optional short
            voice introduction you record, used only to be shown to matches you or they
            unlock. Photos can be uploaded from your device or taken directly in the app using
            your camera (with your browser's permission) — either way, the resulting photo is
            handled identically once it's sent.
          </li>
          <li>
            <strong>Location-related fields:</strong> the country and city you tell us you're
            in, and any location preference you set for matching (e.g. "same country only").
            We do not collect GPS/device location.
          </li>
          <li>
            <strong>Messages:</strong> the content of messages, photos, voice notes, and virtual
            gifts you exchange with matches.
          </li>
          <li>
            <strong>Payment and coin activity:</strong> when you buy coins, payment is handled
            entirely by Stripe — we never see or store your card number. We keep a record of
            each purchase (amount, coin quantity, date) and of what your coins were spent on —
            unlocking a profile, sending a gift, or identity verification — for your account
            history and accounting.
          </li>
          <li>
            <strong>Identity verification result:</strong> if you choose to use "Get Verified,"
            our processor, Stripe Identity, collects a government-issued ID photo and a live
            selfie <em>directly from you</em> to confirm you're a real person. SoulSync's
            servers never receive or store that ID photo or selfie — we only receive and store
            the result (verified, pending, or failed) and a reference ID for the Stripe
            verification session.
          </li>
          <li>
            <strong>Usage data:</strong> product analytics events (e.g. that you viewed a
            match or sent a message) used to understand and improve the app — see{" "}
            <Link to="/legal/cookies" className="text-brand-600 underline dark:text-brand-400">
              our Cookie Policy
            </Link>{" "}
            for the technical detail.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use it">
        <ul className="list-disc pl-5">
          <li>To compute your compatibility score with other users and rank your matches.</li>
          <li>To enforce your deal breakers before anyone is ever shown to you as a match.</li>
          <li>To display your profile (photo, bio, voice intro) to users who unlock you.</li>
          <li>To deliver and moderate messages, and to detect abuse, spam, and policy violations.</li>
          <li>To process coin purchases and maintain your coin balance and transaction history.</li>
          <li>To let you send and receive optional paid virtual gifts in chat.</li>
          <li>To run identity verification through Stripe Identity when you choose to use it, and to show a verified badge on your profile if you pass.</li>
          <li>To send you in-app notifications about matches, messages, and account status.</li>
          <li>To keep the product working and improve it, using aggregated usage analytics.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Photos, voice, and identity verification">
        <p>
          Photos and voice recordings you upload are stored so they can be displayed to other
          users you match with (subject to the unlock system). We do not currently run
          automated facial recognition or voice-biometric analysis on this content; it is used
          for direct display only. If that ever changes, we'll update this policy first.
        </p>
        <p>
          Identity verification is different: the government ID photo and selfie used to
          confirm you're a real person are captured and matched entirely on Stripe's own
          systems. They never pass through SoulSync's servers, so we have nothing to run
          recognition on even if we wanted to — we only ever receive a pass/fail result.
        </p>
      </LegalSection>

      <LegalSection title="5. Who we share data with">
        <ul className="list-disc pl-5">
          <li>
            <strong>Clerk</strong> — authentication and session management.
          </li>
          <li>
            <strong>Stripe</strong> — payment processing for coin purchases. Stripe receives
            your payment details directly; we never do.
          </li>
          <li>
            <strong>Stripe Identity</strong> — if you use "Get Verified," Stripe Identity
            receives your ID document and selfie directly from you to perform the check. We
            only receive the pass/fail result, never the images themselves.
          </li>
          <li>
            <strong>Our support and moderation team</strong> — a small internal team can see
            your account status, coin balance, and transaction history to help with support
            requests and enforce our policies. They do not have a tool to read the content of
            your private messages or your questionnaire answers.
          </li>
          <li>
            <strong>Other users</strong> — only what your profile and matching settings
            expose, and only once they've unlocked you (or you them).
          </li>
        </ul>
        <p>We do not sell your personal data to third parties.</p>
      </LegalSection>

      <LegalSection title="6. How long we keep it">
        <p>
          We keep your account data for as long as your account is active. If you delete your
          account, we anonymize your profile, questionnaire answers, photos, and voice
          recordings, clear your identity-verification status, and delete your sign-in identity
          so the account can never be used again. Financial transaction records (including
          gift and verification purchases) and message history are retained afterward for
          accounting, legal, and conversation-integrity purposes, referencing only an anonymous
          account identifier.
        </p>
      </LegalSection>

      <LegalSection title="7. Your rights">
        <ul className="list-disc pl-5">
          <li>
            <strong>Access / export:</strong> download a copy of everything we hold about you
            from your account settings.
          </li>
          <li>
            <strong>Deletion:</strong> permanently delete your account and anonymize your
            personal data from your account settings, at any time.
          </li>
          <li>
            <strong>Correction:</strong> edit your questionnaire answers, profile, and photos
            at any time.
          </li>
        </ul>
        <p>
          If you're in the EU/EEA or UK, these correspond to your rights under the GDPR/UK
          GDPR (access, rectification, erasure, and data portability).
        </p>
      </LegalSection>

      <LegalSection title="8. Age requirement">
        <p>SoulSync is for adults only. You must be at least 18 years old to create an account.</p>
      </LegalSection>

      <LegalSection title="9. Contact">
        <p>Questions about this policy or your data can be sent through the app's support channel.</p>
      </LegalSection>
    </LegalPageLayout>
  );
}
