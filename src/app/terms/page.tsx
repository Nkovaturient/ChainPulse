import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import {
  DATA_SOURCES,
  formatPlanPricingForLegal,
  LEGAL_CONTACT_EMAIL,
  LEGAL_GOVERNING_LAW,
  LEGAL_OPERATOR,
  LEGAL_OPERATOR_NOTE,
  LEGAL_SITE_URL,
} from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Terms and Conditions — ChainPulse',
  description: 'Terms of use for ChainPulse crypto intelligence.',
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms and Conditions">
      <p>
        These terms govern your use of {LEGAL_SITE_URL} &nbsp;and the ChainPulse web application (the &quot;Service&quot;).
        By using the Service, you agree to these terms. If you do not agree, do not use the Service.
      </p>

      <h2>Operator</h2>
      <p>{LEGAL_OPERATOR_NOTE}</p>

      <h2>What ChainPulse is</h2>
      <p>
        ChainPulse is a read-only crypto intelligence tool. It aggregates public market and on-chain data and presents
        AI-assisted summaries. The Service does <strong>not</strong> connect to your wallet, does not request private
        keys, and does not execute transactions on your behalf.
      </p>

      <h2>Not financial advice</h2>
      <p>
        Content from the Service is for informational purposes only. It is not investment, tax, or legal advice. We do
        not provide price predictions or guarantees of profit or loss. You are solely responsible for decisions you make
        using any information from the Service.
      </p>

      <h2>Data accuracy and third parties</h2>
      <p>
        Data is fetched from third-party APIs and feeds, including: {DATA_SOURCES.join('; ')}. That data may be delayed,
        incomplete, or incorrect. ChainPulse does not warrant accuracy, timeliness, or completeness. Your use of
        third-party data is also subject to those providers&apos; terms.
      </p>

      <h2>Accounts</h2>
      <p>
        You may create an account with email/password or Google sign-in. You are responsible for keeping your
        credentials secure and for activity under your account. We may suspend or terminate access if you misuse the
        Service or violate these terms.
      </p>

      <h2>Paid access</h2>
      <p>
        Optional paid tiers extend usage limits and features for a fixed period. Purchases are one-time Razorpay orders
        in INR — not auto-renewing subscriptions. Current paid options: {formatPlanPricingForLegal()}. A free tier
        remains available without purchase. Refund rules are in our{' '}
        <a href="/refund">Cancellation and Refund</a> policy.
      </p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to break, overload, or scrape the Service in ways that harm availability</li>
        <li>Use the Service for unlawful activity or to harass others</li>
        <li>Misrepresent ChainPulse output as guaranteed financial advice</li>
        <li>Circumvent usage limits or access controls</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>
        The Service, branding, and software are owned by the operator. You receive a limited, non-exclusive license to
        use the Service for personal or internal business research. You may not copy or resell the Service without
        permission.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, to the
        fullest extent permitted by law.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, the operator is not liable for indirect, incidental, or consequential
        damages, or for trading or investment losses arising from use of the Service or reliance on its output.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The &quot;Last updated&quot; date at the top reflects the current version. Continued
        use after changes constitutes acceptance of the updated terms.
      </p>

      <h2>Governing law</h2>
      <p>
        These terms are governed by the laws of {LEGAL_GOVERNING_LAW}, without regard to conflict-of-law principles.
        Disputes shall be subject to the courts of {LEGAL_GOVERNING_LAW} where permitted.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms:{' '}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
    </LegalPage>
  );
}
