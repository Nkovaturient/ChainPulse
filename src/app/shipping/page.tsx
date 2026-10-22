import type { Metadata } from 'next';
import LegalPage from '@/components/legal/LegalPage';
import { LEGAL_CONTACT_EMAIL, LEGAL_SITE_URL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Shipping and Exchange — ChainPulse',
  description: 'Shipping and exchange policy for ChainPulse.',
};

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping and Exchange">
      <h2>No physical products</h2>
      <p>
        ChainPulse is a <strong>digital-only</strong> online service at {LEGAL_SITE_URL}. We do not sell, ship, or
        deliver physical goods. There are no parcels, couriers, or delivery addresses associated with your purchase.
      </p>

      <h2>How access is delivered</h2>
      <p>
        When a Razorpay payment is verified, paid features (Premium or Elite) are applied to your ChainPulse account.
        Delivery is electronic and immediate upon successful fulfillment. Sign in with the same account you used at
        checkout to use your paid period.
      </p>

      <h2>Shipping</h2>
      <p>Not applicable. No shipping fees, shipping regions, or delivery timelines apply.</p>

      <h2>Exchange</h2>
      <p>
        We do not offer product exchanges because there are no physical items. Paid tiers are separate one-time
        purchases; switching tiers means purchasing the other plan when you choose. See our{' '}
        <a href="/refund">Cancellation and Refund</a> policy for refund eligibility.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>{LEGAL_CONTACT_EMAIL}</a>.
      </p>
    </LegalPage>
  );
}
