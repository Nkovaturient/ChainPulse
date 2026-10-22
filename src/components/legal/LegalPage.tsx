import Link from 'next/link';
import type { ReactNode } from 'react';
import SiteFooter from '@/components/layout/SiteFooter';
import { LEGAL_LAST_UPDATED, LEGAL_OPERATOR } from '@/lib/legal';

interface LegalPageProps {
  title: string;
  children: ReactNode;
}

export default function LegalPage({ title, children }: LegalPageProps) {
  return (
    <div className="relative min-h-screen flex flex-col" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
      <div className="hero-bg" style={{ opacity: 0.5 }} />
      <div className="hero-grid" style={{ opacity: 0.4 }} />

      <header className="relative z-10 px-6 py-5 max-w-3xl mx-auto w-full">
        <Link href="/" className="inline-flex items-center gap-2 font-bold tracking-tight hover:opacity-80 transition-opacity">
          <span className="text-xl">⛓</span>
          {LEGAL_OPERATOR}
        </Link>
      </header>

      <main className="relative z-10 flex-1 px-6 pb-4 max-w-3xl mx-auto w-full">
        <article className="legal-prose">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">{title}</h1>
          <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
            Last updated: {LEGAL_LAST_UPDATED}
          </p>
          {children}
        </article>
      </main>

      <SiteFooter variant="legal" />
    </div>
  );
}
