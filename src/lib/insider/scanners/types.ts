import type { InsiderAlertKind, InsiderCategory } from '@/types';

export interface ScannerAlertDraft {
  chain: string;
  kind: InsiderAlertKind;
  category: InsiderCategory;
  address: string;
  txHash: string;
  amountUsd: number | null;
  summary: string;
  sourceUrl: string | null;
  detectedAt: Date;
  metadata?: Record<string, unknown>;
}

export type InsiderScanner = () => Promise<ScannerAlertDraft[]>;
