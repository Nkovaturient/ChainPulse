import { prisma } from '@/lib/db';
import { walletTrackLimit } from '@/lib/tier';
import type { Entitlements } from '@/lib/tier';
import { isEvmAddress, normalizeEvm } from '@/lib/explorer/address';

export type TrackedWalletRow = {
  id: string;
  address: string;
  label: string | null;
  created_at: string;
};

export async function listTrackedWallets(userId: string): Promise<TrackedWalletRow[]> {
  const rows = await prisma.trackedWallet.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return rows.map((r) => ({
    id: r.id,
    address: r.address,
    label: r.label,
    created_at: r.createdAt.toISOString(),
  }));
}

export async function addTrackedWallet(
  userId: string,
  ent: Entitlements,
  rawAddress: string,
  label?: string | null,
): Promise<{ wallet: TrackedWalletRow } | { error: string; status: number }> {
  const address = normalizeEvm(rawAddress);
  if (!isEvmAddress(address)) {
    return { error: 'Invalid EVM address.', status: 400 };
  }

  const limit = walletTrackLimit(ent);
  const count = await prisma.trackedWallet.count({ where: { userId } });
  if (count >= limit) {
    return {
      error: `Watchlist full (${limit} max on your current plan).`,
      status: 403,
    };
  }

  try {
    const row = await prisma.trackedWallet.create({
      data: {
        userId,
        address,
        label: label?.trim() || null,
      },
    });
    return {
      wallet: {
        id: row.id,
        address: row.address,
        label: row.label,
        created_at: row.createdAt.toISOString(),
      },
    };
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'code' in e && (e as { code: string }).code === 'P2002') {
      return { error: 'Address already on your watchlist.', status: 409 };
    }
    throw e;
  }
}

export async function removeTrackedWallet(
  userId: string,
  id: string,
): Promise<{ ok: true } | { error: string; status: number }> {
  const deleted = await prisma.trackedWallet.deleteMany({
    where: { id, userId },
  });
  if (deleted.count === 0) return { error: 'Not found.', status: 404 };
  return { ok: true };
}

const LABEL_MAX = 32;

function normalizeLabel(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  if (trimmed.length > LABEL_MAX) return trimmed.slice(0, LABEL_MAX);
  return trimmed;
}

export async function updateTrackedWalletLabel(
  userId: string,
  id: string,
  rawLabel: string,
): Promise<{ wallet: TrackedWalletRow } | { error: string; status: number }> {
  const label = normalizeLabel(rawLabel);
  if (rawLabel.trim() && !label) {
    return { error: 'Invalid name.', status: 400 };
  }

  const existing = await prisma.trackedWallet.findFirst({
    where: { id, userId },
  });
  if (!existing) return { error: 'Not found.', status: 404 };

  const row = await prisma.trackedWallet.update({
    where: { id },
    data: { label },
  });

  return {
    wallet: {
      id: row.id,
      address: row.address,
      label: row.label,
      created_at: row.createdAt.toISOString(),
    },
  };
}
