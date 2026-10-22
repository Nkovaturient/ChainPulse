import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import {
  formatPlanPricingForLegal,
  LEGAL_CONTACT_EMAIL,
  LEGAL_OPERATOR,
  LEGAL_SITE_URL,
} from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Cancellation and Refund — ChainPulse',
  description: 'Refund and cancellation policy for ChainPulse paid access.',
};

export default function RefundPage() {
  return (
    <LegalPage title="Cancellation and Refund">
      <p>
        This policy applies to optional paid access purchased on {LEGAL_SITE_URL} through Razorpay. ChainPulse sells{' '}
        <strong>digital access only</strong> — not physical goods.
      </p>

      <h2>What you are buying</h2>
      <p>
        Paid plans are <strong>one-time purchases</strong> that extend Premium or Elite features for{' '}
        <strong>3 months</strong> from the fulfillment date. There is <strong>no automatic renewal</strong>. Current
        pricing: {formatPlanPricingForLegal()}.
      </p>

      <h2>Cancellation</h2>
      <p>
        Because there is no subscription auto-renewal, there is nothing to &quot;cancel&quot; in the recurring-billing
        sense. Your paid period ends on the expiry date shown in your account. To avoid future charges, simply do not
        place another order.
      </p>

      <h2>Refunds we provide</h2>
      <p>We will issue a full refund when:</p>
      <ul>
        <li>You were charged twice for the same successful purchase (duplicate payment), or</li>
        <li>
          Razorpay captured payment but we did not grant the corresponding paid access to your account within a
          reasonable time after you notify us at{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Refunds we do not provide</h2>
      <p>
        After paid access has been granted to your account, we generally do <strong>not</strong> offer refunds. Digital
        delivery is immediate once fulfillment completes. Unused days in a 3-month period are not prorated or
        refunded. Dissatisfaction with AI output quality, market outcomes, or third-party data accuracy is not grounds
        for a refund.
      </p>

      <h2>How refunds are processed</h2>
      <p>
        Approved refunds are initiated through Razorpay back to the original payment method. Timing depends on your bank
        or payment provider. We may ask for your Razorpay payment ID and registered email to verify the transaction.
      </p>

      <h2>Charge disputes</h2>
      <p>
        If you believe a charge is incorrect, email us first at{' '}
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a> so we can investigate before you dispute
        with your bank.
      </p>
    </LegalPage>
  );
}
