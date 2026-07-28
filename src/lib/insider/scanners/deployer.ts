import { cachedFetch } from '@/lib/insider/rate-limit';
import type { InsiderScanner } from '@/lib/insider/scanners/types';

interface EtherscanTx {
  hash: string;
  from: string;
  contractAddress?: string;
  timeStamp: string;
  to: string;
}

interface EtherscanResponse {
  status: string;
  result: EtherscanTx[] | string;
}

const UNISWAP_V2_FACTORY = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f';

export const scanDeployerActivity: InsiderScanner = async () => {
  const key = process.env.ETHERSCAN_API_KEY || '';
  if (!key) return [];

  const txs = await cachedFetch('etherscan-factory-txs', 10 * 60 * 1000, async () => {
    const url =
      `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist` +
      `&address=${UNISWAP_V2_FACTORY}&startblock=0&endblock=99999999&page=1&offset=20&sort=desc&apikey=${key}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [] as EtherscanTx[];
    const json = (await res.json()) as EtherscanResponse;
    return Array.isArray(json.result) ? json.result : [];
  });

  const now = new Date();
  const day = now.toISOString().slice(0, 10);

  return txs
    .filter((tx) => tx.contractAddress && tx.contractAddress !== '0x0000000000000000000000000000000000000000')
    .slice(0, 3)
    .map((tx) => {
      const contractAddress = tx.contractAddress!;
      return {
      chain: 'ethereum',
      kind: 'deployer_activity' as const,
      category: 'memecoin' as const,
      address: tx.from,
      txHash: `deploy-${contractAddress}-${day}`,
      amountUsd: null,
      summary: `New pair deployment — contract ${contractAddress.slice(0, 10)}… created via Uniswap V2 factory by ${tx.from.slice(0, 10)}….`,
      sourceUrl: `https://etherscan.io/tx/${tx.hash}`,
      detectedAt: tx.timeStamp ? new Date(parseInt(tx.timeStamp, 10) * 1000) : now,
      metadata: {
        contractAddress,
        deployer: tx.from,
        factory: UNISWAP_V2_FACTORY,
      },
    };
    });
};
