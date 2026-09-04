'use client';
import { useState, useEffect } from 'react';
import { User, Mail, Shield, Calendar, Ticket, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { C, STATUS_META, pill, fmtDate, initials } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Ticket as TicketType } from '@/types/database';

export default function ProfilePage() {
  const profile = useProfile();
  const [tickets, setTickets]   = useState<TicketType[]>([]);
  const [editing, setEditing]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [name, setName]         = useState('');
  const [error, setError]       = useState('');

  useEffect(() => {
    if (!profile) return;
    setName(profile.full_name ?? '');
    const sb = createClient();
    sb.from('tickets').select('*').eq('customer_id', profile.id).order('created_at', { ascending: false })
      .then(({ data }) => setTickets(data ?? []));
  }, [profile?.id]);

  const save = async () => {
    if (!profile) return;
    setSaving(true); setError('');
    const sb = createClient();
    const { error: err } = await sb.from('profiles').update({ full_name: name }).eq('id', profile.id);
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true); setEditing(false);
    setTimeout(() => setSaved(false), 2500);
  };

  const totalTickets    = tickets.length;
  const openTickets     = tickets.filter(t => !['resolved','closed'].includes(t.status)).length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

  if (!profile) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  const IS: React.CSSProperties = { width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.text, fontSize: 14, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 28 }}>My Profile</h1>

        {saved && (
          <div style={{ backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} /> Profile updated.
          </div>
        )}
        {error && (
          <div style={{ backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', borderRadius: 7, padding: '10px 14px', marginBottom: 20, fontSize: 13, color: '#FCA5A5' }}>{error}</div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, alignItems: 'start' }}>
          {/* Left */}
          <div>
            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#6D28D9,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: '#fff' }}>
                  {initials(profile.full_name ?? profile.email)}
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 3 }}>{profile.full_name ?? 'No name set'}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{profile.email}</div>
                  <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 4, padding: '2px 8px' }}>
                    <Shield size={10} color={C.accentHi} />
                    <span style={{ fontSize: 10, fontWeight: 600, color: C.accentHi, textTransform: 'capitalize' }}>{profile.role}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}><User size={11} /> Full Name</label>
                  <input value={name} disabled={!editing} onChange={e => setName(e.target.value)} style={{ ...IS, opacity: editing ? 1 : 0.7 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}><Mail size={11} /> Email</label>
                  <input value={profile.email ?? ''} disabled style={{ ...IS, opacity: 0.5 }} />
                  <p style={{ fontSize: 10, color: C.textMuted, marginTop: 4 }}>Email cannot be changed here.</p>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 5, display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={11} /> Member Since</label>
                  <input value={fmtDate(profile.created_at)} disabled style={{ ...IS, opacity: 0.5 }} />
                </div>

                <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                  {!editing ? (
                    <button onClick={() => setEditing(true)} style={{ backgroundColor: C.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit Profile</button>
                  ) : (
                    <>
                      <button onClick={save} disabled={saving} style={{ backgroundColor: C.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '8px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Save Changes'}
                      </button>
                      <button onClick={() => { setEditing(false); setName(profile.full_name ?? ''); }} style={{ backgroundColor: C.surface3, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 6, padding: '8px 14px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Discord */}
            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#5865F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="12" viewBox="0 0 24 18" fill="white"><path d="M20.317 1.492a19.825 19.825 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.566 18.566 0 0 0-5.487 0 12.36 12.36 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 1.492a.07.07 0 0 0-.032.027C.533 6.093-.32 10.555.099 14.961a.08.08 0 0 0 .031.055 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Discord</div>
                  {profile.discord_username
                    ? <div style={{ fontSize: 11, color: '#4ADE80' }}>Connected · {profile.discord_username}</div>
                    : <div style={{ fontSize: 11, color: C.textMuted }}>Not connected</div>}
                </div>
              </div>
              {!profile.discord_username && (
                <button style={{ backgroundColor: '#5865F2', color: '#fff', border: 'none', borderRadius: 5, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Connect</button>
              )}
            </div>
          </div>

          {/* Right */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>Support Activity</h3>
              {[
                { label: 'Total Tickets',   value: totalTickets,    icon: <Ticket size={16} />,       color: '#A855F7' },
                { label: 'Open',            value: openTickets,     icon: <Clock size={16} />,        color: '#FCD34D' },
                { label: 'Resolved',        value: resolvedTickets, icon: <CheckCircle2 size={16} />, color: '#4ADE80' },
              ].map(({ label, value, icon, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color }}>{icon}</span><span style={{ fontSize: 12, color: C.textSub }}>{label}</span></div>
                  <span style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{value}</span>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.border}` }}>
                <h3 style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Recent Tickets</h3>
              </div>
              {tickets.length === 0 ? (
                <div style={{ padding: '24px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>No tickets yet</div>
              ) : tickets.slice(0, 4).map((t, i) => {
                const st = STATUS_META[t.status] ?? STATUS_META.open;
                return (
                  <div key={t.id} style={{ padding: '10px 14px', borderBottom: i < Math.min(tickets.length, 4) - 1 ? `1px solid ${C.border}` : 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.accentHi, fontWeight: 700 }}>{t.ticket_number}</span>
                      <span style={pill(st.color, st.bg)}>{st.label}</span>
                    </div>
                    <p style={{ fontSize: 11, color: C.textSub, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
