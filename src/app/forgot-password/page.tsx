'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail } from 'lucide-react';
import FCLogo from '@/components/shared/FCLogo';
import { C, btn, input } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [sent, setSent]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Please enter your email address.'); return; }
    setError('');
    setLoading(true);
    const sb = createClient();
    const { error: err } = await sb.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center' }}><FCLogo size="md" /></div>

        {!sent ? (
          <>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, textAlign: 'center', marginBottom: 8 }}>Reset your password</h1>
            <p style={{ fontSize: 13, color: C.textSub, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
              Enter your email address and we'll send you a reset link.
            </p>
            {error && (
              <div style={{ backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>{error}</div>
            )}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>Email Address</label>
                <input type="email" placeholder="you@example.com" value={email}
                  onChange={e => setEmail(e.target.value)} required style={input} />
              </div>
              <button type="submit" disabled={loading}
                style={{ ...btn.primary, width: '100%', padding: '11px', fontSize: 14, opacity: loading ? 0.6 : 1 }}>
                {loading ? 'Sending…' : 'Send Reset Link'}
              </button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Mail size={22} color={C.accentHi} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 8 }}>Check your email</h1>
            <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, marginBottom: 28 }}>
              We sent a reset link to <strong style={{ color: C.text }}>{email}</strong>.
            </p>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.textSub }}>
            <ArrowLeft size={13} /> Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
