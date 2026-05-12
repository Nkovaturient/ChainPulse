'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthShell from '@/components/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { safePostAuthPath } from '@/lib/auth-redirect';
import type { UserRole } from '@/types';

const ROLES: { value: UserRole; label: string; icon: string; hint: string }[] = [
  { value: 'student',          label: 'Student',          icon: '🎓', hint: 'Learning about crypto' },
  { value: 'trader',           label: 'Trader',           icon: '📊', hint: 'Active market participant' },
  { value: 'crypto_investor',  label: 'Investor',         icon: '💼', hint: 'Long-term portfolio' },
  { value: 'just_exploring',   label: 'Just Exploring',   icon: '🧭', hint: 'Curious, no commitments' },
  { value: 'tech_savvy',       label: 'Tech / Builder',   icon: '⚙️', hint: 'Dev or protocol researcher' },
];

function SignupForm() {
  const router = useRouter();
  const params = useSearchParams();
  const { refresh } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [role, setRole] = useState<UserRole | ''>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !username || !password) return;
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setStep(2);
  };

  const submit = async () => {
    if (!role) { setError('Please choose your role.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, username, password, role }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setStep(1);
        setError(data.error ?? 'Registration failed.');
        return;
      }
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
    <AuthShell title="Create account" subtitle="Join ChainPulse — free, no wallet needed">
      {step === 1 ? (
        <form onSubmit={nextStep} className="space-y-4">
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <Field label="Username" value={username} onChange={setUsername} placeholder="satoshi42" />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: '#8892a4' }}>Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                required
                className="w-full px-4 py-3 pr-12 rounded-xl text-sm text-white placeholder-white/20 border outline-none transition-all"
                style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.1)' }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,.6)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: '#8892a4' }}>
                {showPwd ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          <button type="submit" disabled={!email || !username || !password}
            className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 mt-2"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            Continue →
          </button>

          <p className="text-center text-xs mt-4" style={{ color: '#8892a4' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                const n = params.get('next');
                router.push(n ? `/login?next=${encodeURIComponent(n)}` : '/login');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
              Sign in
            </button>
          </p>
        </form>
      ) : (
        <div className="space-y-6 animate-fade-up">
          <div>
            <p className="text-xs font-semibold text-white/70 mb-3 uppercase tracking-wider">
              How do you describe yourself?
            </p>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-all duration-200"
                  style={{
                    borderColor: role === r.value ? 'rgba(99,102,241,.6)' : 'rgba(255,255,255,.07)',
                    background: role === r.value
                      ? 'linear-gradient(135deg, rgba(99,102,241,.18), rgba(139,92,246,.12))'
                      : 'rgba(255,255,255,.03)',
                    transform: role === r.value ? 'scale(1.01)' : 'scale(1)',
                    boxShadow: role === r.value ? '0 0 0 1px rgba(99,102,241,.3)' : 'none',
                  }}
                >
                  <span className="text-xl flex-shrink-0">{r.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white">{r.label}</div>
                    <div className="text-[11px]" style={{ color: '#8892a4' }}>{r.hint}</div>
                  </div>
                  {role === r.value && (
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px]"
                      style={{ background: '#6366f1' }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {error && <ErrorBox msg={error} />}

          <div className="flex gap-3">
            <button type="button" onClick={() => { setStep(1); setError(''); }}
              className="flex-1 py-3 rounded-xl font-medium text-sm border transition-all"
              style={{ borderColor: 'rgba(255,255,255,.1)', color: '#8892a4' }}>
              ← Back
            </button>
            <button type="button" onClick={submit} disabled={!role || loading}
              className="flex-[2] py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </div>
        </div>
      )}

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mt-6">
        {[1, 2].map((s) => (
          <div key={s} className="h-1 rounded-full transition-all duration-300"
            style={{ width: step === s ? 20 : 6, background: step === s ? '#6366f1' : 'rgba(255,255,255,.15)' }} />
        ))}
      </div>
    </AuthShell>
  );
}

function SignupFallback() {
  return (
    <AuthShell title="Create account" subtitle="Join ChainPulse — free, no wallet needed">
      <div className="flex justify-center py-12">
        <span className="w-8 h-8 border-2 border-white/20 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}

function Field({ label, type = 'text', value, onChange, placeholder }: {
  label: string; type?: string; value: string; onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium" style={{ color: '#8892a4' }}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} required
        className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/20 border outline-none transition-all"
        style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.1)' }}
        onFocus={(e) => (e.currentTarget.style.borderColor = 'rgba(99,102,241,.6)')}
        onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,.1)')}
      />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl px-4 py-3 text-xs text-red-300 border border-red-500/20"
      style={{ background: 'rgba(239,68,68,.08)' }}>
      {msg}
    </div>
  );
}
