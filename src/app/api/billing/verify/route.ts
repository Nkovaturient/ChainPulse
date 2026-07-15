import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { fulfillPurchase } from '@/lib/billing/fulfill';
import {
  getRazorpayClient,
  isBillingPlan,
  PLAN_AMOUNTS_PAISE,
  verifyCheckoutSignature,
} from '@/lib/billing/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
    plan?: string;
  };

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !plan) {
    return NextResponse.json({ error: 'Missing payment fields.' }, { status: 400 });
  }

  if (!isBillingPlan(plan)) {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  if (!verifyCheckoutSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return NextResponse.json({ error: 'Invalid payment signature.' }, { status: 400 });
  }

  try {
    const razorpay = getRazorpayClient();
    const order = await razorpay.orders.fetch(razorpay_order_id);
    const notes = order.notes ?? {};
    const orderUserId = typeof notes.userId === 'string' ? notes.userId : null;
    const orderPlan = typeof notes.plan === 'string' ? notes.plan : null;

    if (orderUserId !== user.sub || orderPlan !== plan) {
      return NextResponse.json({ error: 'Payment does not match this account.' }, { status: 403 });
    }

    const amountPaise = Number(order.amount);
    if (amountPaise !== PLAN_AMOUNTS_PAISE[plan]) {
      return NextResponse.json({ error: 'Payment amount mismatch.' }, { status: 400 });
    }

    const result = await fulfillPurchase({
      userId: user.sub,
      plan,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      amountPaise,
    });

    return NextResponse.json({
      ok: true,
      alreadyFulfilled: result.alreadyFulfilled,
      premiumExpiresAt: result.premiumExpiresAt?.toISOString() ?? null,
      eliteExpiresAt: result.eliteExpiresAt?.toISOString() ?? null,
    });
  } catch (e) {
    console.error('[billing/verify]', e);
    return NextResponse.json({ error: 'Payment verification failed.' }, { status: 500 });
  }
}
