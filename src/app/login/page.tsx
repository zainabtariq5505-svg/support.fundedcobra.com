'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Ticket, MessageSquare, Zap } from 'lucide-react';
import FCLogo from '@/components/shared/FCLogo';
import { createClient } from '@/lib/supabase/browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focusedField, setFocusedField] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Please fill in all fields.'); return; }

    setLoading(true);
    try {
      const sb = createClient();
      const { error: authErr } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authErr) {
        if (authErr.message.toLowerCase().includes('email not confirmed')) {
          setError('Please confirm your email first. Check your inbox for a verification link.');
        } else if (authErr.message.toLowerCase().includes('invalid login')) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(authErr.message);
        }
        setLoading(false);
        return;
      }

      const { data: { user } } = await sb.auth.getUser();
      if (user) {
        const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
        const role = profile?.role ?? 'customer';
        const isStaff = ['support_agent','finance','partnership_manager','admin'].includes(role);
        window.location.href = isStaff ? '/staff/dashboard' : '/';
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      setError('Connection error. Please check your internet and try again.');
      setLoading(false);
    }
  };

  const features = [
    { icon: Ticket,       text: 'Track all your support tickets' },
    { icon: MessageSquare,text: 'Real-time chat with our team'   },
    { icon: Zap,          text: 'Fast resolutions, 24/7 support' },
    { icon: Shield,       text: 'Secure & encrypted portal'      },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#060608',
      display: 'flex',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    }}>
      {/* ── Left panel ── */}
      <div style={{
        width: 420,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 44px',
        background: 'linear-gradient(160deg, #0f0f1a 0%, #0e0e12 60%, #0a0a10 100%)',
        borderRight: '1px solid #1a1a2e',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute',
          top: -80,
          left: -80,
          width: 320,
          height: 320,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute',
          bottom: 40,
          right: -60,
          width: 240,
          height: 240,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <FCLogo size="md" />
        </div>

        {/* Headline */}
        <div style={{ position: 'relative', zIndex: 1, marginBottom: 40 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            color: '#A855F7',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            marginBottom: 14,
          }}>
            WELCOME BACK
          </div>
          <h1 style={{
            fontSize: 30,
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: '-0.03em',
            color: '#ffffff',
            marginBottom: 16,
          }}>
            FUNDED COBRA<br />
            <span style={{
              background: 'linear-gradient(90deg, #A855F7, #C084FC)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              SUPPORT
            </span>
          </h1>
          <p style={{ fontSize: 14, color: '#6B6B80', lineHeight: 1.7, maxWidth: 300 }}>
            Sign in to manage your support requests, track your tickets, and stay connected with our team.
          </p>
        </div>

        {/* Feature list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'relative', zIndex: 1 }}>
          {features.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 9,
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Icon size={15} color="#A855F7" />
              </div>
              <span style={{ fontSize: 13, color: '#7070A0' }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Bottom badge */}
        <div style={{
          marginTop: 'auto',
          paddingTop: 40,
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#4ADE80', boxShadow: '0 0 6px #4ADE80' }} />
          <span style={{ fontSize: 11, color: '#404050' }}>Funded Cobra Support Portal v2.0</span>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 40px',
        background: '#060608',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Header */}
          <div style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 26,
              fontWeight: 800,
              color: '#F2F2F5',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}>
              Sign in
            </h2>
            <p style={{ fontSize: 14, color: '#60607A' }}>
              Don't have an account?{' '}
              <Link href="/signup" style={{
                color: '#A855F7',
                fontWeight: 600,
                textDecoration: 'none',
              }}>
                Create one free
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              padding: '12px 16px',
              marginBottom: 24,
              animation: 'shake 0.3s ease-out',
            }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>!</span>
              </div>
              <span style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{
                fontSize: 12,
                fontWeight: 600,
                color: '#7070A0',
                marginBottom: 8,
                display: 'block',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={15}
                  color={focusedField === 'email' ? '#A855F7' : '#404060'}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', pointerEvents: 'none' }}
                />
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField('')}
                  style={{
                    width: '100%',
                    paddingLeft: 44,
                    paddingRight: 16,
                    paddingTop: 13,
                    paddingBottom: 13,
                    backgroundColor: '#0E0E12',
                    border: `1.5px solid ${focusedField === 'email' ? 'rgba(168,85,247,0.5)' : '#1E1E2E'}`,
                    borderRadius: 10,
                    color: '#F2F2F5',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(168,85,247,0.08)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: '#7C3AED', fontWeight: 500, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={15}
                  color={focusedField === 'password' ? '#A855F7' : '#404060'}
                  style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', transition: 'color 0.2s', pointerEvents: 'none' }}
                />
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField('')}
                  style={{
                    width: '100%',
                    paddingLeft: 44,
                    paddingRight: 48,
                    paddingTop: 13,
                    paddingBottom: 13,
                    backgroundColor: '#0E0E12',
                    border: `1.5px solid ${focusedField === 'password' ? 'rgba(168,85,247,0.5)' : '#1E1E2E'}`,
                    borderRadius: 10,
                    color: '#F2F2F5',
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(168,85,247,0.08)' : 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#404060', padding: 0,
                    display: 'flex', alignItems: 'center',
                  }}
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#2a2a3a' : 'linear-gradient(135deg, #7C3AED, #A855F7)',
                color: loading ? '#60607A' : 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'all 0.2s',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
                marginTop: 4,
                letterSpacing: '0.02em',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 24px rgba(124,58,237,0.45)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = loading ? 'none' : '0 4px 16px rgba(124,58,237,0.35)';
              }}
            >
              {loading ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid #60607A', borderTopColor: '#A855F7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  Signing in…
                </>
              ) : (
                <>Sign In <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p style={{ fontSize: 11, color: '#30303A', textAlign: 'center', marginTop: 28, lineHeight: 1.7 }}>
            By signing in you agree to our{' '}
            <Link href="/terms" style={{ color: '#50507A' }}>Terms</Link> and{' '}
            <Link href="/privacy" style={{ color: '#50507A' }}>Privacy Policy</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-4px); }
          40%, 80% { transform: translateX(4px); }
        }
        input::placeholder { color: #2E2E42; }
      `}</style>
    </div>
  );
}
