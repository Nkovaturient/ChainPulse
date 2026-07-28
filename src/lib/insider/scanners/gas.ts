import { cachedFetch } from '@/lib/insider/rate-limit';
import type { InsiderScanner } from '@/lib/insider/scanners/types';

interface GasOracle {
  SafeGasPrice: string;
  ProposeGasPrice: string;
  FastGasPrice: string;
}

const SPIKE_THRESHOLD_GWEI = 50;

export const scanUnusualGas: InsiderScanner = async () => {
  const key = process.env.ETHERSCAN_API_KEY || '';
  if (!key) return [];

  const oracle = await cachedFetch('etherscan-gas-oracle', 5 * 60 * 1000, async () => {
    const url =
      `https://api.etherscan.io/v2/api?chainid=1&module=gastracker&action=gasoracle&apikey=${key}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: GasOracle };
    return json.result ?? null;
  });

  if (!oracle) return [];

  const proposeGwei = parseFloat(oracle.ProposeGasPrice);
  if (!Number.isFinite(proposeGwei) || proposeGwei < SPIKE_THRESHOLD_GWEI) return [];

  const now = new Date();
  const bucket = `${now.toISOString().slice(0, 13)}-${Math.round(proposeGwei / 5) * 5}`;
  const txHash = `gas-${bucket}`;

  return [{
    chain: 'ethereum',
    kind: 'unusual_gas',
    category: 'other',
    address: 'gas-oracle',
    txHash,
    amountUsd: null,
    summary: `Unusual gas spike — Ethereum propose gas at ${proposeGwei.toFixed(1)} gwei (fast ${oracle.FastGasPrice} gwei).`,
    sourceUrl: 'https://etherscan.io/gastracker',
    detectedAt: now,
    metadata: {
      proposeGwei,
      safeGwei: parseFloat(oracle.SafeGasPrice),
      fastGwei: parseFloat(oracle.FastGasPrice),
    },
  }];
};
