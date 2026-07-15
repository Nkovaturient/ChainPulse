'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import GoogleSignInButton from '@/components/auth/GoogleSignInButton';
import AuthDivider from '@/components/auth/AuthDivider';
import { useAuth } from '@/contexts/AuthContext';
import { safePostAuthPath } from '@/lib/auth-redirect';

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Google sign-in was cancelled or interrupted.',
  exchange: 'Could not complete Google sign-in. Please try again.',
  no_email: 'Your Google account did not provide an email address.',
  config: 'Google sign-in is not configured on this server.',
  server: 'Something went wrong during Google sign-in.',
};

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextParam = params.get('next');
  const oauthError =
    params.get('error') === 'oauth'
      ? OAUTH_ERROR_MESSAGES[params.get('reason') ?? ''] ?? 'Google sign-in failed. Please try again.'
      : '';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) { setError(data.error ?? 'Login failed.'); return; }
      await refresh();
      const dest = safePostAuthPath(params.get('next'), '/dashboard');
      window.location.assign(dest);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your ChainPulse account">
      <form onSubmit={submit} className="space-y-4">
        <GoogleSignInButton next={nextParam} disabled={loading} />
        <AuthDivider />

        <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" disabled={loading} />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium" style={{ color: '#8892a4' }}>Password</label>
          <div className="relative">
            <input
              type={showPwd ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
              className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-white/20 border outline-none transition-all"
              style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.1)' }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,.6)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
            />
            <button
              type="button"
              onClick={() => setShowPwd((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
              style={{ color: '#8892a4' }}
            >
              {showPwd ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {(error || oauthError) && (
          <div className="rounded-xl px-4 py-3 text-xs text-red-300 border border-red-500/20"
            style={{ background: 'rgba(239,68,68,.08)' }}>
            {error || oauthError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
          style={{ background: loading ? 'rgba(99,102,241,.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
        >
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: '#8892a4' }}>
          No account?{' '}
          <button
            type="button"
            onClick={() => {
              const n = params.get('next');
              router.push(n ? `/signup?next=${encodeURIComponent(n)}` : '/signup');
            }}
            className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
            Create one
          </button>
        </p>
      </form>
    </AuthShell>
  );
}

function LoginFallback() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to your ChainPulse account">
      <div className="flex justify-center py-12">
        <span className="w-8 h-8 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function Field({
  label, type = 'text', value, onChange, placeholder, disabled,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder: string; disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium" style={{ color: '#8892a4' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required
        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border outline-none transition-all"
        style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.1)' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,.6)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
      />
    </div>
  );
}
