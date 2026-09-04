'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ShieldAlert, Lock } from 'lucide-react';
import FCLogo from '@/components/shared/FCLogo';
import { C, btn, input } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [focused, setFocused] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (!isSupabaseConfigured()) { setError('Supabase is not configured. Add your credentials to .env.local.'); return; }
    setLoading(true);
    const sb = createClient();
    const { error: authErr } = await sb.auth.signInWithPassword({ email, password });
    if (authErr) { setError(authErr.message); setLoading(false); return; }

    // Verify staff role
    const { data: { user } } = await sb.auth.getUser();
    if (user) {
      const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).single();
      const role = profile?.role ?? 'customer';
      if (!['support_agent','finance','partnership_manager','admin'].includes(role)) {
        await sb.auth.signOut();
        setError('Access denied. This portal is for authorized staff only.');
        setLoading(false);
        return;
      }
    }
    window.location.href = '/staff/dashboard';
  };

  const iStyle = (name: string): React.CSSProperties => ({
    ...input,
    borderColor: focused === name ? 'rgba(168,85,247,0.4)' : C.border,
    boxShadow: focused === name ? '0 0 0 3px rgba(139,92,246,0.1)' : 'none',
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', backgroundImage: 'radial-gradient(circle at 50% 0%,rgba(109,40,217,0.06) 0%,transparent 60%)' }} />
      <div style={{ width: '100%', maxWidth: 400, position: 'relative' }}>
        <div style={{ height: 2, background: 'linear-gradient(90deg,#4C1D95,#7C3AED,#A855F7)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 10px 10px', padding: '36px 36px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
            <FCLogo size="sm" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: 'rgba(109,40,217,0.1)', border: '1px solid rgba(109,40,217,0.25)', borderRadius: 5, padding: '4px 10px' }}>
              <Lock size={11} color="#C084FC" />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#C084FC', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Staff Access</span>
            </div>
          </div>

          <h1 style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 4, letterSpacing: '-0.01em' }}>
            FUNDED COBRA<br /><span style={{ color: C.accentHi }}>STAFF PORTAL</span>
          </h1>
          <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 28, lineHeight: 1.5 }}>Secure access for authorized Funded Cobra team members only.</p>

          {error && (
            <div style={{ backgroundColor: C.dangerDim, border: '1px solid rgba(229,62,62,0.25)', borderRadius: 6, padding: '9px 12px', marginBottom: 16, fontSize: 12, color: '#FCA5A5' }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Email</label>
              <input type="email" placeholder="staff@fundedcobra.com" value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused('email')} onBlur={() => setFocused('')}
                style={iStyle('email')} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setFocused('password')} onBlur={() => setFocused('')}
                  style={{ ...iStyle('password'), paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: C.textMuted, cursor: 'pointer', padding: 0 }}>
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ ...btn.primary, width: '100%', padding: '11px', fontSize: 14, opacity: loading ? 0.6 : 1, marginTop: 6, background: loading ? C.accentDeep : 'linear-gradient(135deg,#6D28D9,#8B5CF6)' }}>
              {loading ? 'Authenticating…' : 'Sign In to Staff Portal'}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '10px 12px', backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <ShieldAlert size={13} color={C.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5, margin: 0 }}>Authorized personnel only. Unauthorized access attempts are logged and monitored.</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Link href="/" style={{ fontSize: 11, color: C.textMuted, textDecoration: 'none' }}>← Back to support portal</Link>
        </div>
      </div>
    </div>
  );
}
