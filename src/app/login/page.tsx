'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const sb = createClient();
      const { error: authErr } = await sb.auth.signInWithPassword({ email: email.trim(), password });
      if (authErr) {
        setError(
          authErr.message.toLowerCase().includes('invalid')    ? 'Incorrect email or password.' :
          authErr.message.toLowerCase().includes('confirmed')  ? 'Please confirm your email first.' :
          authErr.message
        );
        setLoading(false);
        return;
      }
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
        window.location.href = ['support_agent','finance','partnership_manager','admin'].includes(profile?.role ?? '') ? '/staff/dashboard' : '/';
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Connection error. Please check your internet and try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1117',
      display: 'flex',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      {/* Left */}
      <div style={{
        width: 420,
        flexShrink: 0,
        backgroundColor: '#161B2E',
        borderRight: '1px solid #1F2537',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 44px',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <img src="/logo/logo.png" alt="Funded Cobra" style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
          />
        </div>

        <div style={{ marginBottom: 48 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#7B61FF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Support Portal</p>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#F1F1F3', lineHeight: 1.3, marginBottom: 14, letterSpacing: '-0.01em' }}>
            Funded Cobra<br />Support
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
            Manage your support tickets, track resolutions, and get help from our team.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {[
            { label: 'Response time',  value: '< 2 hours'   },
            { label: 'Availability',   value: '24 / 7'      },
            { label: 'Satisfaction',   value: '98%'          },
          ].map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 20, borderBottom: '1px solid #1F2537' }}>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{s.label}</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#F1F1F3' }}>{s.value}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 48 }}>
          <p style={{ fontSize: 12, color: '#374151' }}>© 2026 Funded Cobra. All rights reserved.</p>
        </div>
      </div>

      {/* Right */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#F1F1F3', marginBottom: 6, letterSpacing: '-0.01em' }}>
            Sign in
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 32 }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: '#7B61FF', fontWeight: 500, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>

          {error && (
            <div style={{ backgroundColor: '#1F1014', border: '1px solid #3F1A23', borderRadius: 8, padding: '12px 14px', marginBottom: 22, fontSize: 13, color: '#F87171', lineHeight: 1.5 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: '#9CA3AF', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', padding: '11px 14px', backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 8, color: '#F1F1F3', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s' }}
                onFocus={e => e.target.style.borderColor = '#7B61FF'}
                onBlur={e => e.target.style.borderColor = '#1F2537'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 13, color: '#9CA3AF' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 13, color: '#7B61FF', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '11px 42px 11px 14px', backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 8, color: '#F1F1F3', fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s' }}
                  onFocus={e => e.target.style.borderColor = '#7B61FF'}
                  onBlur={e => e.target.style.borderColor = '#1F2537'}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#2A2D3A' : '#7B61FF', color: loading ? '#6B7280' : '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#6D52F5'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#7B61FF'; }}
            >
              {loading ? <><span style={{ width: 14, height: 14, border: '2px solid #4B5563', borderTopColor: '#7B61FF', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: 12, color: '#374151', textAlign: 'center' }}>
            <Link href="/terms" style={{ color: '#374151', textDecoration: 'none' }}>Terms</Link>
            {' · '}
            <Link href="/privacy" style={{ color: '#374151', textDecoration: 'none' }}>Privacy</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #374151; }
      `}</style>
    </div>
  );
}
