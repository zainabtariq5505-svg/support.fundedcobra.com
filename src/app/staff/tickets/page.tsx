'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Search, Clock, Loader2, Ticket, MessageSquare } from 'lucide-react';
import { C, STATUS_META, PRIORITY_META, pill, relativeTime } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import type { Ticket as TicketType } from '@/types/database';

// Track which tickets have a customer actively typing right now
function useTypingTickets(ticketIds: string[], customerIds: Record<string, string>) {
  const [typingMap, setTypingMap] = useState<Record<string, string>>({}); // ticketId -> typing text
  const channelsRef = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    if (ticketIds.length === 0) return;
    const sb = createClient();

    ticketIds.forEach(ticketId => {
      if (channelsRef.current.has(ticketId)) return;

      const ch = sb.channel(`presence:ticket:${ticketId}`);
      const customerId = customerIds[ticketId];

      ch.on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState<any>();
        const presences = Object.values(state).flat() as any[];
        const typing = presences.find(
          (p: any) => p.is_typing && p.typing_text && p.user_id === customerId
        );
        setTypingMap(prev => {
          if (typing) return { ...prev, [ticketId]: typing.typing_text };
          const next = { ...prev };
          delete next[ticketId];
          return next;
        });
      })
      .on('presence', { event: 'join' }, () => {
        const state = ch.presenceState<any>();
        const presences = Object.values(state).flat() as any[];
        const typing = presences.find(
          (p: any) => p.is_typing && p.typing_text && p.user_id === customerId
        );
        if (typing) {
          setTypingMap(prev => ({ ...prev, [ticketId]: typing.typing_text }));
        }
      })
      .on('presence', { event: 'leave' }, () => {
        setTypingMap(prev => {
          const next = { ...prev };
          delete next[ticketId];
          return next;
        });
      })
      .subscribe();

      channelsRef.current.set(ticketId, ch);
    });

    return () => {
      channelsRef.current.forEach(ch => sb.removeChannel(ch));
      channelsRef.current.clear();
    };
  }, [ticketIds.join(',')]);

  return typingMap;
}

export default function StaffTicketsPage() {
  const [tickets, setTickets]     = useState<TicketType[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusF, setStatusF]     = useState('all');
  const [priorityF, setPriorityF] = useState('all');
  const [categoryF, setCategoryF] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    const sb = createClient();
    let q = sb.from('tickets')
      .select('*, customer:profiles!customer_id(full_name,email), assignee:profiles!assigned_to(full_name)')
      .order('updated_at', { ascending: false });

    if (statusF   !== 'all') q = q.eq('status',   statusF);
    if (priorityF !== 'all') q = q.eq('priority', priorityF);
    if (categoryF !== 'all') q = q.eq('category', categoryF);

    const { data } = await q;
    setTickets(data ?? []);
    setLoading(false);
  }, [statusF, priorityF, categoryF]);

  useEffect(() => { load(); }, [load]);

  const filtered = tickets.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    const c = (t as any).customer;
    return t.ticket_number.toLowerCase().includes(q) ||
           t.subject.toLowerCase().includes(q) ||
           (c?.full_name ?? c?.email ?? '').toLowerCase().includes(q);
  });

  // Build maps for presence hook — only active tickets
  const activeTicketIds = filtered
    .filter(t => !['resolved', 'closed'].includes(t.status))
    .map(t => t.id);

  const customerIdMap: Record<string, string> = {};
  filtered.forEach(t => { customerIdMap[t.id] = t.customer_id; });

  const typingMap = useTypingTickets(activeTicketIds, customerIdMap);
  const typingCount = Object.keys(typingMap).length;

  const sel: React.CSSProperties = {
    backgroundColor: C.surface3,
    border: `1px solid ${C.border}`,
    borderRadius: 6,
    padding: '7px 10px',
    color: C.text,
    fontSize: 12,
    cursor: 'pointer',
    outline: 'none',
  };

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>All Tickets</h1>
          {/* Live typing count badge */}
          {typingCount > 0 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(168,85,247,0.35)',
              borderRadius: 20,
              padding: '3px 10px',
              animation: 'fadeInBadge 0.3s ease-out',
            }}>
              <div style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                backgroundColor: '#a855f7',
                boxShadow: '0 0 6px #a855f7',
                animation: 'pulseDot 1.2s ease-in-out infinite',
              }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7' }}>
                {typingCount} typing now
              </span>
            </div>
          )}
        </div>
        {!loading && (
          <p style={{ fontSize: 13, color: C.textSub }}>
            {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 12px' }}>
          <Search size={13} color={C.textMuted} />
          <input
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13 }}
            placeholder="Search tickets…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select style={sel} value={statusF} onChange={e => setStatusF(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_for_customer">Waiting for Customer</option>
          <option value="waiting_for_staff">Waiting for Staff</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select style={sel} value={priorityF} onChange={e => setPriorityF(e.target.value)}>
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <select style={sel} value={categoryF} onChange={e => setCategoryF(e.target.value)}>
          <option value="all">All Categories</option>
          <option value="Payout Support">Payout Support</option>
          <option value="Trading Account">Trading Account</option>
          <option value="Billing &amp; Payments">Billing &amp; Payments</option>
          <option value="Account Access">Account Access</option>
          <option value="Partnerships">Partnerships</option>
          <option value="General Support">General Support</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '48px', textAlign: 'center' }}>
          <Ticket size={32} color={C.textMuted} style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>No tickets found</p>
          <p style={{ fontSize: 13, color: C.textMuted }}>Try adjusting your search or filters.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '88px 1fr 130px 130px 88px 88px 80px', gap: 10, padding: '5px 12px', marginBottom: 3 }}>
            {['Ticket', 'Subject', 'Customer', 'Status', 'Priority', 'Assigned', 'Updated'].map(h => (
              <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>{h}</span>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {filtered.map(t => {
              const st = STATUS_META[t.status] ?? STATUS_META.open;
              const pr = PRIORITY_META[t.priority] ?? PRIORITY_META.normal;
              const customer = (t as any).customer;
              const assignee = (t as any).assignee;
              const isTyping = !!typingMap[t.id];
              const typingText = typingMap[t.id];

              return (
                <Link key={t.id} href={`/staff/tickets/${t.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '88px 1fr 130px 130px 88px 88px 80px',
                      gap: 10,
                      alignItems: 'center',
                      backgroundColor: isTyping ? 'rgba(109,40,217,0.05)' : C.surface,
                      border: isTyping
                        ? '1px solid rgba(168,85,247,0.4)'
                        : `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: isTyping ? '0 0 0 1px rgba(124,58,237,0.1), 0 2px 12px rgba(124,58,237,0.08)' : 'none',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = isTyping ? 'rgba(168,85,247,0.6)' : C.accentBorder;
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = isTyping ? 'rgba(109,40,217,0.08)' : C.surface2;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = isTyping ? 'rgba(168,85,247,0.4)' : C.border;
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = isTyping ? 'rgba(109,40,217,0.05)' : C.surface;
                    }}
                  >
                    {/* Animated left border for typing tickets */}
                    {isTyping && (
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: 'linear-gradient(180deg, #7c3aed, #a855f7, #7c3aed)',
                        backgroundSize: '100% 200%',
                        animation: 'borderFlow 1.5s linear infinite',
                      }} />
                    )}

                    {/* Ticket number */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.accentHi, fontWeight: 700 }}>
                        {t.ticket_number}
                      </span>
                    </div>

                    {/* Subject — shows live typing preview inline */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.subject}
                      </div>
                      {isTyping ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                          {/* Pulsing dots */}
                          <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                            {[0, 1, 2].map(i => (
                              <div key={i} style={{
                                width: 4,
                                height: 4,
                                borderRadius: '50%',
                                backgroundColor: '#a855f7',
                                animation: `typingDot 1.2s ease-in-out infinite`,
                                animationDelay: `${i * 0.2}s`,
                              }} />
                            ))}
                          </div>
                          <span style={{
                            fontSize: 10,
                            color: '#a855f7',
                            fontStyle: 'italic',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: 200,
                          }}>
                            "{typingText}"
                          </span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>{t.category}</div>
                      )}
                    </div>

                    {/* Customer */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 12, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customer?.full_name ?? customer?.email ?? '—'}
                      </span>
                      {/* Typing badge on customer name */}
                      {isTyping && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#a855f7',
                          flexShrink: 0,
                          boxShadow: '0 0 6px #a855f7',
                          animation: 'pulseDot 1.2s ease-in-out infinite',
                        }} />
                      )}
                    </div>

                    <span style={pill(st.color, st.bg)}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />
                      {st.label}
                    </span>
                    <span style={pill(pr.color, pr.bg)}>{pr.label}</span>
                    <span style={{ fontSize: 11, color: assignee ? C.text : C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {assignee?.full_name ?? 'Unassigned'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      {isTyping ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          backgroundColor: 'rgba(124,58,237,0.12)',
                          border: '1px solid rgba(168,85,247,0.3)',
                          borderRadius: 4,
                          padding: '2px 6px',
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#a855f7',
                          whiteSpace: 'nowrap',
                        }}>
                          <MessageSquare size={9} />
                          Live
                        </div>
                      ) : (
                        <>
                          <Clock size={10} color={C.textMuted} />
                          <span style={{ fontSize: 10, color: C.textMuted }}>{relativeTime(t.updated_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 6px #a855f7; }
          50%       { opacity: 0.6; transform: scale(1.3); box-shadow: 0 0 12px #a855f7; }
        }
        @keyframes typingDot {
          0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
          30%            { opacity: 1;   transform: translateY(-3px); }
        }
        @keyframes borderFlow {
          0%   { background-position: 0% 0%; }
          100% { background-position: 0% 200%; }
        }
        @keyframes fadeInBadge {
          from { opacity: 0; transform: scale(0.9); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
