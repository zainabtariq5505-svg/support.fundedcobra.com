'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';
import Image from 'next/image';

function PwStrength({ pw }: { pw: string }) {
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const cols  = ['#ef4444','#f97316','#eab308','#4ade80'];
  const labs  = ['Weak','Fair','Good','Strong'];
  if (!pw) return null;
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 3, flex: 1 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: i < score ? cols[score-1] : '#1a1a1a', transition: 'background .2s' }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: cols[score-1] ?? '#444', fontWeight: 600, minWidth: 36 }}>{labs[score-1] ?? ''}</span>
    </div>
  );
}

export default function SignupPage() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string, string>>({});
  const [success, setSuccess] = useState('');
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                                  e.name     = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))   e.email    = 'Enter a valid email';
    if (form.password.length < 8)                           e.password = 'Min 8 characters';
    if (form.password !== form.confirm)                     e.confirm  = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { data: { full_name: form.name.trim() } },
      });
      if (error) { setErrors({ form: error.message }); setLoading(false); return; }
      if (data.user && !data.session) { setSuccess(form.email); setLoading(false); return; }
      window.location.href = '/';
    } catch {
      setErrors({ form: 'Connection error. Please try again.' });
      setLoading(false);
    }
  };

  const inp = (k: string): React.CSSProperties => ({
    width: '100%', padding: '10px 12px',
    backgroundColor: '#0d0d0d',
    border: `1px solid ${errors[k] ? '#3b1010' : '#222'}`,
    borderRadius: 6, color: '#fff', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s',
  });

  if (success) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#000', display: 'flex', flexDirection: 'column', fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", sans-serif' }}>
      <nav style={{ height: 52, borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 16 }}>
        <Image src="/logo/logo.png" alt="Funded Cobra" width={120} height={28} style={{ objectFit: 'contain', height: 26, width: 'auto' }} />
        <span style={{ fontSize: 12, color: '#333' }}>/</span>
        <span style={{ fontSize: 13, color: '#555' }}>Support</span>
      </nav>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 360, textAlign: 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundColor: '#0a1a0a', border: '1px solid #1a3a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Check size={20} color="#4ade80" />
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff', marginBottom: 10 }}>Check your email</h2>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7, marginBottom: 24 }}>
            Confirmation link sent to <span style={{ color: '#fff' }}>{success}</span>.<br />
            Click it to activate your account.
          </p>
          <Link href="/login" style={{ display: 'inline-block', padding: '10px 24px', backgroundColor: '#4ade80', color: '#000', borderRadius: 6, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    }}>
      {/* Nav */}
      <nav style={{ height: 52, borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', padding: '0 32px', gap: 16 }}>
        <Link href="https://fundedcobra.com" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <Image src="/logo/logo.png" alt="Funded Cobra" width={120} height={28} style={{ objectFit: 'contain', height: 26, width: 'auto' }} />
        </Link>
        <span style={{ fontSize: 12, color: '#333' }}>/</span>
        <span style={{ fontSize: 13, color: '#555' }}>Support</span>
      </nav>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#fff', marginBottom: 6, letterSpacing: '-0.01em' }}>
              Create account
            </h1>
            <p style={{ fontSize: 14, color: '#555' }}>
              Already have one?{' '}
              <Link href="/login" style={{ color: '#4ade80', textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          {errors.form && (
            <div style={{ backgroundColor: '#110a0a', border: '1px solid #3b1010', borderRadius: 6, padding: '11px 14px', marginBottom: 18, fontSize: 13, color: '#f87171', lineHeight: 1.5 }}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input placeholder="Your name" value={form.name} onChange={e => f('name', e.target.value)}
                style={inp('name')}
                onFocus={e => e.target.style.borderColor = '#4ade80'}
                onBlur={e => e.target.style.borderColor = errors.name ? '#3b1010' : '#222'}
              />
              {errors.name && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{errors.name}</p>}
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => f('email', e.target.value)}
                style={inp('email')}
                onFocus={e => e.target.style.borderColor = '#4ade80'}
                onBlur={e => e.target.style.borderColor = errors.email ? '#3b1010' : '#222'}
              />
              {errors.email && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{errors.email}</p>}
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => f('password', e.target.value)}
                  style={{ ...inp('password'), paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = '#4ade80'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#3b1010' : '#222'}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <PwStrength pw={form.password} />
              {errors.password && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{errors.password}</p>}
            </div>

            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => f('confirm', e.target.value)}
                  style={{ ...inp('confirm'), paddingRight: 40 }}
                  onFocus={e => e.target.style.borderColor = '#4ade80'}
                  onBlur={e => e.target.style.borderColor = errors.confirm ? '#3b1010' : '#222'}
                />
                {form.confirm && form.confirm === form.password && (
                  <Check size={14} color="#4ade80" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)' }} />
                )}
              </div>
              {errors.confirm && <p style={{ fontSize: 12, color: '#f87171', marginTop: 4 }}>{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '11px', backgroundColor: loading ? '#111' : '#4ade80', color: loading ? '#444' : '#000', border: 'none', borderRadius: 6, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.01em' }}
              onMouseEnter={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#22c55e'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#4ade80'; }}
            >
              {loading ? <><span style={{ width: 13, height: 13, border: '2px solid #333', borderTopColor: '#4ade80', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 12, color: '#333', textAlign: 'center' }}>
            By signing up you agree to our{' '}
            <Link href="/terms" style={{ color: '#333' }}>Terms</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #2a2a2a; }
      `}</style>
    </div>
  );
}
