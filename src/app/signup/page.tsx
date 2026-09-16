'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle2, Zap, Shield, MessageSquare, Ticket } from 'lucide-react';
import FCLogo from '@/components/shared/FCLogo';
import { createClient } from '@/lib/supabase/browser';

function StrengthBar({ password }: { password: string }) {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const colors = ['', '#ef4444', '#f97316', '#eab308', '#10b981'];
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

  if (!password) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            backgroundColor: i <= score ? colors[score] : '#1E1E2E',
            transition: 'background 0.2s',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 11, color: colors[score], fontWeight: 600 }}>{labels[score]}</div>
    </div>
  );
}

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [focused, setFocused]   = useState('');
  const [success, setSuccess]   = useState('');
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                                e.name     = 'Full name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email    = 'Enter a valid email';
    if (form.password.length < 8)                         e.password = 'At least 8 characters';
    if (form.password !== form.confirm)                   e.confirm  = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);

    try {
      const sb = createClient();
      const { data, error } = await sb.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: { data: { full_name: form.name.trim() } },
      });

      if (error) {
        setErrors({ form: error.message });
        setLoading(false);
        return;
      }

      if (data.user && !data.session) {
        setSuccess(`Check your email at ${form.email} for a confirmation link, then sign in.`);
        setLoading(false);
        return;
      }

      window.location.href = '/';
    } catch {
      setErrors({ form: 'Connection error. Please check your internet and try again.' });
      setLoading(false);
    }
  };

  const perks = [
    { icon: Ticket,        text: 'Instant ticket tracking'         },
    { icon: MessageSquare, text: 'Real-time replies from staff'     },
    { icon: Zap,           text: 'File attachment support'          },
    { icon: Shield,        text: 'Secure & encrypted portal'        },
  ];

  const inputStyle = (field: string, hasError?: boolean): React.CSSProperties => ({
    width: '100%',
    paddingLeft: 44,
    paddingRight: field === 'password' || field === 'confirm' ? 48 : 16,
    paddingTop: 13,
    paddingBottom: 13,
    backgroundColor: '#0E0E12',
    border: `1.5px solid ${hasError ? 'rgba(239,68,68,0.4)' : focused === field ? 'rgba(168,85,247,0.5)' : '#1E1E2E'}`,
    borderRadius: 10,
    color: '#F2F2F5',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: hasError ? 'none' : focused === field ? '0 0 0 3px rgba(168,85,247,0.08)' : 'none',
  });

  const iconColor = (field: string) => focused === field ? '#A855F7' : '#404060';

  // Success state
  if (success) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>
          <div style={{ fontSize: 56, marginBottom: 20 }}>📬</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F2F2F5', marginBottom: 12, letterSpacing: '-0.02em' }}>
            Check your inbox
          </h1>
          <p style={{ fontSize: 14, color: '#60607A', lineHeight: 1.7, marginBottom: 28 }}>{success}</p>
          <Link href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 28px',
            background: 'linear-gradient(135deg, #7C3AED, #A855F7)',
            color: 'white', borderRadius: 10, fontSize: 14, fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(124,58,237,0.35)',
          }}>
            Go to Sign In <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#060608',
      display: 'flex',
      fontFamily: 'ui-sans-serif, system-ui, -apple-system, sans-serif',
    }}>
      {/* ── Left panel ── */}
      <div style={{
        width: 400,
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        padding: '48px 44px',
        background: 'linear-gradient(160deg, #0f0f1a 0%, #0e0e12 60%, #0a0a10 100%)',
        borderRight: '1px solid #1a1a2e',
      }}>
        <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(109,40,217,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 40, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

        <div style={{ marginBottom: 48, position: 'relative', zIndex: 1 }}>
          <FCLogo size="md" />
        </div>

        <div style={{ position: 'relative', zIndex: 1, marginBottom: 36 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#A855F7', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 14 }}>
            JOIN TODAY
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#ffffff', marginBottom: 16 }}>
            FUNDED COBRA<br />
            <span style={{ background: 'linear-gradient(90deg, #A855F7, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              SUPPORT
            </span>
          </h1>
          <p style={{ fontSize: 14, color: '#6B6B80', lineHeight: 1.7, maxWidth: 280 }}>
            Create your free account to get instant access to our support team.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'relative', zIndex: 1 }}>
          {perks.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckCircle2 size={15} color="#A855F7" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#7070A0' }}>{text}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 40, position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
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
        overflowY: 'auto',
        background: '#060608',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>

          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#F2F2F5', letterSpacing: '-0.02em', marginBottom: 8 }}>
              Create account
            </h2>
            <p style={{ fontSize: 14, color: '#60607A' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: '#A855F7', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
            </p>
          </div>

          {errors.form && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 24 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', backgroundColor: 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 700 }}>!</span>
              </div>
              <span style={{ fontSize: 13, color: '#FCA5A5', lineHeight: 1.5 }}>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Full Name */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name</label>
              <div style={{ position: 'relative' }}>
                <User size={15} color={iconColor('name')} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.2s' }} />
                <input
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => f('name', e.target.value)}
                  onFocus={() => setFocused('name')}
                  onBlur={() => setFocused('')}
                  style={inputStyle('name', !!errors.name)}
                />
              </div>
              {errors.name && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 5 }}>{errors.name}</div>}
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color={iconColor('email')} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.2s' }} />
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => f('email', e.target.value)}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused('')}
                  style={inputStyle('email', !!errors.email)}
                />
              </div>
              {errors.email && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 5 }}>{errors.email}</div>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color={iconColor('password')} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.2s' }} />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={e => f('password', e.target.value)}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  style={inputStyle('password', !!errors.password)}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#404060', padding: 0, display: 'flex' }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <StrengthBar password={form.password} />
              {errors.password && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 5 }}>{errors.password}</div>}
            </div>

            {/* Confirm Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#7070A0', marginBottom: 8, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color={iconColor('confirm')} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', transition: 'color 0.2s' }} />
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={form.confirm}
                  onChange={e => f('confirm', e.target.value)}
                  onFocus={() => setFocused('confirm')}
                  onBlur={() => setFocused('')}
                  style={inputStyle('confirm', !!errors.confirm)}
                />
                {form.confirm && form.confirm === form.password && (
                  <CheckCircle2 size={15} color="#10b981" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }} />
                )}
              </div>
              {errors.confirm && <div style={{ fontSize: 11, color: '#ef4444', marginTop: 5 }}>{errors.confirm}</div>}
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
                  Creating account…
                </>
              ) : (
                <>Create Account <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p style={{ fontSize: 11, color: '#30303A', textAlign: 'center', marginTop: 24, lineHeight: 1.7 }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" style={{ color: '#50507A' }}>Terms of Service</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder { color: #2E2E42; }
      `}</style>
    </div>
  );
}
