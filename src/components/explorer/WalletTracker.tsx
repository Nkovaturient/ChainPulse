'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw } from 'lucide-react';
import { shortenAddress } from '@/lib/explorer/address';
import { useAuth } from '@/contexts/AuthContext';
import { usePlansModal } from '@/contexts/PlansModalContext';
import type { TrackedWallet } from '@/types';

const LABEL_MAX = 32;

interface Props {
  currentAddress?: string | null;
  onInspect: (address: string) => void;
}

interface NamingTarget {
  id: string;
  address: string;
  label: string | null;
}

export default function WalletTracker({ currentAddress, onInspect }: Props) {
  const { user, loading: authLoading } = useAuth();
  const { openPlansModal } = usePlansModal();
  const [wallets, setWallets] = useState<TrackedWallet[]>([]);
  const [limit, setLimit] = useState(3);
  const [watchlistExpanded, setWatchlistExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [naming, setNaming] = useState<NamingTarget | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/tracked-wallets');
      const data = (await res.json()) as {
        wallets?: TrackedWallet[];
        limit?: number;
        watchlistExpanded?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Failed to load watchlist.');
        return;
      }
      setWallets(data.wallets ?? []);
      setLimit(data.limit ?? 3);
      setWatchlistExpanded(data.watchlistExpanded ?? false);
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
      setWatchlistExpanded(false);
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
        if (res.status === 403) {
          openPlansModal('wallet_limit');
        } else {
          setError(data.error ?? 'Could not add wallet.');
        }
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

  const openNaming = (w: TrackedWallet) => {
    setNaming({ id: w.id, address: w.address, label: w.label });
    setNameInput(w.label ?? '');
    setNameError(null);
  };

  const closeNaming = () => {
    setNaming(null);
    setNameInput('');
    setNameError(null);
  };

  const saveName = async () => {
    if (!naming) return;
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Enter a name to save.');
      return;
    }
    if (trimmed.length > LABEL_MAX) {
      setNameError(`Max ${LABEL_MAX} characters.`);
      return;
    }

    setBusy(true);
    setNameError(null);
    try {
      const res = await fetch(`/api/tracked-wallets/${naming.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed }),
      });
      const data = (await res.json()) as { wallet?: TrackedWallet; error?: string };
      if (!res.ok) {
        setNameError(data.error ?? 'Could not save name.');
        return;
      }
      if (data.wallet) {
        setWallets((prev) => prev.map((w) => (w.id === data.wallet!.id ? data.wallet! : w)));
      }
      closeNaming();
    } catch {
      setNameError('Network error.');
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
    return <div className="rounded-2xl p-4 glass-read animate-pulse h-32" />;
  }

  if (!user) {
    return (
      <div className="rounded-2xl p-5 glass-read text-sm">
        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-read)' }}>Watchlist</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted-read)' }}>
          Sign in to track up to 3 wallets (50 on Premium).
        </p>
        <Link
          href="/login"
          className="inline-block text-xs font-semibold px-3 py-1.5 rounded-lg text-white glass-cta"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl p-5 glass-read space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--text-read)' }}>Watchlist</h3>
            <p className="text-[11px]" style={{ color: 'var(--text-muted-read)' }}>
              {wallets.length}/{limit}
              {!watchlistExpanded && (
                <button
                  type="button"
                  onClick={() => openPlansModal('wallet_limit')}
                  className="ml-1 underline"
                  style={{ color: '#a5b4fc' }}
                >
                  · premium: 50
                </button>
              )}
            </p>
          </div>
          {normalizedCurrent && !isTracked && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (atLimit) { openPlansModal('wallet_limit'); return; }
                void trackAddress(normalizedCurrent);
              }}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-white disabled:opacity-40 glass-cta"
            >
              Track this
            </button>
          )}
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-9 rounded-lg animate-pulse glass-read-inner" />
            ))}
          </div>
        ) : wallets.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted-read)' }}>
            No wallets tracked yet. Inspect &amp; Track.
          </p>
        ) : (
          <ul className="space-y-1.5 max-h-48 overflow-y-auto">
            {wallets.map((w) => (
              <li
                key={w.id}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 group glass-read-inner"
              >
                <button
                  type="button"
                  onClick={() => onInspect(w.address)}
                  className="flex-1 min-w-0 text-left"
                >
                  <span className="block text-xs font-semibold truncate" style={{ color: 'var(--text-read)' }}>
                    {w.label ?? shortenAddress(w.address)}
                  </span>
                  <span
                    className="block text-[10px] font-mono truncate"
                    style={{ color: 'var(--text-muted-read)' }}
                  >
                    {w.label ? shortenAddress(w.address) : 'Tap to inspect'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onInspect(w.address)}
                  className="opacity-60 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30"
                  style={{ color: 'var(--text-muted-read)' }}
                  title="Refresh wallet data"
                >
                  <RefreshCw size={11} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => openNaming(w)}
                  className="text-[10px] px-2 py-0.5 rounded-md glass-cta shrink-0 disabled:opacity-40"
                  title={w.label ? 'Rename wallet' : 'Name this wallet'}
                >
                  {w.label ? 'Rename' : 'Name it'}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void remove(w.id)}
                  className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded flex items-center justify-center transition-all flex-shrink-0 disabled:opacity-30 hover:text-red-400"
                  style={{ color: 'var(--text-muted-read)' }}
                  title="Remove"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {naming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(5,9,18,.65)' }}
          onClick={closeNaming}
          role="presentation"
        >
          <div
            className="glass-read w-full max-w-sm rounded-2xl p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="name-wallet-title"
          >
            <h4 id="name-wallet-title" className="text-sm font-semibold mb-1" style={{ color: 'var(--text-read)' }}>
              Name this wallet
            </h4>
            <p className="text-[11px] font-mono mb-4" style={{ color: 'var(--text-muted-read)' }}>
              {shortenAddress(naming.address, 8, 6)}
            </p>
            <label className="block text-[11px] mb-1.5" style={{ color: 'var(--text-muted-read)' }}>
              Your label (like ENS — only you see this)
            </label>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void saveName();
                if (e.key === 'Escape') closeNaming();
              }}
              maxLength={LABEL_MAX}
              autoFocus
              placeholder="e.g. Vitalik, Cold storage, DeFi whale"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none glass-read-inner mb-1"
              style={{ color: 'var(--text-read)' }}
            />
            <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted-read)' }}>
              {nameInput.trim().length}/{LABEL_MAX}
            </p>
            {nameError && (
              <p className="text-xs text-red-400 mb-3">{nameError}</p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeNaming}
                disabled={busy}
                className="text-xs px-3 py-1.5 rounded-lg glass-read-inner disabled:opacity-40"
                style={{ color: 'var(--text-muted-read)' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveName()}
                disabled={busy || !nameInput.trim()}
                className="text-xs px-4 py-1.5 rounded-lg text-white disabled:opacity-40 glass-cta"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
