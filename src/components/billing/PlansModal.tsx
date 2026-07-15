'use client';

import { useCallback, useState } from 'react';
import { X, Check, Zap, Lock, Sparkles } from 'lucide-react';
import { PLAN_CATALOG, type PlanDef } from '@/lib/tier';
import type { PlansModalReason } from '@/contexts/PlansModalContext';
import { loadRazorpayScript } from '@/lib/billing/razorpay-checkout';
import { useBillingStatus } from '@/hooks/useBillingStatus';

interface CheckoutOrderResponse {
  order_id: string;
  amount: number | string;
  currency: string;
  key_id: string;
  plan: string;
  prefill?: { name?: string; email?: string };
  error?: string;
}

interface Props {
  reason: PlansModalReason;
  onClose: () => void;
}

const REASON_COPY: Record<PlansModalReason, string> = {
  wallet_limit: "You've reached your wallet tracking limit.",
  insights: 'AI portfolio insights are a Premium feature.',
  insider_gate: 'Insider Bot is exclusive to Elite members.',
  console_limit: "You've reached today's message limit.",
  manage: 'Your ChainPulse plan.',
};

function formatExpiry(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function PlanCard({
  plan,
  isCurrent,
  onUpgrade,
  loading,
}: {
  plan: PlanDef;
  isCurrent: boolean;
  onUpgrade: (id: string) => void;
  loading: boolean;
}) {
  const isElite = plan.id === 'elite';
  const isFree = plan.id === 'free';
  const isPremium = plan.id === 'premium';

  const cardClass = [
    'plans-plan-card rounded-3xl p-7 flex flex-col gap-5 border min-h-[340px]',
    isCurrent ? 'plans-plan-card--current' : '',
    isElite ? 'plans-plan-card--elite' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={cardClass}
      style={{
        background: isElite
          ? 'linear-gradient(160deg, rgba(234,179,8,.12) 0%, rgba(17,24,39,.6) 55%, rgba(161,161,170,.04) 100%)'
          : isCurrent
          ? 'linear-gradient(160deg, rgba(99,102,241,.14) 0%, rgba(17,24,39,.5) 100%)'
          : isPremium
          ? 'linear-gradient(160deg, rgba(99,102,241,.08) 0%, rgba(17,24,39,.45) 100%)'
          : 'linear-gradient(160deg, rgba(255,255,255,.04) 0%, rgba(17,24,39,.4) 100%)',
        borderColor: isElite
          ? 'rgba(234,179,8,.35)'
          : isCurrent
          ? 'rgba(99,102,241,.45)'
          : 'rgba(255,255,255,.08)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isElite && <Zap size={16} className="text-yellow-400" />}
            {isPremium && <Sparkles size={15} className="text-indigo-300" />}
            <p className="text-base font-bold tracking-tight" style={{ color: 'var(--text)' }}>
              {plan.name}
            </p>
          </div>
          <p className="leading-none">
            <span className="text-2xl font-extrabold tracking-tight" style={{ color: 'var(--text)' }}>
              {plan.price}
            </span>
            <span className="text-sm ml-1.5" style={{ color: 'var(--text-muted)' }}>
              {!isFree ? `/ ${plan.period}` : '· forever'}
            </span>
          </p>
        </div>
        {isCurrent && (
          <span
            className="text-[11px] px-3 py-1 rounded-full font-semibold flex-shrink-0"
            style={{ background: 'rgba(99,102,241,.25)', color: '#c7d2fe' }}
          >
            Current
          </span>
        )}
      </div>

      <ul className="space-y-3 flex-1 pt-1">
        {plan.bullets.map((b) => (
          <li key={b} className="flex items-start gap-3 text-sm leading-snug" style={{ color: 'var(--text-muted)' }}>
            <span
              className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: isElite ? 'rgba(234,179,8,.15)' : 'rgba(16,185,129,.12)' }}
            >
              <Check size={11} className={isElite ? 'text-yellow-400' : 'text-emerald-400'} />
            </span>
            {b}
          </li>
        ))}
      </ul>

      {!isFree && !isCurrent && (
        <button
          type="button"
          onClick={() => onUpgrade(plan.id)}
          disabled={loading}
          className={[
            'plans-plan-cta w-full py-3.5 rounded-2xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed',
            isElite ? 'plans-plan-cta--elite' : '',
          ].filter(Boolean).join(' ')}
          style={{
            background: isElite
              ? 'linear-gradient(135deg, #eab308, #ca8a04 55%, #a16207)'
              : 'linear-gradient(135deg, #6366f1, #8b5cf6 55%, #7c3aed)',
          }}
        >
          {loading ? 'Opening checkout…' : `Get ${plan.name}`}
        </button>
      )}
      {isCurrent && !isFree && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--text-muted)' }}>
          <Lock size={11} className="inline mr-1.5 opacity-70" />
          Active plan
        </p>
      )}
      {isFree && isCurrent && (
        <div className="h-[52px]" aria-hidden />
      )}
    </div>
  );
}

export default function PlansModal({ reason, onClose }: Props) {
  const { status, refresh } = useBillingStatus();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const refreshStatus = refresh;

  const handleUpgrade = useCallback(async (planId: string) => {
    setCheckoutLoading(true);
    setPaymentError(null);

    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId }),
      });
      const data = (await res.json()) as CheckoutOrderResponse;

      if (!res.ok || !data.order_id) {
        setPaymentError(data.error ?? 'Could not start checkout.');
        setCheckoutLoading(false);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded || !window.Razorpay) {
        setPaymentError('Payment checkout failed to load.');
        setCheckoutLoading(false);
        return;
      }

      const planDef = PLAN_CATALOG.find((p) => p.id === planId);
      const publicKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? data.key_id;

      const rzp = new window.Razorpay({
        key: publicKey,
        order_id: data.order_id,
        amount: data.amount,
        currency: data.currency,
        name: 'ChainPulse',
        description: planDef?.name ?? planId,
        prefill: data.prefill,
        handler: async (response) => {
          try {
            const verifyRes = await fetch('/api/billing/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: planId,
              }),
            });
            const verifyData = (await verifyRes.json()) as { ok?: boolean; error?: string };
            if (!verifyRes.ok || !verifyData.ok) {
              setPaymentError(verifyData.error ?? 'Payment verification failed.');
              return;
            }
            setPaymentSuccess(true);
            await refreshStatus();
          } catch {
            setPaymentError('Payment verification failed. Please contact support if charged.');
          } finally {
            setCheckoutLoading(false);
          }
        },
        modal: {
          ondismiss: () => {
            setCheckoutLoading(false);
          },
        },
      });

      rzp.on('payment.failed', (response) => {
        setPaymentError(response.error?.description ?? 'Payment failed.');
        setCheckoutLoading(false);
      });

      rzp.open();
    } catch {
      setPaymentError('Could not open checkout.');
      setCheckoutLoading(false);
    }
  }, [refreshStatus]);

  const isCurrent = useCallback((planId: PlanDef['id']): boolean => {
    if (!status) return planId === 'free';
    if (planId === 'elite') return status.eliteActive;
    if (planId === 'premium') return status.premiumActive;
    return !status.premiumActive && !status.eliteActive;
  }, [status]);

  return (
    <div
      className="plans-modal-overlay fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10"
      style={{ background: 'rgba(5,9,18,.82)' }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="plans-modal-shell w-full max-w-6xl rounded-[2rem] overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, rgba(22,28,45,.97) 0%, rgba(12,16,28,.98) 100%)',
          border: '1px solid rgba(255,255,255,.08)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plans-modal-title"
      >
        <div className="flex items-start justify-between gap-6 px-8 sm:px-10 pt-9 pb-6">
          <div className="space-y-2 max-w-xl">
            <p
              id="plans-modal-title"
              className="text-xs uppercase tracking-[0.22em] font-semibold"
              style={{ color: '#a5b4fc' }}
            >
              ChainPulse Plans
            </p>
            <p className="text-lg sm:text-xl font-medium leading-snug" style={{ color: 'var(--text)' }}>
              {paymentSuccess ? 'Payment successful — your plan is now active.' : REASON_COPY[reason]}
            </p>
            {paymentError && (
              <p className="text-xs text-red-400">{paymentError}</p>
            )}
            {(status?.premiumExpiresAt || status?.eliteExpiresAt) && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {status?.premiumExpiresAt && (
                  <p className="text-xs" style={{ color: 'var(--text-muted)', opacity: 0.75 }}>
                    Premium · expires {formatExpiry(status.premiumExpiresAt)}
                  </p>
                )}
                {status?.eliteExpiresAt && (
                  <p className="text-xs" style={{ color: '#facc15', opacity: 0.85 }}>
                    Elite · expires {formatExpiry(status.eliteExpiresAt)}
                  </p>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close plans"
            className="plans-close-btn w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,.06)', color: 'var(--text-muted)' }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 px-8 sm:px-10 pb-8">
          {PLAN_CATALOG.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isCurrent={isCurrent(plan.id)}
              onUpgrade={handleUpgrade}
              loading={checkoutLoading}
            />
          ))}
        </div>

        <p
          className="text-xs text-center pb-8 px-6"
          style={{ color: 'var(--text-muted)', opacity: 0.5 }}
        >
          One-time payment · No auto-renewal · No wallet connection required · INR via Razorpay
        </p>
      </div>
    </div>
  );
}
