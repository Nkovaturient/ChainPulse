'use client';

import { useCallback, useEffect, useState } from 'react';
import type { BillingStatus } from '@/types/billing';

export function useBillingStatus() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/status');
      if (!res.ok) return;
      const data = (await res.json()) as BillingStatus;
      setStatus(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    status,
    loading,
    eliteActive: status?.eliteActive ?? false,
    premiumActive: status?.premiumActive ?? false,
    refresh,
  };
}
