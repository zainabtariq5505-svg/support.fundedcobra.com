'use client';
import { useEffect, useState } from 'react';
import {
  CheckCircle2, Circle, Clock, Loader2, MessageSquare,
  Lock, UserCheck, Tag, AlertCircle, RefreshCw, XCircle,
  ArrowRight, User, ChevronDown, ChevronUp,
} from 'lucide-react';
import { C, fmtDate, relativeTime, initials, STATUS_META } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import type { TicketStatus } from '@/types/database';

interface TimelineEvent {
  id: string;
  type: 'status_change' | 'message' | 'note' | 'assignment' | 'created';
  created_at: string;
  // status change
  previous_status?: string;
  new_status?: string;
  // message
  message_text?: string;
  sender_name?: string;
  sender_role?: string;
  is_internal?: boolean;
  // assignment
  assignee_name?: string;
  // generic
  actor_name?: string;
  note?: string;
}

const STATUS_ICONS: Record<string, { icon: React.ReactNode; color: string }> = {
  open:                 { icon: <Circle size={13} />,        color: '#93C5FD' },
  in_progress:          { icon: <Clock size={13} />,         color: '#FCD34D' },
  waiting_for_customer: { icon: <AlertCircle size={13} />,   color: '#FB923C' },
  waiting_for_staff:    { icon: <Clock size={13} />,         color: '#C084FC' },
  resolved:             { icon: <CheckCircle2 size={13} />,  color: '#4ADE80' },
  closed:               { icon: <XCircle size={13} />,       color: '#6B7280' },
};

// Stages for the progress bar
const STAGES: { key: TicketStatus; label: string }[] = [
  { key: 'open',                  label: 'Open'        },
  { key: 'in_progress',           label: 'In Progress' },
  { key: 'waiting_for_customer',  label: 'Waiting'     },
  { key: 'resolved',              label: 'Resolved'    },
  { key: 'closed',                label: 'Closed'      },
];

interface Props {
  ticketId: string;
  currentStatus: TicketStatus;
  isStaff?: boolean;
}

export default function TicketTimeline({ ticketId, currentStatus, isStaff = false }: Props) {
  const [events, setEvents]           = useState<TimelineEvent[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showFull, setShowFull]       = useState(false);
  const [recentCount, setRecentCount] = useState(0);

  const currentIdx = STAGES.findIndex(s => s.key === currentStatus);
  const col = STATUS_META[currentStatus] ?? STATUS_META.open;

  useEffect(() => {
    const sb = createClient();
    let mounted = true;

    const load = async () => {
      const allEvents: TimelineEvent[] = [];

      // 1. Status history
      const { data: history } = await sb
        .from('ticket_status_history')
        .select('*, changer:profiles!changed_by(full_name,email,role)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      (history ?? []).forEach(h => {
        const changer = (h as any).changer;
        allEvents.push({
          id:              `sh-${h.id}`,
          type:            'status_change',
          created_at:      h.created_at,
          previous_status: h.previous_status ?? undefined,
          new_status:      h.new_status,
          actor_name:      changer?.full_name ?? changer?.email ?? (isStaff ? 'Staff' : undefined),
          note:            h.note ?? undefined,
        });
      });

      // 2. Messages (last 5 non-internal for customers, all for staff)
      const msgQuery = sb
        .from('ticket_messages')
        .select('*, sender:profiles!sender_id(full_name,email,role)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });

      if (!isStaff) msgQuery.eq('is_internal', false);

      const { data: messages } = await msgQuery;

      (messages ?? []).forEach(m => {
        const sender = (m as any).sender;
        allEvents.push({
          id:           `msg-${m.id}`,
          type:         m.is_internal ? 'note' : 'message',
          created_at:   m.created_at,
          message_text: m.message,
          sender_name:  sender?.full_name ?? sender?.email ?? 'User',
          sender_role:  sender?.role,
          is_internal:  m.is_internal,
        });
      });

      // Sort all events chronologically
      allEvents.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

      if (mounted) {
        setEvents(allEvents);
        setRecentCount(allEvents.length);
        setLoading(false);
      }
    };

    load();

    // Realtime: new status changes + messages
    const channel = sb.channel(`timeline-${ticketId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_status_history', filter: `ticket_id=eq.${ticketId}` },
        async (payload) => {
          const { data } = await sb.from('ticket_status_history')
            .select('*, changer:profiles!changed_by(full_name,email,role)')
            .eq('id', payload.new.id).single();
          if (data && mounted) {
            const changer = (data as any).changer;
            setEvents(prev => [...prev, {
              id:              `sh-${data.id}`,
              type:            'status_change',
              created_at:      data.created_at,
              previous_status: data.previous_status ?? undefined,
              new_status:      data.new_status,
              actor_name:      changer?.full_name ?? changer?.email,
            }]);
          }
        })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${ticketId}` },
        async (payload) => {
          if (!isStaff && payload.new.is_internal) return;
          const { data } = await sb.from('ticket_messages')
            .select('*, sender:profiles!sender_id(full_name,email,role)')
            .eq('id', payload.new.id).single();
          if (data && mounted) {
            const sender = (data as any).sender;
            setEvents(prev => [...prev, {
              id:           `msg-${data.id}`,
              type:         data.is_internal ? 'note' : 'message',
              created_at:   data.created_at,
              message_text: data.message,
              sender_name:  sender?.full_name ?? sender?.email ?? 'User',
              sender_role:  sender?.role,
              is_internal:  data.is_internal,
            }]);
          }
        })
      .subscribe();

    return () => { mounted = false; sb.removeChannel(channel); };
  }, [ticketId, isStaff]);

  const visibleEvents = showFull ? events : events.slice(-5);
  const hiddenCount   = events.length - visibleEvents.length;

  const renderEvent = (event: TimelineEvent, isLast: boolean) => {
    const getIcon = () => {
      switch (event.type) {
        case 'status_change': {
          const meta = STATUS_ICONS[event.new_status ?? ''] ?? { icon: <RefreshCw size={13} />, color: '#6B7280' };
          return { icon: meta.icon, color: meta.color };
        }
        case 'message':    return { icon: <MessageSquare size={13} />, color: '#A855F7' };
        case 'note':       return { icon: <Lock size={13} />,           color: '#FCD34D' };
        case 'assignment': return { icon: <UserCheck size={13} />,      color: '#FB923C' };
        default:           return { icon: <Circle size={13} />,         color: C.textMuted };
      }
    };

    const { icon, color } = getIcon();

    const renderContent = () => {
      switch (event.type) {
        case 'status_change': {
          const prevMeta = event.previous_status ? STATUS_META[event.previous_status] : null;
          const newMeta  = STATUS_META[event.new_status ?? ''] ?? STATUS_META.open;
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>Status changed</span>
                {prevMeta && (
                  <>
                    <span style={{ fontSize: 11, color: prevMeta.color, backgroundColor: prevMeta.bg, padding: '1px 7px', borderRadius: 4, fontWeight: 500 }}>
                      {prevMeta.label}
                    </span>
                    <ArrowRight size={10} color={C.textMuted} />
                  </>
                )}
                <span style={{ fontSize: 11, color: newMeta.color, backgroundColor: newMeta.bg, padding: '1px 7px', borderRadius: 4, fontWeight: 600 }}>
                  {newMeta.label}
                </span>
              </div>
              {isStaff && event.actor_name && (
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>
                  by {event.actor_name}
                </div>
              )}
              {event.note && (
                <div style={{ fontSize: 11, color: C.textSub, fontStyle: 'italic', marginTop: 4 }}>
                  "{event.note}"
                </div>
              )}
            </div>
          );
        }

        case 'message':
        case 'note': {
          const isNote = event.type === 'note';
          const isStaffMsg = event.sender_role !== 'customer';
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: isNote ? '#FCD34D' : C.text }}>
                  {event.sender_name}
                </span>
                <span style={{ fontSize: 10, color: isNote ? '#FCD34D' : isStaffMsg ? C.accentHi : C.textMuted, backgroundColor: isNote ? 'rgba(252,211,77,0.1)' : isStaffMsg ? C.accentDim : C.surface3, padding: '1px 6px', borderRadius: 3, fontWeight: 600 }}>
                  {isNote ? 'Internal Note' : isStaffMsg ? 'Support Team' : 'Customer'}
                </span>
              </div>
              {event.message_text && event.message_text !== '📎 Attachment' && (
                <div style={{
                  fontSize: 12, color: C.textSub, lineHeight: 1.5,
                  backgroundColor: isNote ? 'rgba(252,211,77,0.04)' : C.surface2,
                  border: `1px solid ${isNote ? 'rgba(252,211,77,0.15)' : C.border}`,
                  borderRadius: 6, padding: '8px 12px',
                  maxWidth: '100%',
                  borderLeft: `3px solid ${isNote ? '#FCD34D' : isStaffMsg ? C.accent : C.border}`,
                  fontStyle: isNote ? 'italic' : 'normal',
                }}>
                  {event.message_text.slice(0, 200)}
                  {event.message_text.length > 200 && <span style={{ color: C.textMuted }}>… (truncated)</span>}
                </div>
              )}
            </div>
          );
        }

        case 'assignment':
          return (
            <div style={{ fontSize: 12, color: C.text }}>
              Assigned to <strong>{event.assignee_name}</strong>
              {event.actor_name && <span style={{ color: C.textMuted }}> by {event.actor_name}</span>}
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div key={event.id} style={{ display: 'flex', gap: 14, position: 'relative' }}>
        {/* Vertical line */}
        {!isLast && (
          <div style={{
            position: 'absolute', left: 15, top: 28, bottom: -8,
            width: 1, backgroundColor: C.border,
          }} />
        )}

        {/* Icon node */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
          backgroundColor: `${color}18`,
          border: `1.5px solid ${color}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, zIndex: 1,
        }}>
          {icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, paddingBottom: isLast ? 0 : 16, paddingTop: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>{renderContent()}</div>
            <span style={{ fontSize: 10, color: C.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>
              {relativeTime(event.created_at)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Progress tracker */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '16px 18px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>
          Ticket Status
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
          <div style={{ position: 'absolute', top: 11, left: 11, right: 11, height: 2, backgroundColor: C.border, zIndex: 0 }} />
          <div style={{
            position: 'absolute', top: 11, left: 11, height: 2, zIndex: 0,
            backgroundColor: col.dot,
            width: `${Math.max(0, (currentIdx / Math.max(STAGES.length - 1, 1))) * (100 - 20)}%`,
            transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
          }} />

          {STAGES.map((stage, idx) => {
            const done    = idx < currentIdx || currentStatus === 'resolved' || currentStatus === 'closed';
            const current = stage.key === currentStatus;
            const stageMeta = STATUS_META[stage.key] ?? STATUS_META.open;
            return (
              <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  backgroundColor: done ? stageMeta.dot : current ? C.surface : C.surface2,
                  border: `2px solid ${done || current ? stageMeta.dot : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: current ? `0 0 0 4px ${stageMeta.dot}22` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {done && <CheckCircle2 size={12} color="white" />}
                  {current && !done && <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: stageMeta.dot }} />}
                </div>
                <div style={{
                  marginTop: 6, fontSize: 9, fontWeight: current ? 700 : 400,
                  color: done || current ? C.text : C.textMuted,
                  textAlign: 'center', lineHeight: 1.2, maxWidth: 56,
                }}>
                  {stage.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Current status pill */}
        <div style={{
          marginTop: 16, padding: '9px 14px',
          backgroundColor: `${col.dot}12`,
          border: `1px solid ${col.dot}30`,
          borderRadius: 7,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: col.dot, flexShrink: 0, boxShadow: `0 0 6px ${col.dot}` }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: col.dot }}>
            {col.label}
          </span>
          <span style={{ fontSize: 12, color: C.textSub }}>
            — {[
              { key: 'open',                 desc: 'Ticket received, pending review'          },
              { key: 'in_progress',          desc: 'Our team is actively working on this'    },
              { key: 'waiting_for_customer', desc: 'We need a reply from you to continue'    },
              { key: 'waiting_for_staff',    desc: 'Assigned staff is reviewing the details'  },
              { key: 'resolved',             desc: 'Your issue has been resolved'              },
              { key: 'closed',               desc: 'Ticket has been closed'                    },
            ].find(s => s.key === currentStatus)?.desc}
          </span>
        </div>
      </div>

      {/* Full timeline */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Timeline {loading ? '' : `(${events.length} events)`}
          </span>
          {events.length > 5 && (
            <button
              onClick={() => setShowFull(p => !p)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.accentHi, display: 'flex', alignItems: 'center', gap: 4 }}
            >
              {showFull ? <><ChevronUp size={12} /> Show less</> : <><ChevronDown size={12} /> Show all {events.length}</>}
            </button>
          )}
        </div>

        <div style={{ padding: '16px' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <Loader2 size={16} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 13, padding: '16px 0' }}>
              No activity yet
            </div>
          ) : (
            <>
              {/* Show older events collapsed */}
              {!showFull && hiddenCount > 0 && (
                <button
                  onClick={() => setShowFull(true)}
                  style={{
                    width: '100%', marginBottom: 12,
                    padding: '8px', fontSize: 12, color: C.accentHi,
                    backgroundColor: C.accentDim, border: `1px dashed ${C.accentBorder}`,
                    borderRadius: 6, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <ChevronUp size={13} /> Show {hiddenCount} older event{hiddenCount > 1 ? 's' : ''}
                </button>
              )}

              {visibleEvents.map((event, idx) =>
                renderEvent(event, idx === visibleEvents.length - 1)
              )}
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
