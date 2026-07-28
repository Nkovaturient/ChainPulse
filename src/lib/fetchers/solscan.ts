import type { WhaleTransaction } from '@/types';

interface SolscanTx {
  txHash?: string;
  signature?: string | string[];
  blockTime?: number;
  fee?: number;
  lamport?: number;
  signer?: string[];
}

const MIN_SOL = 2_500;

export async function fetchSolanaTransactions(): Promise<WhaleTransaction[]> {
  try {
    const res = await fetch('https://public-api.solscan.io/transaction/last?limit=25', {
      headers: { accept: 'application/json' },
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as SolscanTx[] | { data?: SolscanTx[] };
    const list: SolscanTx[] = Array.isArray(json) ? json : Array.isArray(json?.data) ? json.data : [];

    return list
      .map((tx) => {
        const hash =
          tx.txHash || (Array.isArray(tx.signature) ? tx.signature[0] : tx.signature) || '';
        const signer = Array.isArray(tx.signer) && tx.signer[0] ? tx.signer[0] : '';
        const lamports = typeof tx.lamport === 'number' ? tx.lamport : 0;
        const sol = lamports / 1e9;
        return {
          hash,
          from: signer,
          to: '—',
          value: sol > 0 ? `${sol.toFixed(2)} SOL` : 'tx',
          amountNative: sol,
          chain: 'solana' as const,
          timestamp: tx.blockTime ? new Date(tx.blockTime * 1000).toISOString() : new Date().toISOString(),
          explorerUrl: `https://solscan.io/tx/${hash}`,
        };
      })
      .filter((tx) => tx.hash && (tx.amountNative ?? 0) >= MIN_SOL)
      .slice(0, 10);
  } catch {
    return [];
  }
}
