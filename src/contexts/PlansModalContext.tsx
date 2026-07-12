'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import PlansModal from '@/components/billing/PlansModal';

export type PlansModalReason = 'wallet_limit' | 'insights' | 'insider_gate' | 'console_limit' | 'manage';

interface PlansModalCtx {
  openPlansModal: (reason: PlansModalReason) => void;
}

const Ctx = createContext<PlansModalCtx>({ openPlansModal: () => {} });

export function PlansModalProvider({ children }: { children: React.ReactNode }) {
  const [reason, setReason] = useState<PlansModalReason | null>(null);

  const openPlansModal = useCallback((r: PlansModalReason) => setReason(r), []);
  const close = useCallback(() => setReason(null), []);

  return (
    <Ctx.Provider value={{ openPlansModal }}>
      {children}
      {reason !== null && <PlansModal reason={reason} onClose={close} />}
    </Ctx.Provider>
  );
}

export function usePlansModal() {
  return useContext(Ctx);
}
