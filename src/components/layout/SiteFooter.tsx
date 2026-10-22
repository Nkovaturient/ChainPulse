import Link from 'next/link';
import { LEGAL_FOOTER_LINKS, LEGAL_OPERATOR } from '@/lib/legal';

type SiteFooterVariant = 'landing' | 'legal';

interface SiteFooterProps {
  variant?: SiteFooterVariant;
}

export default function SiteFooter({ variant = 'landing' }: SiteFooterProps) {
  const linkClass =
    variant === 'landing'
      ? 'text-white/40 hover:text-white/70 transition-colors'
      : 'hover:opacity-80 transition-opacity';
  const mutedClass = variant === 'landing' ? 'text-white/25' : '';
  const mutedStyle = variant === 'legal' ? { color: 'var(--text-muted)' } : undefined;

  return (
    <footer
      className={`relative z-10 w-full max-w-6xl mx-auto px-6 py-8 ${
        variant === 'landing' ? 'border-t border-white/5' : ''
      }`}
    >
      <div className="flex flex-col items-center gap-4 text-center text-xs">
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
          <Link href="/" className={`font-semibold tracking-tight ${linkClass}`}>
            ⛓ {LEGAL_OPERATOR}
          </Link>
          <span className={mutedClass} style={mutedStyle} aria-hidden>
            ·
          </span>
          {LEGAL_FOOTER_LINKS.map((item, i) => (
            <span key={item.href} className="inline-flex items-center gap-1">
              {i > 0 && (
                <span className={mutedClass} style={mutedStyle} aria-hidden>
                  ·
                </span>
              )}
              <Link href={item.href} className={linkClass} style={variant === 'legal' ? mutedStyle : undefined}>
                {item.label}
              </Link>
            </span>
          ))}
        </div>
        <p className={`max-w-2xl leading-relaxed ${mutedClass}`} style={mutedStyle}>
          © 2026 {LEGAL_OPERATOR} · Read-only · No wallet · No financial advice
        </p>
      </div>
    </footer>
  );
}
