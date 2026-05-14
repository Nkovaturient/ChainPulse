/**
 * High-level wallet inspection orchestrator.
 * Fans out across all supported chains in parallel and assembles a WalletReport.
 */
import { CHAINS, CHAIN_BY_KEY, type ChainKey } from './chains';
import { normalizeEvm } from './address';
import {
  getNativeBalance,
  getRecentTransactions,
  getTokenTransfers,
  getTokenBalance,
  type EtherscanTokenTx,
  type EtherscanTx,
} from './etherscan-v2';
import { fetchNativePrices, fetchTokenPrices } from './valuation';
import type {
  WalletReport,
  NativeBalance,
  TokenHolding,
  ChainActivity,
} from './types';

const RECENT_TX_PER_CHAIN = 8;
const MAX_TOKEN_TRANSFERS_PER_CHAIN = 100;

export interface BuildOptions {
  /** Restrict to specific chains (default: all) */
  chains?: ChainKey[];
}

export async function buildWalletReport(
  rawAddress: string,
  opts: BuildOptions = {},
): Promise<WalletReport> {
  const address = normalizeEvm(rawAddress);
  const chains = opts.chains?.length ? CHAINS.filter((c) => opts.chains!.includes(c.key)) : CHAINS;
  const errors: Record<string, string> = {};

  // ── Fan-out: per-chain fetches in parallel ────────────────────────────────
  const perChainData = await Promise.all(
    chains.map(async (spec) => {
      try {
        const [native, txns, transfers] = await Promise.all([
          getNativeBalance(address, spec.key),
          getRecentTransactions(address, spec.key, RECENT_TX_PER_CHAIN),
          getTokenTransfers(address, spec.key, MAX_TOKEN_TRANSFERS_PER_CHAIN),
        ]);
        return {
          chain: spec.key,
          nativeAmount: native ?? 0,
          txns,
          transfers,
        };
      } catch (err) {
        errors[spec.key] = err instanceof Error ? err.message : 'fetch failed';
        return { chain: spec.key, nativeAmount: 0, txns: [] as EtherscanTx[], transfers: [] as EtherscanTokenTx[] };
      }
    }),
  );

  // ── Native prices (single CoinGecko call) ─────────────────────────────────
  const nativePrices = await fetchNativePrices();

  // ── Assemble native balances ──────────────────────────────────────────────
  const natives: NativeBalance[] = perChainData.map(({ chain, nativeAmount }) => {
    const spec = CHAIN_BY_KEY[chain];
    const price = nativePrices[chain] ?? 0;
    return {
      chain,
      symbol: spec.nativeSymbol,
      amount: nativeAmount,
      pricePerUnit: price,
      usd: nativeAmount * price,
    };
  });

  // ── Build a per-chain set of unique token contracts the wallet has touched ─
  //    Then fetch the *current* balance for each contract.
  const tokens: TokenHolding[] = [];

  await Promise.all(
    perChainData.map(async ({ chain, transfers }) => {
      if (!transfers.length) return;

      // Unique contracts (limit to 25/chain to keep API budget reasonable)
      const contractInfo = new Map<string, EtherscanTokenTx>();
      for (const tx of transfers) {
        const c = tx.contractAddress.toLowerCase();
        if (!contractInfo.has(c)) contractInfo.set(c, tx);
        if (contractInfo.size >= 25) break;
      }

      // Fetch current balances + prices in parallel
      const contracts = Array.from(contractInfo.keys());
      const [balances, prices] = await Promise.all([
        Promise.all(contracts.map((c) => getTokenBalance(address, c, chain))),
        fetchTokenPrices(chain, contracts),
      ]);

      contracts.forEach((c, i) => {
        const info = contractInfo.get(c)!;
        const bal = balances[i];
        if (bal === 0n) return;
        const decimals = Number(info.tokenDecimal || '18');
        // Avoid Number(BigInt) precision loss for huge balances
        const amount = Number(bal) / 10 ** decimals;
        if (!Number.isFinite(amount) || amount === 0) return;
        const price = prices[c] ?? null;
        tokens.push({
          chain,
          contractAddress: c,
          symbol: info.tokenSymbol || '?',
          name: info.tokenName || info.tokenSymbol || '?',
          decimals,
          amount,
          pricePerUnit: price,
          usd: price === null ? null : amount * price,
        });
      });
    }),
  );

  // Sort tokens by USD value desc (unknown-price tokens go last)
  tokens.sort((a, b) => (b.usd ?? -1) - (a.usd ?? -1));

  // ── Build recent activity timeline (merged across chains) ─────────────────
  const recentActivity: ChainActivity[] = [];
  for (const { chain, txns } of perChainData) {
    const spec = CHAIN_BY_KEY[chain];
    const price = nativePrices[chain] ?? 0;
    for (const tx of txns) {
      if (tx.isError === '1') continue;
      const valueNative = Number(BigInt(tx.value || '0')) / 10 ** spec.nativeDecimals;
      const direction: ChainActivity['direction'] =
        tx.from.toLowerCase() === address && tx.to.toLowerCase() === address ? 'self' :
        tx.from.toLowerCase() === address ? 'out' : 'in';
      recentActivity.push({
        chain,
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        valueWei: tx.value,
        valueNative,
        valueUsd: price ? valueNative * price : null,
        timestamp: new Date(Number(tx.timeStamp) * 1000).toISOString(),
        direction,
        methodId: tx.methodId,
        explorerUrl: `${spec.explorerBaseUrl}/tx/${tx.hash}`,
      });
    }
  }
  recentActivity.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // ── Per-chain summary ─────────────────────────────────────────────────────
  const perChain = chains.map((spec) => {
    const native = natives.find((n) => n.chain === spec.key);
    const chainTokens = tokens.filter((t) => t.chain === spec.key);
    const chainTxns = perChainData.find((p) => p.chain === spec.key)?.txns ?? [];
    const tokensUsd = chainTokens.reduce((sum, t) => sum + (t.usd ?? 0), 0);
    const nativeUsd = native?.usd ?? 0;
    const lastActive = chainTxns[0]
      ? new Date(Number(chainTxns[0].timeStamp) * 1000).toISOString()
      : null;
    return {
      chain: spec.key,
      nativeUsd,
      tokensUsd,
      totalUsd: nativeUsd + tokensUsd,
      txCount: chainTxns.length,
      lastActive,
    };
  });

  const netWorthUsd = perChain.reduce((sum, p) => sum + p.totalUsd, 0);

  return {
    address,
    netWorthUsd,
    natives,
    tokens,
    recentActivity: recentActivity.slice(0, 20),
    perChain,
    errors,
    fetchedAt: new Date().toISOString(),
  };
}
