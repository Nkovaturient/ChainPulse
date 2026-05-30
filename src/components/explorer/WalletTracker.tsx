'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { shortenAddress } from '@/lib/explorer/address';
import { useAuth } from '@/contexts/AuthContext';
import { isPremiumTier } from '@/lib/tier';
import type { TrackedWallet, UserTier } from '@/types';

interface Props {
  currentAddress?: string | null;
  onInspect: (address: string) => void;
}

export default function WalletTracker({ currentAddress, onInspect }: Props) {
  const { user, loading: authLoading } = useAuth();
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [limit, setLimit] = useState(3);
  const [tier, setTier] = useState<UserTier>('free');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tracked-wallets');
      const data = (await res.json()) as {
        wallets?: TrackedWallet[];
        limit?: number;
        tier?: UserTier;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Failed to load watchlist.');
        return;
      }
      setWallets(data.wallets ?? []);
      setLimit(data.limit ?? 3);
      setTier(data.tier ?? user.tier ?? 'free');
    } catch {
      setError('Network error.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) void load();
    else {
      setWallets([]);
      setLimit(3);
      setTier('free');
    }
  }, [user, load]);

  const trackAddress = async (addr: string) => {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/tracked-wallets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr }),
      });
      const data = (await res.json()) as { wallet?: TrackedWallet; error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not add wallet.');
        return;
      }
      await load();
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/tracked-wallets/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? 'Could not remove.');
        return;
      }
      setWallets((prev) => prev.filter((w) => w.id !== id));
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  };

  const normalizedCurrent = currentAddress?.toLowerCase() ?? null;
  const isTracked = normalizedCurrent
    ? wallets.some((w) => w.address === normalizedCurrent)
    : false;
  const atLimit = wallets.length >= limit;

  if (authLoading) {
    return (
      <div className="rounded-2xl p-4 border animate-pulse h-32" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }} />
    );
  }

  if (!user) {
    return (
      <div className="rounded-2xl p-5 border text-sm" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text)' }}>Watchlist</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Sign in to track up to 3 wallets (100 on premium).
        </p>
        <Link
          href="/login"
          className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg text-white"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 border space-y-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border)' }}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Watchlist</h3>
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {wallets.length}/{limit} · {tier}
            {!isPremiumTier(tier) && (
              <span className="ml-1" style={{ color: '#a5b4fc' }}>· premium: 100</span>
            )}
          </p>
        </div>
        {normalizedCurrent && !isTracked && (
          <button
            type="button"
            disabled={busy || atLimit}
            onClick={() => void trackAddress(normalizedCurrent)}
            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white disabled:opacity-40"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
          >
            Track this
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {loading ? (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-9 rounded-lg animate-pulse" style={{ background: 'var(--bg-card2)' }} />
          ))}
        </div>
      ) : wallets.length === 0 ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          No wallets tracked yet. Inspect an address, then use Track this.
        </p>
      ) : (
        <ul className="space-y-1.5 max-h-48 overflow-y-auto">
          {wallets.map((w) => (
            <li
              key={w.id}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 group"
              style={{ background: 'var(--bg-card2)' }}
            >
              <button
                type="button"
                onClick={() => onInspect(w.address)}
                className="flex-1 min-w-0 text-left"
              >
                <span className="block text-xs font-medium truncate" style={{ color: 'var(--text)' }}>
                  {w.label ?? shortenAddress(w.address)}
                </span>
                {w.label && (
                  <span className="block text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                    {shortenAddress(w.address)}
                  </span>
                )}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void remove(w.id)}
                className="text-[10px] px-1.5 py-0.5 rounded opacity-60 hover:opacity-100 disabled:opacity-30"
                style={{ color: 'var(--text-muted)' }}
                title="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
