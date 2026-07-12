'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User } from '@/types';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({ user: null, loading: true, refresh: async () => {}, logout: async () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const { user: u } = (await res.json()) as { user: User | null };
        setUser(u ? {
          ...u,
          premiumExpiresAt: u.premiumExpiresAt ?? null,
          eliteExpiresAt: u.eliteExpiresAt ?? null,
        } : null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    window.location.href = '/';
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return <Ctx.Provider value={{ user, loading, refresh, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
