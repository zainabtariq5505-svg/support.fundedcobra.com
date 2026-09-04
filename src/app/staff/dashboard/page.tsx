'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock, TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { C, STATUS_META, PRIORITY_META, pill, relativeTime } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import TypingActivityFeed from '@/components/staff/TypingActivityFeed';
import type { Ticket } from '@/types/database';

export default function StaffDashboard() {
  const profile = useProfile();
  const [tickets, setTickets]   = useState<Ticket[]>([]);
  const [counts, setCounts]     = useState({ open: 0, waiting: 0, urgent: 0, resolvedToday: 0 });
  const [loading, setLoading]   = useState(true);
  const [greeting, setGreeting] = useState('Good day');

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening');
  }, []);

  useEffect(() => {
    const sb = createClient();
    const load = async () => {
      const [{ data: all }, { data: attention }] = await Promise.all([
        sb.from('tickets').select('id,status,priority,created_at,resolved_at').order('created_at', { ascending: false }),
        sb.from('tickets')
          .select('*, customer:profiles!customer_id(full_name,email), assignee:profiles!assigned_to(full_name)')
          .in('status', ['open','in_progress','waiting_for_staff'])
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      const today = new Date(); today.setHours(0,0,0,0);
      setCounts({
        open:        (all ?? []).filter(t => t.status === 'open').length,
        waiting:     (all ?? []).filter(t => t.status === 'waiting_for_staff').length,
        urgent:      (all ?? []).filter(t => t.priority === 'urgent' && !['resolved','closed'].includes(t.status)).length,
        // Fix: use resolved_at (not created_at) for "resolved today"
        resolvedToday: (all ?? []).filter(t => t.status === 'resolved' && t.resolved_at && new Date(t.resolved_at) >= today).length,
      });
      setTickets(attention ?? []);
      setLoading(false);
    };
    load();
  }, []);

  const stats = [
    { label: 'Open Tickets',      value: counts.open,          color: '#93C5FD' },
    { label: 'Waiting for Staff', value: counts.waiting,        color: '#FCD34D' },
    { label: 'High / Urgent',     value: counts.urgent,         color: '#F87171' },
    { label: 'Resolved Today',    value: counts.resolvedToday,  color: '#4ADE80' },
  ];

  const name = profile?.full_name?.split(' ')[0] ?? profile?.email ?? '…';

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 3 }}>
          {greeting}, {name}
        </h1>
        <p style={{ fontSize: 13, color: C.textSub }}>Here is what requires attention today.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <>
          {/* Typing activity feed — shows customers typing right now */}
          <TypingActivityFeed />

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 28 }}>
            {stats.map(({ label, value, color }) => (
              <div key={label} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
                <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: C.text, marginBottom: 4 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Tickets needing attention */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h2 style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Requires Attention</h2>
              <Link href="/staff/tickets" style={{ fontSize: 12, color: C.accentHi, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                All tickets <ArrowRight size={12} />
              </Link>
            </div>

            {tickets.length === 0 ? (
              <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '32px', textAlign: 'center', color: C.textMuted, fontSize: 13 }}>
                No tickets requiring attention right now.
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 130px 120px 88px 80px 72px', gap: 10, padding: '5px 12px', marginBottom: 3 }}>
                  {['Ticket','Subject','Customer','Status','Priority','Assigned','Updated'].map(h => (
                    <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {tickets.map(t => {
                    const st = STATUS_META[t.status] ?? STATUS_META.open;
                    const pr = PRIORITY_META[t.priority] ?? PRIORITY_META.normal;
                    const customer = (t as any).customer;
                    const assignee = (t as any).assignee;
                    return (
                      <Link key={t.id} href={`/staff/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 130px 120px 88px 80px 72px', gap: 10, alignItems: 'center', backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '10px 12px', cursor: 'pointer' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.accentHi, fontWeight: 700 }}>{t.ticket_number}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 12, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                            <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{t.category}</div>
                          </div>
                          <span style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{customer?.full_name ?? customer?.email ?? '—'}</span>
                          <span style={pill(st.color, st.bg)}><span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />{st.label}</span>
                          <span style={pill(pr.color, pr.bg)}>{pr.label}</span>
                          <span style={{ fontSize: 11, color: assignee ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{assignee?.full_name ?? 'Unassigned'}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={10} color={C.textMuted} /><span style={{ fontSize: 10, color: C.textMuted }}>{relativeTime(t.updated_at)}</span></div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
