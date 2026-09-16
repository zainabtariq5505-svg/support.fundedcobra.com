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
          authErr.message.toLowerCase().includes('invalid')   ? 'Incorrect email or password.' :
          authErr.message.toLowerCase().includes('confirmed') ? 'Please confirm your email first.' :
          authErr.message
        );
        setLoading(false);
        return;
      }
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: p } = await sb.from('profiles').select('role').eq('id', user.id).single();
        window.location.href = ['support_agent','finance','partnership_manager','admin'].includes(p?.role ?? '') ? '/staff/dashboard' : '/';
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
    }}>
      {/* Top nav */}
      <nav style={{
        height: 52,
        borderBottom: '1px solid #1a1a1a',
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        gap: 12,
      }}>
        <Link href="https://fundedcobra.com" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img
            src="/logo/logo.png"
            alt="Funded Cobra"
            style={{ height: 28, width: 'auto', objectFit: 'contain' }}
            onError={e => {
              const img = e.target as HTMLImageElement;
              img.style.display = 'none';
              const fallback = img.nextSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <span style={{
            display: 'none',
            alignItems: 'center',
            gap: 6,
            fontSize: 14,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.01em',
          }}>
            <span style={{ color: '#4ade80' }}>●</span> FundedCobra
          </span>
        </Link>
        <span style={{ color: '#222', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 13, color: '#444' }}>Support</span>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>

          {/* Heading */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: '#ffffff', marginBottom: 6, letterSpacing: '-0.01em' }}>
              Sign in to Support
            </h1>
            <p style={{ fontSize: 14, color: '#555' }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{ color: '#4ade80', textDecoration: 'none' }}>
                Create one
              </Link>
            </p>
          </div>

          {error && (
            <div style={{
              backgroundColor: '#110a0a',
              border: '1px solid #3b1010',
              borderRadius: 6,
              padding: '11px 14px',
              marginBottom: 20,
              fontSize: 13,
              color: '#f87171',
              lineHeight: 1.5,
            }}>
              {error.includes('fetch') || error.includes('network') || error.includes('Connection')
                ? 'Unable to connect. Please check your internet connection and try again.'
                : error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, color: '#555', display: 'block', marginBottom: 6 }}>Email</label>
              <input
                type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px',
                  backgroundColor: '#0d0d0d',
                  border: '1px solid #222',
                  borderRadius: 6,
                  color: '#fff', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', fontFamily: 'inherit',
                  transition: 'border-color .15s',
                }}
                onFocus={e => e.target.style.borderColor = '#4ade80'}
                onBlur={e => e.target.style.borderColor = '#222'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, color: '#555' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: '#4ade80', textDecoration: 'none' }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 40px 10px 12px',
                    backgroundColor: '#0d0d0d',
                    border: '1px solid #222',
                    borderRadius: 6,
                    color: '#fff', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', fontFamily: 'inherit',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#4ade80'}
                  onBlur={e => e.target.style.borderColor = '#222'}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#444', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '11px',
                backgroundColor: loading ? '#111' : '#4ade80',
                color: loading ? '#444' : '#000',
                border: 'none', borderRadius: 6,
                fontSize: 14, fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: 4, transition: 'background .15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#22c55e'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#4ade80'; }}
            >
              {loading ? (
                <><span style={{ width: 13, height: 13, border: '2px solid #333', borderTopColor: '#4ade80', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Signing in…</>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #111', display: 'flex', gap: 16, justifyContent: 'center' }}>
            <Link href="/terms" style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}>Terms</Link>
            <Link href="/privacy" style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}>Privacy</Link>
            <a href="https://fundedcobra.com" style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}>fundedcobra.com</a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #2a2a2a; }
        input::-webkit-input-placeholder { color: #2a2a2a; }
      `}</style>
    </div>
  );
}
