import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import {
  createOrder,
  getRazorpayKeyId,
  isBillingPlan,
  PLAN_AMOUNTS_PAISE,
} from '@/lib/billing/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { plan?: string };
  const plan = body.plan;
  if (!plan || !isBillingPlan(plan)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  const amount = PLAN_AMOUNTS_PAISE[plan];
  if (amount < 100) {
    return NextResponse.json({ error: 'Invalid amount.' }, { status: 400 });
  }

  try {
    const order = await createOrder(user.sub, plan);
    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: getRazorpayKeyId(),
      plan,
      prefill: {
        name: user.username,
        email: user.email,
      },
    });
  } catch (e) {
    console.error('[billing/checkout]', e);
    return NextResponse.json({ error: 'Could not create order.' }, { status: 500 });
  }
}
