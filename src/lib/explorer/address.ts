/** Address format detection + light validation. */

export type AddressKind = 'evm' | 'solana' | 'aptos' | 'unknown';

const EVM_RE = /^0x[a-fA-F0-9]{40}$/;
const APTOS_RE = /^0x[a-fA-F0-9]{1,64}$/; // 64 hex (some addresses are shorter, leading zeros omitted)
const SOLANA_RE = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/; // base58 32-44 chars

export function detectAddressKind(raw: string): AddressKind {
  const v = raw.trim();
  if (EVM_RE.test(v)) return 'evm';
  // Aptos addresses start with 0x and can be up to 64 hex chars (but NOT 40 — that's EVM)
  if (v.startsWith('0x') && APTOS_RE.test(v) && v.length !== 42) return 'aptos';
  if (SOLANA_RE.test(v)) return 'solana';
  return 'unknown';
}

export function isEvmAddress(raw: string): boolean {
  return EVM_RE.test(raw.trim());
}

export function normalizeEvm(raw: string): string {
  return raw.trim().toLowerCase();
}

export function shortenAddress(addr: string, head = 6, tail = 4): string {
  if (addr.length <= head + tail + 2) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
