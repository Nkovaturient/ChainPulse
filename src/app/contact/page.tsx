import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { LEGAL_CONTACT_EMAIL, LEGAL_OPERATOR, LEGAL_OPERATOR_NOTE, LEGAL_SITE_URL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Contact Us — ChainPulse',
  description: 'Contact ChainPulse support.',
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact Us">
      <p>
        For support, billing, privacy requests, or questions about {LEGAL_SITE_URL}, reach us by email. We do not list a
        walk-in office — {LEGAL_OPERATOR_NOTE.toLowerCase()}
      </p>

      <h2>Email</h2>
      <p>
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>
      </p>
      <p>Please include the email address on your ChainPulse account and, for payment issues, your Razorpay payment ID.</p>

      <h2>What we can help with</h2>
      <ul>
        <li>Account access and sign-in</li>
        <li>Paid access not applied after payment</li>
        <li>Refund requests covered in our refund policy</li>
        <li>Privacy and data deletion requests</li>
        <li>Bug reports and product feedback</li>
      </ul>

      <h2>Response time</h2>
      <p>
        We read this inbox regularly but do not guarantee a specific response time. Complex billing issues may require
        coordination with Razorpay.
      </p>

      <h2>Legal pages</h2>
      <p>
        <a href="/terms">Terms</a> · <a href="/privacy">Privacy</a> · <a href="/refund">Refunds</a> ·{' '}
        <a href="/shipping">Shipping</a>
      </p>
    </LegalPage>
  );
}
