import Stripe from 'stripe';

let _client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (!_client) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set');
    _client = new Stripe(key, { apiVersion: '2026-06-24.dahlia' });
  }
  return _client;
}

export const PRICE_IDS: Record<'premium' | 'elite', string> = {
  premium: process.env.STRIPE_PRICE_PREMIUM ?? '',
  elite: process.env.STRIPE_PRICE_ELITE ?? '',
};

export const PERIOD_MONTHS: Record<'premium' | 'elite', number> = {
  premium: 6,
  elite: 4,
};

export const AMOUNT_CENTS: Record<'premium' | 'elite', number> = {
  premium: 5000,
  elite: 10000,
};
