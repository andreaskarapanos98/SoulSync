import { LegalPageLayout } from "../../components/legal/LegalPageLayout";
import { LegalSection } from "../../components/legal/LegalSection";

export function CookiePolicyPage() {
  return (
    <LegalPageLayout title="Cookie Policy">
      <LegalSection title="What we use">
        <ul className="list-disc pl-5">
          <li>
            <strong>Authentication cookies (essential):</strong> set by our sign-in provider,
            Clerk, to keep you signed in. The app doesn't function without these.
          </li>
          <li>
            <strong>Local storage (essential):</strong> small bits of app state stored in your
            browser (e.g. your current onboarding step) so refreshing the page doesn't lose
            progress.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="What we don't use">
        <p>
          We don't currently use third-party advertising cookies, cross-site tracking pixels,
          or sell any data collected via cookies to ad networks.
        </p>
      </LegalSection>

      <LegalSection title="Product analytics">
        <p>
          We record product-usage events (e.g. viewing a match, sending a message) tied to your
          account, not a browser cookie, to understand how the app is used and where people get
          stuck. This is described in our{" "}
          <a href="/legal/privacy" className="text-brand-600 underline dark:text-brand-400">
            Privacy Policy
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Controlling cookies">
        <p>
          Because authentication cookies are essential, blocking them will sign you out and
          prevent the app from working. You can clear cookies at any time through your
          browser's settings.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
