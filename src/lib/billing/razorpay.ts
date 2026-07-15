import crypto from 'crypto';
import Razorpay from 'razorpay';

export type BillingPlan = 'premium' | 'elite';

let _client: Razorpay | null = null;

export function getRazorpayKeyId(): string {
  const key = process.env.RAZORPAY_KEY_ID?.trim();
  if (!key) throw new Error('RAZORPAY_KEY_ID is not set');
  return key;
}

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) throw new Error('RAZORPAY_KEY_SECRET is not set');
  return secret;
}

export function getRazorpayClient(): Razorpay {
  if (!_client) {
    _client = new Razorpay({
      key_id: getRazorpayKeyId(),
      key_secret: getRazorpayKeySecret(),
    });
  }
  return _client;
}

export const PLAN_AMOUNTS_PAISE: Record<BillingPlan, number> = {
  premium: 415_000,
  elite: 830_000,
};

export const PERIOD_MONTHS: Record<BillingPlan, number> = {
  premium: 6,
  elite: 4,
};

const MIN_AMOUNT_PAISE = 100;

export function isBillingPlan(plan: string): plan is BillingPlan {
  return plan === 'premium' || plan === 'elite';
}

export async function createOrder(userId: string, plan: BillingPlan) {
  const amount = PLAN_AMOUNTS_PAISE[plan];
  if (amount < MIN_AMOUNT_PAISE) {
    throw new Error(`Amount must be at least ${MIN_AMOUNT_PAISE} paise`);
  }

  const razorpay = getRazorpayClient();
  const receipt = `cp_${plan}_${userId.slice(0, 8)}_${Date.now()}`;

  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt,
    notes: { userId, plan },
  });

  return order;
}

export function verifyCheckoutSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const secret = getRazorpayKeySecret();
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    return expected === signature;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, 'hex'),
      Buffer.from(signature, 'hex'),
    );
  } catch {
    return expected === signature;
  }
}
