import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/contexts/ThemeContext';
import JotformFeedback from '@/components/JotformFeedback';

const geistSans = Geist({ variable: '--font-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ChainPulse — Crypto Intelligence',
  description:
    'Real-time multilingual crypto intelligence. Price, whale activity, DeFi TVL, staking yields — all in one query.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          {children}
          <JotformFeedback />
        </ThemeProvider>
      </body>
    </html>
  );
}
