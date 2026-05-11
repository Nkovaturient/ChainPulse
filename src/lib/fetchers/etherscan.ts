import type { WhaleTransaction } from '@/types';

interface EtherscanTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
}

interface EtherscanResponse {
  status: string;
  message: string;
  result: EtherscanTx[] | string;
}

export async function fetchWhaleTransactions(): Promise<WhaleTransaction[]> {
  try {
    const key = process.env.ETHERSCAN_API_KEY || '';
    const url = `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist&address=0x00000000219ab540356cBB839Cbe05303d7705Fa&startblock=0&endblock=99999999&page=1&offset=30&sort=desc&apikey=${key}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as EtherscanResponse;
    if (!Array.isArray(json.result)) return [];
    const txs = json.result;

    const filtered = txs
      .filter((tx) => {
        try {
          const v = BigInt(tx.value || '0');
          return v > BigInt(10) * BigInt('1000000000000000000');
        } catch {
          return false;
        }
      })
      .slice(0, 10);

    return filtered.map((tx) => {
      const ethValue = Number(BigInt(tx.value)) / 1e18;
      return {
        hash: tx.hash,
        from: tx.from ? tx.from.slice(0, 6) + '...' + tx.from.slice(-4) : '',
        to: tx.to ? tx.to.slice(0, 6) + '...' + tx.to.slice(-4) : '',
        value: ethValue.toFixed(2) + ' ETH',
        chain: 'ethereum' as const,
        timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
        explorerUrl: 'https://etherscan.io/tx/' + tx.hash,
      };
    });
  } catch {
    return [];
  }
}
