'use client';
import { useState, useEffect } from 'react';
import { Search, Loader2, Users2, Shield } from 'lucide-react';
import { C, fmtDate, initials, pill } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import type { Profile } from '@/types/database';

const ROLE_META: Record<string, { label: string; color: string }> = {
  admin:               { label: 'Administrator',       color: '#A855F7' },
  support_agent:       { label: 'Support Agent',        color: '#93C5FD' },
  finance:             { label: 'Finance Team',         color: '#4ADE80' },
  partnership_manager: { label: 'Partnership Manager',  color: '#FB923C' },
};

export default function TeamPage() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');

  useEffect(() => {
    const sb = createClient();
    sb.from('profiles')
      .select('*')
      .in('role', ['admin','support_agent','finance','partnership_manager'])
      .order('created_at', { ascending: true })
      .then(({ data }) => { setMembers(data ?? []); setLoading(false); });
  }, []);

  const filtered = members.filter(m => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (m.full_name ?? '').toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>Team</h1>
        {!loading && <p style={{ fontSize: 13, color: C.textSub }}>{filtered.length} staff member{filtered.length !== 1 ? 's' : ''}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 12px', marginBottom: 16, maxWidth: 400 }}>
        <Search size={13} color={C.textMuted} />
        <input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13 }}
          placeholder="Search team members…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '64px', textAlign: 'center' }}>
          <Users2 size={36} color={C.textMuted} style={{ margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>No staff members yet</p>
          <p style={{ fontSize: 13, color: C.textMuted }}>Staff members will appear here once their role is set in the database.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 180px 130px', gap: 12, padding: '5px 12px', marginBottom: 4 }}>
            {['Member','Email','Role','Since'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(m => {
              const rm = ROLE_META[m.role] ?? { label: m.role, color: C.textSub };
              return (
                <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 180px 130px', gap: 12, alignItems: 'center', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: '12px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg,#6D28D9,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' }}>
                      {initials(m.full_name ?? m.email)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{m.full_name ?? '—'}</div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.email}</span>
                  <span style={pill(rm.color, `${rm.color}14`)}>
                    {m.role === 'admin' && <Shield size={10} />}
                    {rm.label}
                  </span>
                  <span style={{ fontSize: 12, color: C.textMuted }}>{fmtDate(m.created_at)}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
