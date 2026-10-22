import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import {
  LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR,
  LEGAL_OPERATOR_NOTE,
  LEGAL_SITE_URL,
  THIRD_PARTY_PROCESSORS,
} from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy — ChainPulse',
  description: 'How ChainPulse collects and uses your data.',
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        This policy describes how {LEGAL_OPERATOR} (&quot;we&quot;, &quot;us&quot;) handles information when you use{' '}
        {LEGAL_SITE_URL} and related features.
      </p>

      <h2>Operator</h2>
      <p>{LEGAL_OPERATOR_NOTE}</p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address, username, password hash (if you sign up with email), and
          account tier or expiry dates for paid features.
        </li>
        <li>
          <strong>Usage data:</strong> queries and assistant responses in the intelligence console, explorer chat, and
          insider surfaces; optional message feedback (thumbs up/down); session metadata needed to run the product.
        </li>
        <li>
          <strong>Wallet watchlist:</strong> public blockchain addresses you choose to save — not private keys.
        </li>
        <li>
          <strong>Payment records:</strong> Razorpay order and payment identifiers, plan purchased, amount in INR, and
          access period — we do not store full card or UPI credentials (Razorpay processes payments).
        </li>
        <li>
          <strong>Technical data:</strong> standard server logs (e.g. IP address, user agent, timestamps) for security
          and operations.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>Provide and secure the Service, including authentication and usage limits</li>
        <li>Fulfill paid access after successful payment</li>
        <li>Improve prompts, routing, and reliability (including offline review of aggregated feedback)</li>
        <li>Respond to support requests</li>
        <li>Comply with legal obligations</li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>Cookies and similar technologies</h2>
      <p>
        We use an essential session cookie (<code>cp_session</code>, httpOnly, up to 7 days) to keep you signed in.
        Third-party scripts may set their own cookies when you use those features (e.g. Razorpay checkout, Jotform
        feedback, Google OAuth via Supabase).
      </p>

      <h2>Service providers</h2>
      <p>We rely on processors that handle data on our behalf, including:</p>
      <ul>
        {THIRD_PARTY_PROCESSORS.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <p>Each provider has its own privacy policy governing how they process data.</p>

      <h2>AI processing</h2>
      <p>
        Your queries and relevant context (such as recent messages or wallet snapshot summaries) may be sent to
        Anthropic&apos;s API to generate responses. Do not submit secrets, private keys, or information you are not
        allowed to share.
      </p>

      <h2>Retention</h2>
      <p>
        We retain account and usage data while your account is active and as needed for billing records, security, and
        legal compliance. You may request deletion of your account data by emailing us (see Contact below).
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can use much of the Service without purchasing paid tiers.</li>
        <li>You can delete tracked wallets from your account in the product UI.</li>
        <li>
          To request access, correction, or deletion of personal data, contact{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Children</h2>
      <p>The Service is not directed at children under 18. We do not knowingly collect data from children.</p>

      <h2>International users</h2>
      <p>
        Data may be processed in regions where our hosting and providers operate. By using the Service, you acknowledge
        that transfer may occur.
      </p>

      <h2>Changes</h2>
      <p>We may update this policy. The &quot;Last updated&quot; date shows the current version.</p>

      <h2>Contact</h2>
      <p>
        Privacy questions or data requests:{' '}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
