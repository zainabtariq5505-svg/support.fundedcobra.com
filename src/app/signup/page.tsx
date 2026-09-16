'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

function PwStrength({ pw }: { pw: string }) {
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const cols  = ['#EF4444','#F97316','#EAB308','#22C55E'];
  const labs  = ['Weak','Fair','Good','Strong'];
  if (!pw) return null;
  return (
    <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 3, flex: 1 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < score ? cols[score-1] : '#1F2537', transition: 'background .2s' }} />
        ))}
      </div>
      <span style={{ fontSize: 11, color: cols[score-1] ?? '#6B7280', fontWeight: 600, minWidth: 36 }}>{labs[score-1] ?? ''}</span>
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
    width: '100%', padding: '11px 14px',
    backgroundColor: '#161B2E',
    border: `1px solid ${errors[k] ? '#3F1A23' : '#1F2537'}`,
    borderRadius: 8, color: '#F1F1F3', fontSize: 14,
    outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color .15s',
  });

  if (success) return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', backgroundColor: '#162716', border: '1px solid #1E3A1E', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Check size={24} color="#22C55E" />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 600, color: '#F1F1F3', marginBottom: 10 }}>Confirm your email</h2>
        <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7, marginBottom: 24 }}>
          We sent a verification link to <strong style={{ color: '#F1F1F3' }}>{success}</strong>. Click it to activate your account.
        </p>
        <Link href="/login" style={{ display: 'inline-block', padding: '11px 28px', backgroundColor: '#7B61FF', color: '#fff', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
          Go to Sign In
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F1117', display: 'flex', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Left */}
      <div style={{ width: 400, flexShrink: 0, backgroundColor: '#161B2E', borderRight: '1px solid #1F2537', display: 'flex', flexDirection: 'column', padding: '48px 44px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 56 }}>
          <img src="/logo/logo.png" alt="Funded Cobra" style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div style={{ marginBottom: 40 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#7B61FF', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Support Portal</p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#F1F1F3', lineHeight: 1.3, marginBottom: 14 }}>
            Funded Cobra<br />Support
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', lineHeight: 1.7 }}>
            Create a free account to submit tickets and get expert help from our team.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            'Instant ticket tracking',
            'Real-time replies from our team',
            'File & screenshot attachments',
            'Multi-language support',
            'Secure & encrypted',
          ].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: '#1A2444', border: '1px solid #2A3A60', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Check size={10} color="#7B61FF" />
              </div>
              <span style={{ fontSize: 13, color: '#6B7280' }}>{item}</span>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 'auto', paddingTop: 48 }}>
          <p style={{ fontSize: 12, color: '#374151' }}>© 2026 Funded Cobra. All rights reserved.</p>
        </div>
      </div>

      {/* Right */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>

          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#F1F1F3', marginBottom: 6, letterSpacing: '-0.01em' }}>
            Create account
          </h2>
          <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 28 }}>
            Already have one?{' '}
            <Link href="/login" style={{ color: '#7B61FF', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>

          {errors.form && (
            <div style={{ backgroundColor: '#1F1014', border: '1px solid #3F1A23', borderRadius: 8, padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#F87171', lineHeight: 1.5 }}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 13, color: '#9CA3AF', display: 'block', marginBottom: 6 }}>Full Name</label>
              <input placeholder="Your name" value={form.name} onChange={e => f('name', e.target.value)}
                style={inp('name')}
                onFocus={e => e.target.style.borderColor = '#7B61FF'}
                onBlur={e => e.target.style.borderColor = errors.name ? '#3F1A23' : '#1F2537'}
              />
              {errors.name && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize: 13, color: '#9CA3AF', display: 'block', marginBottom: 6 }}>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => f('email', e.target.value)}
                style={inp('email')}
                onFocus={e => e.target.style.borderColor = '#7B61FF'}
                onBlur={e => e.target.style.borderColor = errors.email ? '#3F1A23' : '#1F2537'}
              />
              {errors.email && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize: 13, color: '#9CA3AF', display: 'block', marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => f('password', e.target.value)}
                  style={{ ...inp('password'), paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = '#7B61FF'}
                  onBlur={e => e.target.style.borderColor = errors.password ? '#3F1A23' : '#1F2537'}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', display: 'flex', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <PwStrength pw={form.password} />
              {errors.password && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.password}</p>}
            </div>

            {/* Confirm */}
            <div>
              <label style={{ fontSize: 13, color: '#9CA3AF', display: 'block', marginBottom: 6 }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => f('confirm', e.target.value)}
                  style={{ ...inp('confirm'), paddingRight: 42 }}
                  onFocus={e => e.target.style.borderColor = '#7B61FF'}
                  onBlur={e => e.target.style.borderColor = errors.confirm ? '#3F1A23' : '#1F2537'}
                />
                {form.confirm && form.confirm === form.password && (
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: '#22C55E' }}>
                    <Check size={14} />
                  </div>
                )}
              </div>
              {errors.confirm && <p style={{ fontSize: 12, color: '#F87171', marginTop: 4 }}>{errors.confirm}</p>}
            </div>

            <button type="submit" disabled={loading}
              style={{ width: '100%', padding: '12px', backgroundColor: loading ? '#2A2D3A' : '#7B61FF', color: loading ? '#6B7280' : '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, transition: 'background .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onMouseEnter={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#6D52F5'; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget).style.backgroundColor = '#7B61FF'; }}
            >
              {loading ? <><span style={{ width: 14, height: 14, border: '2px solid #4B5563', borderTopColor: '#7B61FF', borderRadius: '50%', display: 'inline-block', animation: 'spin .7s linear infinite' }} /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: 20, fontSize: 12, color: '#374151', textAlign: 'center' }}>
            By signing up you agree to our{' '}
            <Link href="/terms" style={{ color: '#374151' }}>Terms</Link>
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
