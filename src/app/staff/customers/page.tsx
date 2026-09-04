'use client';
import { useState, useEffect } from 'react';
import { Search, Loader2, Users } from 'lucide-react';
import { C, fmtDate, initials } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import type { Profile } from '@/types/database';

interface CustomerRow extends Profile { total: number; open: number; resolved: number; }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');

  useEffect(() => {
    const sb = createClient();
    const load = async () => {
      const { data: profiles } = await sb
        .from('profiles')
        .select('*')
        .eq('role', 'customer')
        .order('created_at', { ascending: false });

      if (!profiles) { setLoading(false); return; }

      // Get ticket counts per customer
      const rows: CustomerRow[] = await Promise.all(profiles.map(async (p) => {
        const { data: tickets } = await sb.from('tickets').select('status').eq('customer_id', p.id);
        const t = tickets ?? [];
        return {
          ...p,
          total:    t.length,
          open:     t.filter(x => !['resolved','closed'].includes(x.status)).length,
          resolved: t.filter(x => x.status === 'resolved').length,
        };
      }));

      setCustomers(rows);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = customers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (c.full_name ?? '').toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q);
  });

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>Customers</h1>
        {!loading && <p style={{ fontSize: 13, color: C.textSub }}>{filtered.length} customer{filtered.length !== 1 ? 's' : ''}</p>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 12px', marginBottom: 16, maxWidth: 400 }}>
        <Search size={13} color={C.textMuted} />
        <input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13 }}
          placeholder="Search customers…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '48px', textAlign: 'center' }}>
          <Users size={32} color={C.textMuted} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>No customers yet</p>
          <p style={{ fontSize: 13, color: C.textMuted }}>Customers will appear here once they sign up and create tickets.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 72px 60px 80px 120px', gap: 10, padding: '5px 12px', marginBottom: 4 }}>
            {['Customer','Email','Tickets','Open','Resolved','Since'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(c => (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '1fr 200px 72px 60px 80px 120px', gap: 10, alignItems: 'center', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: '12px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg,${C.surface3},${C.border})`, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: C.textSub }}>
                    {initials(c.full_name ?? c.email)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.full_name ?? '—'}</span>
                </div>
                <span style={{ fontSize: 12, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{c.total}</span>
                <span style={{ fontSize: 13, color: c.open > 0 ? '#FCD34D' : C.textMuted }}>{c.open}</span>
                <span style={{ fontSize: 13, color: C.textSub }}>{c.resolved}</span>
                <span style={{ fontSize: 12, color: C.textMuted }}>{fmtDate(c.created_at)}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
