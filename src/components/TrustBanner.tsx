'use client';

import { t } from '@/lib/translations';
import type { Language } from '@/types';

interface Props {
  lang: Language;
  setLang: (l: Language) => void;
}

export default function TrustBanner({ lang, setLang }: Props) {
  const tr = t(lang);
  const langs: Language[] = ['en', 'hi', 'bn'];
  const labelFor = (l: Language) => (l === 'en' ? 'EN' : l === 'hi' ? 'हि' : 'বা');

  return (
    <div className="w-full bg-slate-900 text-white text-xs py-1.5 px-4 flex items-center justify-between sticky top-0 z-50">
      <span className="font-semibold tracking-tight">⛓ ChainPulse</span>
      <span className="opacity-70 hidden sm:inline">{tr.trust_banner}</span>
      <div className="flex gap-2">
        {langs.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2 py-0.5 rounded text-xs transition ${
              lang === l ? 'bg-white text-slate-900' : 'opacity-50 hover:opacity-100'
            }`}
          >
            {labelFor(l)}
          </button>
        ))}
      </div>
    </div>
  );
}
