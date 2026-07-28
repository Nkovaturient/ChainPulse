import { scanWhaleTransactions } from '@/lib/insider/scanners/whale';
import { scanUnusualGas } from '@/lib/insider/scanners/gas';
import { scanDexLiquidity } from '@/lib/insider/scanners/dex-liquidity';
import { scanMemecoinMomentum } from '@/lib/insider/scanners/memecoin';
import { scanTokenUnlocks } from '@/lib/insider/scanners/unlock';
import { scanDeployerActivity } from '@/lib/insider/scanners/deployer';
import type { InsiderScanner } from '@/lib/insider/scanners/types';

export const ALL_SCANNERS: InsiderScanner[] = [
  scanWhaleTransactions,
  scanUnusualGas,
  scanDexLiquidity,
  scanMemecoinMomentum,
  scanTokenUnlocks,
  scanDeployerActivity,
];
