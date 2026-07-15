import { NextResponse } from 'next/server';
import { fulfillPurchase } from '@/lib/billing/fulfill';
import {
  getRazorpayClient,
  isBillingPlan,
  PLAN_AMOUNTS_PAISE,
  verifyWebhookSignature,
} from '@/lib/billing/razorpay';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RazorpayWebhookEvent {
  event: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number;
        status?: string;
        notes?: Record<string, string>;
      };
    };
  };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 400 });
  }

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.error('[billing/webhook] signature verification failed');
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  let event: RazorpayWebhookEvent;
  try {
    event = JSON.parse(rawBody) as RazorpayWebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 });
  }

  if (event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity;
    const orderId = payment?.order_id;
    const paymentId = payment?.id;
    const amount = payment?.amount;

    if (!orderId || !paymentId || amount == null) {
      return NextResponse.json({ error: 'Missing payment data.' }, { status: 400 });
    }

    const notes = payment.notes ?? {};
    let userId = typeof notes.userId === 'string' ? notes.userId : null;
    let plan = typeof notes.plan === 'string' ? notes.plan : null;

    if (!userId || !plan) {
      try {
        const razorpay = getRazorpayClient();
        const order = await razorpay.orders.fetch(orderId);
        const orderNotes = order.notes ?? {};
        userId = typeof orderNotes.userId === 'string' ? orderNotes.userId : userId;
        plan = typeof orderNotes.plan === 'string' ? orderNotes.plan : plan;
      } catch (e) {
        console.error('[billing/webhook] order fetch failed', e);
      }
    }

    if (!userId || !plan || !isBillingPlan(plan)) {
      return NextResponse.json({ error: 'Missing order metadata.' }, { status: 400 });
    }

    if (amount !== PLAN_AMOUNTS_PAISE[plan]) {
      return NextResponse.json({ error: 'Amount mismatch.' }, { status: 400 });
    }

    try {
      await fulfillPurchase({
        userId,
        plan,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
        amountPaise: amount,
      });
    } catch (e) {
      console.error('[billing/webhook] fulfill failed', e);
      return NextResponse.json({ error: 'Fulfillment failed.' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
