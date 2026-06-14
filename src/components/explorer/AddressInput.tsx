'use client';

import { useState } from 'react';
import { detectAddressKind } from '@/lib/explorer/address';

interface Props {
  onSubmit: (addr: string) => void;
  initial?: string;
  busy?: boolean;
}

export default function AddressInput({ onSubmit, initial = '', busy }: Props) {
  const [value, setValue] = useState(initial);
  const trimmed = value.trim();
  const kind = trimmed ? detectAddressKind(trimmed) : null;

  const hint = !trimmed
    ? null
    : kind === 'evm'
      ? { ok: true, msg: 'Valid EVM address' }
      : kind === 'solana'
        ? { ok: false, msg: 'Solana support coming soon' }
        : kind === 'aptos'
          ? { ok: false, msg: 'Aptos support coming soon' }
          : { ok: false, msg: 'Not a recognized address format' };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kind === 'evm' && !busy) onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto relative z-[2]">
      <div className="glass-input relative">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Paste a wallet address (0x… or ENS — EVM supported now)"
          spellCheck={false}
          autoComplete="off"
          className="w-full px-5 py-4 pr-28 text-sm font-mono outline-none bg-transparent"
          style={{ color: 'var(--text)' }}
        />
        <button
          type="submit"
          disabled={kind !== 'evm' || busy}
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40 glass-cta"
        >
          {busy ? '…' : 'Inspect →'}
        </button>
      </div>
      {hint && (
        <p
          className="mt-2 text-xs px-1"
          style={{ color: hint.ok ? '#10b981' : '#f87171' }}
        >
          {hint.ok ? '✓ ' : '⚠ '}{hint.msg}
        </p>
      )}
    </form>
  );
}
