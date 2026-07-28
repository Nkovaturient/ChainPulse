'use client';

import {
  INSIDER_CATEGORY_LABELS,
  type InsiderCategoryFilter,
} from '@/lib/insider/categories';

interface Props {
  value: InsiderCategoryFilter;
  onChange: (category: InsiderCategoryFilter) => void;
  className?: string;
}

const ORDER: InsiderCategoryFilter[] = [
  'all',
  'memecoin',
  'bluechip',
  'defi',
  'ai',
  'other',
];

export default function InsiderCategoryChips({ value, onChange, className = '' }: Props) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {ORDER.map((cat) => {
        const active = value === cat;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onChange(cat)}
            className="text-[length:var(--insider-chip-size)] px-2.5 py-1.5 rounded-lg font-medium transition-all"
            style={{
              background: active ? 'rgba(234,179,8,.18)' : 'rgba(234,179,8,.04)',
              border: `1px solid ${active ? 'rgba(234,179,8,.35)' : 'rgba(234,179,8,.12)'}`,
              color: active ? '#facc15' : 'var(--text-muted)',
            }}
          >
            {INSIDER_CATEGORY_LABELS[cat]}
          </button>
        );
      })}
    </div>
  );
}
