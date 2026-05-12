'use client';

import { useRouter } from 'next/navigation';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export default function AuthShell({ children, title, subtitle }: Props) {
  const router = useRouter();
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background */}
      <div className="hero-bg" />
      <div className="hero-grid" />
      <div className="orb orb-1" style={{ opacity: 0.35 }} />
      <div className="orb orb-2" style={{ opacity: 0.3 }} />
      <div className="orb orb-3" style={{ opacity: 0.25 }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 group"
        >
          <span className="text-xl">⛓</span>
          <span className="font-bold text-white tracking-tight">ChainPulse</span>
        </button>
      </nav>

      {/* Card */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md animate-fade-up">
          {/* Glow border */}
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-[1px] rounded-3xl opacity-60"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,.5), rgba(139,92,246,.4), rgba(6,182,212,.3))',
                filter: 'blur(4px)',
              }}
            />
            <div
              className="relative rounded-3xl border border-white/10 p-8"
              style={{
                background: 'rgba(7,12,22,.85)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                boxShadow: '0 0 0 1px rgba(255,255,255,.05), inset 0 1px 0 rgba(255,255,255,.07), 0 32px 64px rgba(0,0,0,.5)',
              }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div
                  className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 text-xl"
                  style={{ background: 'linear-gradient(135deg, rgba(99,102,241,.3), rgba(139,92,246,.2))' }}
                >
                  ⛓
                </div>
                <h1 className="text-2xl font-bold text-white mb-1.5">{title}</h1>
                <p className="text-sm" style={{ color: '#8892a4' }}>{subtitle}</p>
              </div>

              {children}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
