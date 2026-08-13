import { LegalPageLayout } from "../../components/legal/LegalPageLayout";
import { LegalSection } from "../../components/legal/LegalSection";

export function CommunityGuidelinesPage() {
  return (
    <LegalPageLayout title="Community Guidelines">
      <p>
        SoulSync only works if people can trust who they're talking to. These guidelines apply
        to every profile, photo, voice recording, and message on the app.
      </p>

      <LegalSection title="Be real">
        <ul className="list-disc pl-5">
          <li>Use your own photos and voice — no stock photos, no impersonating someone else, no fake profiles.</li>
          <li>Answer the questionnaire honestly. The compatibility score is only useful if your answers are real.</li>
          <li>One account per person.</li>
          <li>A verified badge means someone completed ID verification — it's not a character reference, so don't let it lower your guard.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Be respectful">
        <ul className="list-disc pl-5">
          <li>No harassment, hate speech, threats, or targeted abuse of any kind.</li>
          <li>No unsolicited explicit content in photos, voice recordings, or messages.</li>
          <li>Take no for an answer. If someone stops responding or asks you to stop, respect that.</li>
          <li>Sending a virtual gift doesn't entitle you to anything back — no pressure, no obligation, no exceptions.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Be safe">
        <ul className="list-disc pl-5">
          <li>Never send money, gift cards, or financial information to someone you've matched with.</li>
          <li>Don't share other people's personal information without their consent.</li>
          <li>Report anything that makes you uncomfortable — you don't need to be certain it breaks a rule.</li>
        </ul>
      </LegalSection>

      <LegalSection title="No spam or manipulation">
        <ul className="list-disc pl-5">
          <li>No advertising, soliciting, or promoting other services or accounts.</li>
          <li>No scripted, automated, or bulk messaging.</li>
          <li>No attempting to bypass the unlock system or coin economy.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Reporting and enforcement">
        <p>
          Every profile, photo, voice recording, and message can be reported directly from the
          app, with a reason attached. You can also block anyone — blocking removes them from
          your matches and stops them from messaging you, in both directions.
        </p>
        <p>
          Reports are reviewed by our team. Depending on severity, an account may receive a
          warning, be temporarily suspended, or be permanently banned. We don't refund
          previously spent coins for enforcement actions.
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
