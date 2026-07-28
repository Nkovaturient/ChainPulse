import { fetchWhaleTransactions } from '@/lib/fetchers/etherscan';
import { fetchSolanaTransactions } from '@/lib/fetchers/solscan';
import { fetchPrices } from '@/lib/fetchers/coingecko';
import { parseNativeAmount, shortAddress, formatUsd } from '@/lib/insider/utils';
import type { InsiderCategory } from '@/types';
import type { InsiderScanner } from '@/lib/insider/scanners/types';

const LARGE_USD_THRESHOLD = 500_000;
const MIN_SOL_NATIVE = 2_500;

export const scanWhaleTransactions: InsiderScanner = async () => {
  const [ethTxns, solTxns, prices] = await Promise.all([
    fetchWhaleTransactions(),
    fetchSolanaTransactions(),
    fetchPrices(['ethereum', 'solana']),
  ]);

  const ethPrice = prices.find((p) => p.id === 'ethereum')?.usd ?? 2500;
  const solPrice = prices.find((p) => p.id === 'solana')?.usd ?? 150;

  const drafts = [];

  for (const tx of ethTxns) {
    const amountNative = tx.amountNative ?? parseNativeAmount(tx.value);
    const amountUsd = amountNative * ethPrice;
    if (amountUsd < LARGE_USD_THRESHOLD) continue;

    drafts.push({
      chain: tx.chain,
      kind: 'whale_tx' as const,
      category: (amountUsd >= 1_000_000 ? 'bluechip' : 'other') as InsiderCategory,
      address: tx.from,
      txHash: tx.hash,
      amountUsd,
      summary: `Large ETH transfer — ${formatUsd(amountUsd)} moved from ${shortAddress(tx.from)} to ${shortAddress(tx.to)}.`,
      sourceUrl: tx.explorerUrl,
      detectedAt: tx.timestamp ? new Date(tx.timestamp) : new Date(),
      metadata: { symbol: 'ETH', amountNative, from: tx.from, to: tx.to },
    });
  }

  for (const tx of solTxns) {
    const amountNative = tx.amountNative ?? parseNativeAmount(tx.value);
    if (amountNative < MIN_SOL_NATIVE) continue;
    const amountUsd = amountNative * solPrice;
    if (amountUsd < LARGE_USD_THRESHOLD) continue;

    drafts.push({
      chain: tx.chain,
      kind: 'whale_tx' as const,
      category: 'bluechip' as InsiderCategory,
      address: tx.from,
      txHash: tx.hash,
      amountUsd,
      summary: `Large SOL transfer — ${formatUsd(amountUsd)} from ${shortAddress(tx.from)}.`,
      sourceUrl: tx.explorerUrl,
      detectedAt: tx.timestamp ? new Date(tx.timestamp) : new Date(),
      metadata: { symbol: 'SOL', amountNative, from: tx.from },
    });
  }

  return drafts;
};
