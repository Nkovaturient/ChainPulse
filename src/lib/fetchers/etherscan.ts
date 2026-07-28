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

const WATCH_ADDRESSES = [
  { label: 'beacon-deposit', address: '0x00000000219ab540356cBB839Cbe05303d7705Fa' },
  { label: 'binance-hot', address: '0x28C6c06298d514Db089934071355E5743bf21d60' },
  { label: 'coinbase-hot', address: '0x71660c4005BA1c36eC3c0bd5Fe8ca3eF43Fc0f3f' },
];

const MIN_WEI = BigInt(10) * BigInt('1000000000000000000');

async function fetchAddressTxs(address: string, key: string): Promise<EtherscanTx[]> {
  const url =
    `https://api.etherscan.io/v2/api?chainid=1&module=account&action=txlist` +
    `&address=${address}&startblock=0&endblock=99999999&page=1&offset=25&sort=desc&apikey=${key}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const json = (await res.json()) as EtherscanResponse;
  return Array.isArray(json.result) ? json.result : [];
}

function mapTx(tx: EtherscanTx): WhaleTransaction {
  const ethValue = Number(BigInt(tx.value || '0')) / 1e18;
  return {
    hash: tx.hash,
    from: tx.from,
    to: tx.to,
    value: `${ethValue.toFixed(2)} ETH`,
    amountNative: ethValue,
    chain: 'ethereum',
    timestamp: new Date(parseInt(tx.timeStamp, 10) * 1000).toISOString(),
    explorerUrl: `https://etherscan.io/tx/${tx.hash}`,
  };
}

export async function fetchWhaleTransactions(): Promise<WhaleTransaction[]> {
  try {
    const key = process.env.ETHERSCAN_API_KEY || '';
    if (!key) return [];

    const batches = await Promise.all(
      WATCH_ADDRESSES.map((w) => fetchAddressTxs(w.address, key)),
    );

    const seen = new Set<string>();
    const out: WhaleTransaction[] = [];

    for (const txs of batches) {
      for (const tx of txs) {
        if (!tx.hash || seen.has(tx.hash)) continue;
        try {
          const v = BigInt(tx.value || '0');
          if (v <= MIN_WEI) continue;
        } catch {
          continue;
        }
        seen.add(tx.hash);
        out.push(mapTx(tx));
      }
    }

    return out
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 15);
  } catch {
    return [];
  }
}
