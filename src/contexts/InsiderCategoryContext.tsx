'use client';

import { createContext, useContext, useState } from 'react';
import {
  INSIDER_CATEGORIES,
  type InsiderCategoryFilter,
} from '@/lib/insider/categories';

interface InsiderCategoryContextValue {
  category: InsiderCategoryFilter;
  setCategory: (category: InsiderCategoryFilter) => void;
}

const InsiderCategoryContext = createContext<InsiderCategoryContextValue | null>(null);

export function InsiderCategoryProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = useState<InsiderCategoryFilter>('all');

  return (
    <InsiderCategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </InsiderCategoryContext.Provider>
  );
}

export function useInsiderCategory() {
  const ctx = useContext(InsiderCategoryContext);
  if (!ctx) throw new Error('useInsiderCategory must be used inside InsiderCategoryProvider');
  return ctx;
}

export { INSIDER_CATEGORIES };
