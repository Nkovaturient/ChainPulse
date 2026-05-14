/**
 * Etherscan V2 multichain client.
 * One key, one base URL, chainid param picks the chain.
 *
 * Docs: https://docs.etherscan.io/etherscan-v2
 */
import { CHAIN_BY_KEY, type ChainKey } from './chains';

const BASE = 'https://api.etherscan.io/v2/api';

function key() {
  return process.env.ETHERSCAN_API_KEY ?? '';
}

interface EtherscanResp<T> {
  status: '0' | '1';
  message: string;
  result: T;
}

/** Generic GET wrapper that returns null on any error/empty. */
async function get<T>(params: Record<string, string | number>): Promise<T | null> {
  const apikey = key();
  if (!apikey) return null;
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), apikey });
  try {
    const res = await fetch(`${BASE}?${qs.toString()}`, {
      // 30s cache window per unique URL — Next.js handles dedup
      next: { revalidate: 30 },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as EtherscanResp<T>;
    // status "0" + message "No transactions found" is valid empty
    if (json.status === '0' && /no\s+(transactions|records)/i.test(json.message)) {
      return (Array.isArray(json.result) ? ([] as unknown as T) : (null as T));
    }
    if (json.status !== '1') return null;
    return json.result;
  } catch {
    return null;
  }
}

// ─── Native balance ───────────────────────────────────────────────────────────

export async function getNativeBalance(address: string, chain: ChainKey): Promise<number | null> {
  const spec = CHAIN_BY_KEY[chain];
  const wei = await get<string>({
    chainid: spec.chainId,
    module: 'account',
    action: 'balance',
    address,
    tag: 'latest',
  });
  if (!wei) return 0;
  // Wei (string) → native amount as float
  return Number(BigInt(wei)) / 10 ** spec.nativeDecimals;
}

// ─── Recent native transactions ───────────────────────────────────────────────

export interface EtherscanTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  isError: string;
  methodId?: string;
  functionName?: string;
}

export async function getRecentTransactions(
  address: string,
  chain: ChainKey,
  limit = 10,
): Promise<EtherscanTx[]> {
  const spec = CHAIN_BY_KEY[chain];
  const result = await get<EtherscanTx[]>({
    chainid: spec.chainId,
    module: 'account',
    action: 'txlist',
    address,
    startblock: 0,
    endblock: 99999999,
    page: 1,
    offset: limit,
    sort: 'desc',
  });
  return Array.isArray(result) ? result.slice(0, limit) : [];
}

// ─── ERC-20 token transfer history (used to enumerate held tokens) ────────────

export interface EtherscanTokenTx {
  contractAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimal: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  hash: string;
}

export async function getTokenTransfers(
  address: string,
  chain: ChainKey,
  limit = 100,
): Promise<EtherscanTokenTx[]> {
  const spec = CHAIN_BY_KEY[chain];
  const result = await get<EtherscanTokenTx[]>({
    chainid: spec.chainId,
    module: 'account',
    action: 'tokentx',
    address,
    startblock: 0,
    endblock: 99999999,
    page: 1,
    offset: limit,
    sort: 'desc',
  });
  return Array.isArray(result) ? result : [];
}

// ─── ERC-20 single-contract balance ───────────────────────────────────────────

export async function getTokenBalance(
  address: string,
  contractAddress: string,
  chain: ChainKey,
): Promise<bigint> {
  const spec = CHAIN_BY_KEY[chain];
  const result = await get<string>({
    chainid: spec.chainId,
    module: 'account',
    action: 'tokenbalance',
    contractaddress: contractAddress,
    address,
    tag: 'latest',
  });
  if (!result) return 0n;
  try {
    return BigInt(result);
  } catch {
    return 0n;
  }
}
