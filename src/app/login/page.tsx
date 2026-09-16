'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
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
        setError(authErr.message.toLowerCase().includes('invalid') ? 'Incorrect email or password.' : authErr.message.toLowerCase().includes('confirmed') ? 'Please verify your email first.' : authErr.message);
        setLoading(false);
        return;
      }
      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role ?? 'customer';
        window.location.href = ['support_agent','finance','partnership_manager','admin'].includes(role) ? '/staff/dashboard' : '/';
      } else {
        window.location.href = '/';
      }
    } catch {
      setError('Connection error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'ui-sans-serif, system-ui, sans-serif', backgroundColor: '#08080F' }}>

      {/* ── Decorative left ── */}
      <div style={{
        width: '45%', maxWidth: 560,
        background: 'linear-gradient(145deg, #0D0B1E 0%, #110D2A 40%, #0A0818 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '52px 56px', position: 'relative', overflow: 'hidden',
        borderRight: '1px solid rgba(139,92,246,0.08)',
      }}>
        {/* Grid pattern */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }} />
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

        {/* Logo area */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 64 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: 'linear-gradient(135deg, #6D28D9, #A855F7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(109,40,217,0.4)',
            }}>
              <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
                <path d="M6 29 C5 18 12 8 20 6 C20 6 17 14 14 19 C11 24 8 27 6 29Z" fill="rgba(255,255,255,0.9)" />
                <path d="M34 29 C35 18 28 8 20 6 C20 6 23 14 26 19 C29 24 32 27 34 29Z" fill="rgba(255,255,255,0.9)" />
                <ellipse cx="20" cy="26" rx="10" ry="11" fill="white" />
                <ellipse cx="16.5" cy="23" rx="2.2" ry="2.5" fill="#6D28D9" />
                <ellipse cx="23.5" cy="23" rx="2.2" ry="2.5" fill="#6D28D9" />
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#F0F0FF', letterSpacing: '-0.01em' }}>Funded Cobra</div>
              <div style={{ fontSize: 11, color: 'rgba(168,85,247,0.8)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Support Portal</div>
            </div>
          </div>

          <div style={{ marginBottom: 40 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              backgroundColor: 'rgba(74,222,128,0.08)',
              border: '1px solid rgba(74,222,128,0.15)',
              borderRadius: 20, padding: '5px 12px', marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
              <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 600, letterSpacing: '0.04em' }}>All systems operational</span>
            </div>
            <h1 style={{ fontSize: 38, fontWeight: 900, color: '#F0F0FF', lineHeight: 1.08, letterSpacing: '-0.04em', marginBottom: 16 }}>
              World-class<br />
              <span style={{
                background: 'linear-gradient(135deg, #A855F7 0%, #C084FC 50%, #A855F7 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>support</span><br />
              for traders.
            </h1>
            <p style={{ fontSize: 15, color: 'rgba(180,180,210,0.6)', lineHeight: 1.7, maxWidth: 320 }}>
              Get instant help from our expert team. Fast responses, secure communication, premium experience.
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
            {[
              { value: '< 2h',  label: 'Avg Response',    color: '#A855F7' },
              { value: '98%',   label: 'Satisfaction',     color: '#4ADE80' },
              { value: '24/7',  label: 'Support Hours',    color: '#93C5FD' },
              { value: '10k+',  label: 'Tickets Resolved', color: '#FCD34D' },
            ].map(s => (
              <div key={s.label} style={{
                backgroundColor: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 10, padding: '14px 16px',
              }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'rgba(180,180,210,0.5)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial */}
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 12, padding: '18px 20px',
          }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 10 }}>
              {[1,2,3,4,5].map(i => <span key={i} style={{ fontSize: 13, color: '#FCD34D' }}>★</span>)}
            </div>
            <p style={{ fontSize: 13, color: 'rgba(200,200,230,0.6)', lineHeight: 1.65, marginBottom: 12, fontStyle: 'italic' }}>
              "Resolved my payout issue in under 30 minutes. Best support I've experienced from a prop firm."
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6D28D9,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>A</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(220,220,240,0.7)' }}>Alex M.</div>
                <div style={{ fontSize: 10, color: 'rgba(180,180,210,0.4)' }}>Verified Trader</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sign in form ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '52px 40px', background: '#08080F',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#F0F0FF', letterSpacing: '-0.03em', marginBottom: 10 }}>
              Welcome back
            </h2>
            <p style={{ fontSize: 14, color: '#50506A' }}>
              New here?{' '}
              <Link href="/signup" style={{ color: '#A855F7', fontWeight: 600, textDecoration: 'none' }}>
                Create a free account →
              </Link>
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)',
              borderLeft: '3px solid #ef4444',
              borderRadius: 8, padding: '12px 16px', marginBottom: 24,
              fontSize: 13, color: '#FCA5A5', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#6060A0', marginBottom: 8, display: 'block', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                Email
              </label>
              <input
                type="email" autoComplete="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', padding: '13px 16px',
                  backgroundColor: '#0E0E1C', border: '1px solid #1A1A2E',
                  borderRadius: 10, color: '#F0F0FF', fontSize: 14, outline: 'none',
                  boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                  fontFamily: 'inherit',
                }}
                onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.07)'; }}
                onBlur={e => { e.target.style.borderColor = '#1A1A2E'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#6060A0', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: '#7C3AED', textDecoration: 'none', fontWeight: 500 }}>Forgot?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  style={{
                    width: '100%', padding: '13px 44px 13px 16px',
                    backgroundColor: '#0E0E1C', border: '1px solid #1A1A2E',
                    borderRadius: 10, color: '#F0F0FF', fontSize: 14, outline: 'none',
                    boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
                    fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(168,85,247,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(168,85,247,0.07)'; }}
                  onBlur={e => { e.target.style.borderColor = '#1A1A2E'; e.target.style.boxShadow = 'none'; }}
                />
                <button type="button" onClick={() => setShowPw(p => !p)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#404060', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#1A1A2A' : 'linear-gradient(135deg, #6D28D9 0%, #9333EA 50%, #A855F7 100%)',
                color: loading ? '#404060' : '#fff',
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s', marginTop: 6,
                boxShadow: loading ? 'none' : '0 4px 20px rgba(109,40,217,0.4)',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={e => { if (!loading) { (e.currentTarget).style.transform = 'translateY(-2px)'; (e.currentTarget).style.boxShadow = '0 8px 28px rgba(109,40,217,0.5)'; } }}
              onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; (e.currentTarget).style.boxShadow = loading ? 'none' : '0 4px 20px rgba(109,40,217,0.4)'; }}
            >
              {loading ? (
                <><div style={{ width: 16, height: 16, border: '2px solid #404060', borderTopColor: '#9333EA', borderRadius: '50%', animation: 'spin .7s linear infinite' }} /> Signing in…</>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div style={{ marginTop: 28, paddingTop: 24, borderTop: '1px solid #0F0F1E', textAlign: 'center' }}>
            <span style={{ fontSize: 11, color: '#282840' }}>
              Protected by Supabase Auth · {' '}
              <Link href="/terms" style={{ color: '#303050' }}>Terms</Link> · <Link href="/privacy" style={{ color: '#303050' }}>Privacy</Link>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #252535; }
      `}</style>
    </div>
  );
}
