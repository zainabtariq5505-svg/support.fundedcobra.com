'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldCheck, Ticket, MessageSquare } from 'lucide-react';
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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [focused, setFocused]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (!isSupabaseConfigured()) { setError('Supabase is not configured yet. Add your credentials to .env.local to enable login.'); return; }
    setLoading(true);
    const sb = createClient();
    const { error: authErr } = await sb.auth.signInWithPassword({ email, password });

    if (authErr) {
      if (authErr.message.toLowerCase().includes('email not confirmed')) {
        setError('Your email needs to be confirmed. Please check your inbox for a confirmation email, click the link, then try signing in again. You can also delete your account and sign up again if you did not receive it.');
      } else {
        setError(authErr.message);
      }
      setLoading(false);
      return;
    }

    // Fetch role to redirect correctly
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role ?? 'customer';
      const dest = ['support_agent','finance','partnership_manager','admin'].includes(role)
        ? '/staff/dashboard'
        : '/';
      // Use window.location for a hard redirect so the session cookie is picked up by the proxy
      window.location.href = dest;
    } else {
      router.push('/');
    }
  };

  const handleDiscord = async () => {
    if (!isSupabaseConfigured()) { alert('Supabase is not configured yet. Add your credentials to .env.local.'); return; }
    const sb = createClient();
    await sb.auth.signInWithOAuth({
      provider: 'discord',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  const iStyle = (name: string): React.CSSProperties => ({
    ...input,
    borderColor: focused === name ? C.accentBorder : C.border,
    boxShadow: focused === name ? `0 0 0 3px ${C.accentDim}` : 'none',
  });

  const trust = [
    { icon: ShieldCheck,    text: 'Secure & encrypted portal' },
    { icon: Ticket,         text: 'Track all your support requests' },
    { icon: MessageSquare,  text: 'Direct team communication' },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex' }}>
      {/* Left panel */}
      <div style={{ width: 440, flexShrink: 0, backgroundColor: C.surface, borderRight: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', padding: '48px' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#6D28D9,#A855F7)', borderRadius: 2, marginBottom: 40 }} />
        <div style={{ marginBottom: 48 }}><FCLogo size="lg" /></div>
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: C.accentHi, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>WELCOME TO</div>
          <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: 16 }}>
            FUNDED COBRA<br /><span style={{ color: C.accentHi }}>SUPPORT</span>
          </h1>
          <p style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7, maxWidth: 300 }}>Sign in to manage your support requests, track your tickets, and stay connected with our team.</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {trust.map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: 7, backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={14} color={C.accentHi} />
              </div>
              <span style={{ fontSize: 13, color: C.textSub }}>{text}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 'auto', paddingTop: 40, fontSize: 11, color: C.textMuted }}>Funded Cobra Support Portal · v2.0</div>
      </div>

      {/* Right panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 40px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>Sign in</h2>
          <p style={{ fontSize: 13, color: C.textSub, marginBottom: 28 }}>
            Don't have an account?{' '}
            <Link href="/signup" style={{ color: C.accentHi, fontWeight: 500 }}>Create one</Link>
          </p>

          {error && (
            <div style={{ backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', borderRadius: 7, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#FCA5A5' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>Email Address</label>
              <input type="email" autoComplete="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                style={iStyle('email')} />
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub }}>Password</label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: C.accentHi }}>Forgot password?</Link>
              </div>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password"
                  value={password} onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  style={{ ...iStyle('password'), paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ ...btn.primary, width: '100%', padding: '11px', fontSize: 14, opacity: loading ? 0.6 : 1, marginTop: 4 }}>
              {loading ? 'Signing in…' : 'Sign In'}
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
            By signing in you agree to our{' '}
            <Link href="/terms" style={{ color: C.textSub }}>Terms</Link> and{' '}
            <Link href="/privacy" style={{ color: C.textSub }}>Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
