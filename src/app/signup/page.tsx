'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import FCLogo from '@/components/shared/FCLogo';
import { C, btn, input } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

function DiscordIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 24 18" fill="currentColor">
      <path d="M20.317 1.492a19.825 19.825 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm]     = useState({ name: '', email: '', password: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focused, setFocused] = useState('');
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim())                                      e.name     = 'Full name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))       e.email    = 'Enter a valid email address';
    if (form.password.length < 8)                               e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirm)                         e.confirm  = 'Passwords do not match';
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    if (!isSupabaseConfigured()) { setErrors({ form: 'Supabase is not configured yet. Add your credentials to .env.local.' }); setLoading(false); return; }
    const sb = createClient();
    const { data, error } = await sb.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { full_name: form.name } },
    });
    if (error) { setErrors({ form: error.message }); setLoading(false); return; }

    // If email confirmation is required, Supabase returns a user but no session.
    // Inform the user clearly instead of silently redirecting to a broken state.
    if (data.user && !data.session) {
      setErrors({ form: 'Account created! Please check your email (' + form.email + ') and click the confirmation link before signing in.' });
      setLoading(false);
      return;
    }

    // Hard redirect so session cookie is immediately available
    window.location.href = '/';
  };

  const handleDiscord = async () => {
    if (!isSupabaseConfigured()) { alert('Supabase is not configured yet. Add your credentials to .env.local.'); return; }
    const sb = createClient();
    await sb.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  const pwStr = () => {
    const p = form.password; if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };
  const strength = pwStr();
  const strColors = ['','#E53E3E','#D69E2E','#D69E2E','#38A169'];
  const strLabels = ['','Weak','Fair','Good','Strong'];

  const iStyle = (name: string): React.CSSProperties => ({
    ...input,
    borderColor: errors[name] ? 'rgba(229,62,62,0.5)' : focused === name ? C.accentBorder : C.border,
    boxShadow: focused === name && !errors[name] ? `0 0 0 3px ${C.accentDim}` : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex' }}>
      {/* Left */}
      <div style={{ width: 400, flexShrink: 0, backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '48px 44px' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#6D28D9,#A855F7)', borderRadius: 2, marginBottom: 40 }} />
        <FCLogo size="lg" />
        <div style={{ marginTop: 44 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accentHi, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>JOIN TODAY</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            FUNDED COBRA<br /><span style={{ color: C.accentHi }}>SUPPORT</span>
          </h1>
          <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, maxWidth: 280 }}>Create your support account to manage tickets and communicate directly with our support team.</p>
        </div>
        <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['Instant ticket tracking','Real-time replies from staff','File attachment support','Discord identity integration'].map(item => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={14} color={C.accentHi} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: C.textSub }}>{item}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 40, fontSize: 11, color: C.textMuted }}>Funded Cobra Support Portal · v2.0</div>
      </div>

      {/* Right */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>Create account</h2>
          <p style={{ fontSize: 13, color: C.textSub, marginBottom: 28 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: C.accentHi, fontWeight: 500 }}>Sign in</Link>
          </p>

          {errors.form && (
            <div style={{ backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>{errors.form}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
            {/* Name */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>Full Name</label>
              <input placeholder="Your name" style={iStyle('name')} value={form.name}
                onChange={e => f('name', e.target.value)} onFocus={() => setFocused('name')} onBlur={() => setFocused('')} />
              {errors.name && <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>{errors.name}</div>}
            </div>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>Email Address</label>
              <input type="email" placeholder="you@example.com" style={iStyle('email')} value={form.email}
                onChange={e => f('email', e.target.value)} onFocus={() => setFocused('email')} onBlur={() => setFocused('')} />
              {errors.email && <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>{errors.email}</div>}
            </div>
            {/* Password */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Min. 8 characters"
                  style={{ ...iStyle('password'), paddingRight: 40 }} value={form.password}
                  onChange={e => f('password', e.target.value)} onFocus={() => setFocused('password')} onBlur={() => setFocused('')} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {form.password && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3,4].map(i => (
                      <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= strength ? strColors[strength] : C.border, transition: 'all 0.2s' }} />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: strColors[strength] }}>{strLabels[strength]}</div>
                </div>
              )}
              {errors.password && <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>{errors.password}</div>}
            </div>
            {/* Confirm */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>Confirm Password</label>
              <input type="password" placeholder="Repeat your password"
                style={iStyle('confirm')} value={form.confirm}
                onChange={e => f('confirm', e.target.value)} onFocus={() => setFocused('confirm')} onBlur={() => setFocused('')} />
              {errors.confirm && <div style={{ fontSize: 11, color: '#FCA5A5', marginTop: 4 }}>{errors.confirm}</div>}
            </div>

            <button type="submit" disabled={loading}
              style={{ ...btn.primary, width: '100%', padding: '11px', fontSize: 14, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
            <span style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>or continue with</span>
            <div style={{ flex: 1, height: 1, backgroundColor: C.border }} />
          </div>
          <button onClick={handleDiscord} style={{ ...btn.discord, width: '100%', padding: '11px' }}>
            <DiscordIcon /> Continue with Discord
          </button>
          <p style={{ fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 24, lineHeight: 1.6 }}>
            By creating an account you agree to our <Link href="/terms" style={{ color: C.textSub }}>Terms of Service</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
