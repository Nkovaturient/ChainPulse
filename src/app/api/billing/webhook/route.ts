import { NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripeClient, PERIOD_MONTHS, AMOUNT_CENTS } from '@/lib/billing/stripe';
import { prisma } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const rawBody = await req.text();
  const sig = req.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret.' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, sig, secret);
  } catch (e) {
    console.error('[billing/webhook] signature verification failed', e);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    const plan = session.metadata?.plan as 'premium' | 'elite' | undefined;

    if (!userId || !plan || (plan !== 'premium' && plan !== 'elite')) {
      return NextResponse.json({ error: 'Missing metadata.' }, { status: 400 });
    }

    const stripeSessionId = session.id;

    // Idempotency: skip if already processed
    const existing = await prisma.purchase.findUnique({ where: { stripeSessionId } });
    if (existing) {
      return NextResponse.json({ received: true });
    }

    const now = new Date();
    const months = PERIOD_MONTHS[plan];

    // Extend from max(now, existing expiry) so consecutive purchases stack
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { premiumExpiresAt: true, eliteExpiresAt: true },
    });
    if (!user) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const baseField = plan === 'premium' ? 'premiumExpiresAt' : 'eliteExpiresAt';
    const existingExpiry = user[baseField];
    const base = existingExpiry && existingExpiry > now ? existingExpiry : now;

    const expiresAt = new Date(base);
    expiresAt.setMonth(expiresAt.getMonth() + months);

    await prisma.$transaction([
      prisma.purchase.create({
        data: {
          userId,
          plan,
          stripeSessionId,
          stripeCustomerId: typeof session.customer === 'string' ? session.customer : null,
          amountCents: AMOUNT_CENTS[plan],
          periodMonths: months,
          startedAt: now,
          expiresAt,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: { [baseField]: expiresAt },
      }),
    ]);
  }

  return NextResponse.json({ received: true });
}
