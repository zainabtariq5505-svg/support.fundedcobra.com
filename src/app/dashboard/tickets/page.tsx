'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, ArrowRight, Clock, Ticket } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { C, STATUS_META, PRIORITY_META, pill, relativeTime } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Ticket as TicketType } from '@/types/database';

export default function MyTicketsPage() {
  const profile = useProfile();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const sb = createClient();
    sb.from('tickets')
      .select('*')
      .eq('customer_id', profile.id)
      .order('updated_at', { ascending: false })
      .then(({ data }) => { setTickets(data ?? []); setLoading(false); });
  }, [profile?.id]);

  const Skeleton = () => (
    <div style={{ height: 58, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, animation: 'pulse 1.5s ease-in-out infinite' }} />
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 2 }}>My Tickets</h1>
            {!loading && <p style={{ fontSize: 13, color: C.textSub }}>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''}</p>}
          </div>
          <Link href="/dashboard/new-ticket" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: C.accent, color: '#fff', padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
            <Plus size={14} /> New Ticket
          </Link>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[1,2,3,4].map(i => <Skeleton key={i} />)}
          </div>
        ) : tickets.length === 0 ? (
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '64px 24px', textAlign: 'center' }}>
            <Ticket size={36} color={C.textMuted} style={{ margin: '0 auto 14px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No support requests yet</p>
            <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 24 }}>Create a ticket whenever you need assistance from our team.</p>
            <Link href="/dashboard/new-ticket" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: C.accent, color: '#fff', padding: '9px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
              <Plus size={14} /> Open a Ticket
            </Link>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 140px 88px 100px 16px', gap: 12, padding: '5px 12px', marginBottom: 4 }}>
              {['ID', 'Subject', 'Status', 'Priority', 'Updated', ''].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {tickets.map(t => {
                const st = STATUS_META[t.status] ?? STATUS_META.open;
                const pr = PRIORITY_META[t.priority] ?? PRIORITY_META.normal;
                return (
                  <Link key={t.id} href={`/dashboard/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 140px 88px 100px 16px', gap: 12, alignItems: 'center', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, padding: '11px 12px', cursor: 'pointer' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.accentHi, fontWeight: 700 }}>{t.ticket_number}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{t.category}</div>
                      </div>
                      <span style={pill(st.color, st.bg)}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />
                        {st.label}
                      </span>
                      <span style={pill(pr.color, pr.bg)}>{pr.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={10} color={C.textMuted} />
                        <span style={{ fontSize: 11, color: C.textMuted }}>{relativeTime(t.updated_at)}</span>
                      </div>
                      <ArrowRight size={13} color={C.border2} />
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  );
}
