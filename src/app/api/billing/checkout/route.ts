import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { getStripeClient, PRICE_IDS } from '@/lib/billing/stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan?: string; cancelUrl?: string };
  const plan = body.plan as 'premium' | 'elite' | undefined;
  if (plan !== 'premium' && plan !== 'elite') {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json({ error: `Stripe price not configured for plan: ${plan}` }, { status: 500 });
  }

  const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user.sub, plan },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: body.cancelUrl ?? `${origin}/dashboard`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error('[billing/checkout]', e);
    return NextResponse.json({ error: 'Could not create checkout session.' }, { status: 500 });
  }
}
