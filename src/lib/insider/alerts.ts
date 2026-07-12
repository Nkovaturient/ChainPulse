import { prisma } from '@/lib/db';
import { fetchWhaleTransactions } from '@/lib/fetchers/etherscan';
import { fetchSolanaTransactions } from '@/lib/fetchers/solscan';

const LARGE_USD_THRESHOLD = 500_000;

export async function scanAndStoreAlerts(): Promise<{ inserted: number; skipped: number }> {
  const [ethTxns, solTxns] = await Promise.allSettled([
    fetchWhaleTransactions(),
    fetchSolanaTransactions(),
  ]);

  const txns = [
    ...(ethTxns.status === 'fulfilled' ? ethTxns.value : []),
    ...(solTxns.status === 'fulfilled' ? solTxns.value : []),
  ];

  let inserted = 0;
  let skipped = 0;

  for (const tx of txns) {
    if (!tx.hash) { skipped++; continue; }

    const existing = await prisma.insiderAlert.findUnique({ where: { txHash: tx.hash } });
    if (existing) { skipped++; continue; }

    const valueStr = typeof tx.value === 'string' ? tx.value : String(tx.value ?? '0');
    const amountEth = parseFloat(valueStr) / 1e18;
    const amountUsd = amountEth * 2500;

    if (amountUsd < LARGE_USD_THRESHOLD) { skipped++; continue; }

    const summary = `Large ${tx.chain === 'ethereum' ? 'ETH' : 'SOL'} transfer detected — $${(amountUsd / 1000).toFixed(0)}K moved from ${tx.from.slice(0, 8)}… to ${tx.to.slice(0, 8)}….`;

    await prisma.insiderAlert.create({
      data: {
        chain: tx.chain,
        kind: 'whale_tx',
        address: tx.from,
        txHash: tx.hash,
        amountUsd,
        summary,
        sourceUrl: tx.explorerUrl ?? null,
        detectedAt: tx.timestamp ? new Date(tx.timestamp) : new Date(),
      },
    });
    inserted++;
  }

  return { inserted, skipped };
}

export async function getRecentAlerts(limit = 50) {
  return prisma.insiderAlert.findMany({
    orderBy: { detectedAt: 'desc' },
    take: limit,
  });
}
