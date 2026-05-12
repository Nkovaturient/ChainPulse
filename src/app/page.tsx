'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const TICKERS = [
  { sym: 'BTC', label: 'Bitcoin' },
  { sym: 'ETH', label: 'Ethereum' },
  { sym: 'SOL', label: 'Solana' },
  { sym: 'BNB', label: 'BNB' },
  { sym: 'AVAX', label: 'Avalanche' },
  { sym: 'LINK', label: 'Chainlink' },
  { sym: 'UNI', label: 'Uniswap' },
  { sym: 'DOT', label: 'Polkadot' },
];

const FEATURES = [
  { icon: '📈', title: 'Live Prices', desc: 'Real-time prices from CoinGecko with 7-day sparklines' },
  { icon: '🐳', title: 'Whale Watch', desc: 'Large ETH & SOL transactions tracked on-chain' },
  { icon: '📰', title: 'News Feed', desc: 'Aggregated from Cointelegraph & Decrypt RSS' },
  { icon: '🏦', title: 'DeFi TVL', desc: 'Top protocols by total value locked via DefiLlama' },
  { icon: '💎', title: 'Staking Yields', desc: 'Best APY pools filtered for low IL risk' },
  { icon: '🌐', title: 'Multilingual', desc: 'English · हिन्दी · বাংলা — AI-detected from your query' },
];

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background layers */}
      <div className="hero-bg" />
      <div className="hero-grid" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⛓</span>
          <span className="font-bold text-white tracking-tight text-lg">ChainPulse</span>
        </div>
        <div className="flex items-center gap-2 min-h-[36px]">
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-9 w-20 rounded-full bg-white/[.06] animate-pulse" aria-hidden />
              <div className="h-9 w-24 rounded-full bg-white/[.08] animate-pulse" aria-hidden />
            </div>
          ) : user ? (
            <>
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="text-xs px-4 py-2 rounded-full font-semibold text-white transition-all hover:opacity-90 shadow-lg shadow-indigo-500/20"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
              >
                Dashboard
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className="text-xs px-4 py-2 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/20 transition-colors font-medium">
                Sign in
              </button>
              <button
                type="button"
                onClick={() => router.push('/signup')}
                className="text-xs px-4 py-2 rounded-full font-semibold text-white transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                Get started
              </button>
            </>
          )}
        </div>
      </nav>

      {/* Ticker tape */}
      <div className="relative z-10 border-y border-white/5 bg-white/[.02] py-2 overflow-hidden">
        <div className="ticker-wrap">
          <div className="ticker-inner text-xs text-white/40 font-mono">
            {[...TICKERS, ...TICKERS].map((t, i) => (
              <span key={i} className="mx-6">
                <span className="text-indigo-400 font-semibold">{t.sym}</span>
                <span className="mx-1 opacity-40">·</span>
                {t.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
        {/* Badge */}
        <div className="animate-fade-up delay-100 mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live data · 2 AI calls per query
        </div>

        {/* Headline */}
        <h1 className="animate-fade-up delay-200 text-5xl sm:text-7xl font-extrabold tracking-tight text-white leading-[1.05] max-w-3xl mb-6">
          Crypto intel,{' '}
          <span className="gradient-text">one query away</span>
        </h1>

        {/* Sub */}
        <p className="animate-fade-up delay-300 text-lg text-white/50 max-w-lg mb-10 leading-relaxed">
          Ask in English, Hindi, or Bengali. Get live prices, whale moves, DeFi TVL,
          staking yields, and news — all in one AI-powered answer.
        </p>

        {/* CTA */}
        <div className="animate-fade-up delay-400 flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={() => router.push('/app')}
            className="glow-btn group relative px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-base hover:from-indigo-400 hover:to-violet-400 transition-all duration-300 flex items-center gap-2"
          >
            <span>Open Console</span>
            <span className="text-lg group-hover:translate-x-1 transition-transform">→</span>
          </button>
          <a
            href="#features"
            className="px-6 py-4 rounded-2xl border border-white/10 text-white/60 hover:text-white hover:border-white/20 font-medium text-sm transition-colors"
          >
            See features
          </a>
        </div>

        {/* Mini preview cards */}
        <div className="animate-fade-up delay-500 mt-16 flex items-stretch gap-3 max-w-2xl w-full overflow-x-auto pb-2">
          {[
            { label: 'BTC', val: '$81,408', chg: '+1.2%', up: true },
            { label: 'ETH', val: '$2,334', chg: '+0.8%', up: true },
            { label: 'SOL', val: '$93.4', chg: '-0.3%', up: false },
            { label: 'TVL', val: '$20.5B', chg: 'Lido', up: true },
          ].map((c) => (
            <div
              key={c.label}
              className="flex-shrink-0 flex-1 min-w-[110px] rounded-xl border border-white/8 bg-white/[.04] backdrop-blur p-3 text-left"
            >
              <div className="text-[10px] text-white/40 font-mono mb-1">{c.label}</div>
              <div className="text-white font-semibold text-sm">{c.val}</div>
              <div className={`text-[11px] font-medium mt-0.5 ${c.up ? 'text-emerald-400' : 'text-red-400'}`}>
                {c.chg}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Features */}
      <section id="features" className="relative z-10 px-6 py-20 max-w-6xl mx-auto w-full">
        <div className="relative mb-14 max-w-4xl mx-auto">
          <div
            aria-hidden
            className="edge-band-glow pointer-events-none absolute -inset-px rounded-3xl bg-gradient-to-r from-indigo-500/50 via-violet-400/40 to-cyan-400/50 blur-md opacity-70"
          />
          <div className="relative overflow-hidden rounded-3xl border-2 border-white/20 bg-slate-950/80 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,.06),inset_0_1px_0_rgba(255,255,255,.08)]">
            <div className="relative px-6 py-8 sm:px-10 sm:py-10">
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-300/90 px-3 py-1 rounded-full border-2 border-cyan-400/50 bg-cyan-500/10">
                  Competitive edge
                </span>
                <span className="text-[11px] font-semibold text-white/35">vs. walled garden dashboards</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border-2 border-indigo-400/45 bg-indigo-500/[.07] px-5 py-5 text-center md:text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-indigo-200/90 mb-1">No upfront paywalls</p>
                  <p className="text-sm sm:text-base font-extrabold text-white leading-snug border-b-2 border-indigo-400/40 pb-3 inline-block">
                    Skip the $4K–$5K/yr SaaS treadmill.
                  </p>
                  <p className="mt-3 text-xs text-white/50 leading-relaxed">
                    Explore intel without committing to heavyweight subscriptions first.
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-violet-400/45 bg-violet-500/[.07] px-5 py-5 text-center md:text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-violet-200/90 mb-1">Your cadence</p>
                  <p className="text-sm sm:text-base font-extrabold text-white leading-snug border-b-2 border-violet-400/40 pb-3 inline-block">
                    Use it at your own pace.
                  </p>
                  <p className="mt-3 text-xs text-white/50 leading-relaxed">
                    Dip in for one question or batch a research pass — friction stays low.
                  </p>
                </div>
                <div className="rounded-2xl border-2 border-emerald-400/40 bg-emerald-500/[.06] px-5 py-5 text-center md:text-left">
                  <p className="text-xs font-bold uppercase tracking-wide text-emerald-200/90 mb-1">Evolving with you</p>
                  <p className="text-sm sm:text-base font-extrabold text-white leading-snug border-b-2 border-emerald-400/35 pb-3 inline-block">
                    More depth ships as you ask.
                  </p>
                  <p className="mt-3 text-xs text-white/50 leading-relaxed">
                    Request flows and data slices; the roadmap follows real usage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-3">What ChainPulse knows</h2>
        <p className="text-center text-white/40 text-sm mb-10">
          Six live data streams, one intelligent interface
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="animate-fade-up rounded-2xl border border-white/8 bg-white/[.03] backdrop-blur p-5 hover:border-white/15 hover:bg-white/[.05] transition-all duration-300"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <div className="font-semibold text-white mb-1.5">{f.title}</div>
              <div className="text-sm text-white/45 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <button
            onClick={() => router.push('/app')}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-slate-900 font-semibold text-base hover:bg-slate-100 transition-colors"
          >
            Launch ChainPulse Console
            <span className="text-lg">→</span>
          </button>
          <p className="mt-4 text-white/30 text-xs">
            {user
              ? `${user.username} · Console is read-only · No wallet required`
              : 'No sign-up · No wallet · 100% read-only'}
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-6 text-center text-white/25 text-xs">
        ChainPulse · No financial advice · Data from CoinGecko, DefiLlama, Etherscan, Solscan, RSS feeds
      </footer>
    </div>
  );
}
