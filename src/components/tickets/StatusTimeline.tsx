'use client';
import { useEffect, useState } from 'react';
import { CheckCircle2, Circle, Clock, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { C, fmtDate, initials, relativeTime } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import type { TicketStatus, TicketStatusHistory } from '@/types/database';

// ── Canonical stage order ──────────────────────────────────────────
const STAGES: { key: TicketStatus; label: string; desc: string }[] = [
  { key: 'open',                 label: 'Open',                  desc: 'Ticket received, pending review'         },
  { key: 'in_progress',         label: 'Under Review',           desc: 'Our team is actively working on this'   },
  { key: 'waiting_for_customer',label: 'Waiting for You',        desc: 'We need a reply from you to continue'   },
  { key: 'waiting_for_staff',   label: 'Waiting for Staff',      desc: 'Assigned staff is reviewing the details' },
  { key: 'resolved',            label: 'Resolved',               desc: 'Your issue has been resolved'            },
  { key: 'closed',              label: 'Closed',                 desc: 'Ticket has been closed'                  },
];

const STAGE_COLOR: Record<TicketStatus, { dot: string; ring: string; label: string }> = {
  open:                  { dot: '#93C5FD', ring: 'rgba(147,197,253,0.2)', label: '#93C5FD' },
  in_progress:           { dot: '#FCD34D', ring: 'rgba(252,211,77,0.2)',  label: '#FCD34D' },
  waiting_for_customer:  { dot: '#FB923C', ring: 'rgba(251,146,60,0.2)',  label: '#FB923C' },
  waiting_for_staff:     { dot: '#C084FC', ring: 'rgba(192,132,252,0.2)', label: '#C084FC' },
  resolved:              { dot: '#4ADE80', ring: 'rgba(74,222,128,0.2)',  label: '#4ADE80' },
  closed:                { dot: '#6B7280', ring: 'rgba(107,114,128,0.2)', label: '#6B7280' },
};

interface Props {
  ticketId: string;
  currentStatus: TicketStatus;
  /** Pass true inside staff views to show changer names */
  isStaff?: boolean;
}

export default function StatusTimeline({ ticketId, currentStatus, isStaff = false }: Props) {
  const [history, setHistory]       = useState<(TicketStatusHistory & { changer?: any })[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const currentIdx = STAGES.findIndex(s => s.key === currentStatus);

  // ── Load history + realtime ────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    const sb = createClient();
    let mounted = true;

    const load = async () => {
      const { data } = await sb
        .from('ticket_status_history')
        .select('*, changer:profiles!changed_by(full_name, email, role)')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: false });
      if (mounted) { setHistory(data ?? []); setLoading(false); }
    };
    load();

    const ch = sb.channel(`status-history-${ticketId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public',
        table: 'ticket_status_history',
        filter: `ticket_id=eq.${ticketId}`,
      }, async payload => {
        const { data } = await sb
          .from('ticket_status_history')
          .select('*, changer:profiles!changed_by(full_name, email, role)')
          .eq('id', payload.new.id)
          .single();
        if (data && mounted) setHistory(p => [data, ...p]);
      })
      .subscribe();

    return () => { mounted = false; sb.removeChannel(ch); };
  }, [ticketId]);

  // ── Progress bar helper ────────────────────────────────────────────
  const isCompleted = (idx: number) =>
    currentStatus === 'closed' || currentStatus === 'resolved'
      ? idx <= 4 // everything up to resolved
      : idx < currentIdx;
  const isCurrent  = (idx: number) => idx === currentIdx;
  const isPending  = (idx: number) => !isCompleted(idx) && !isCurrent(idx);

  // Skip the "waiting_for_staff" stage in the visual track for customers
  const visibleStages = isStaff
    ? STAGES
    : STAGES.filter(s => s.key !== 'waiting_for_staff');

  const col = STAGE_COLOR[currentStatus] ?? STAGE_COLOR.open;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── Visual stage tracker ───────────────────────────────────── */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
          Ticket Status
        </div>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
          {/* Connector line */}
          <div style={{
            position: 'absolute', top: 12, left: 12, right: 12, height: 2,
            backgroundColor: C.border, zIndex: 0,
          }} />
          {/* Filled portion */}
          <div style={{
            position: 'absolute', top: 12, left: 12, height: 2, zIndex: 0,
            backgroundColor: col.dot,
            width: `${Math.max(0, (currentIdx / Math.max(visibleStages.length - 1, 1))) * (100 - (24 / (visibleStages.length)))}%`,
            transition: 'width 0.5s ease',
          }} />

          {visibleStages.map((stage, idx) => {
            const done    = isCompleted(idx);
            const current = isCurrent(idx);
            const pending = isPending(idx);
            const c2      = STAGE_COLOR[stage.key];

            return (
              <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1 }}>
                {/* Dot */}
                <div style={{
                  width: 24, height: 24, borderRadius: '50%',
                  backgroundColor: done ? c2.dot : current ? C.surface : C.surface2,
                  border: `2px solid ${done || current ? c2.dot : C.border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: current ? `0 0 0 4px ${c2.ring}` : 'none',
                  transition: 'all 0.3s',
                }}>
                  {done && <CheckCircle2 size={13} color={C.bg} />}
                  {current && <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: c2.dot }} />}
                </div>

                {/* Label */}
                <div style={{
                  marginTop: 8, fontSize: 10, fontWeight: current ? 700 : 400,
                  color: done || current ? C.text : C.textMuted,
                  textAlign: 'center', lineHeight: 1.3,
                  maxWidth: 72,
                }}>{stage.label}</div>
              </div>
            );
          })}
        </div>

        {/* Current status description */}
        <div style={{
          marginTop: 18, padding: '10px 14px',
          backgroundColor: `${col.ring}`,
          border: `1px solid ${col.dot}22`,
          borderRadius: 7,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: col.dot, flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 12, fontWeight: 700, color: col.label }}>
              {STAGES.find(s => s.key === currentStatus)?.label ?? currentStatus}
            </span>
            <span style={{ fontSize: 12, color: C.textSub, marginLeft: 8 }}>
              — {STAGES.find(s => s.key === currentStatus)?.desc}
            </span>
          </div>
        </div>
      </div>

      {/* ── History log ───────────────────────────────────────────── */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
        <button
          onClick={() => setShowHistory(p => !p)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Status History {loading ? '' : `(${history.length})`}
          </span>
          {showHistory
            ? <ChevronUp size={14} color={C.textMuted} />
            : <ChevronDown size={14} color={C.textMuted} />}
        </button>

        {showHistory && (
          <div style={{ borderTop: `1px solid ${C.border}` }}>
            {loading ? (
              <div style={{ padding: '20px', display: 'flex', justifyContent: 'center' }}>
                <Loader2 size={16} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: C.textMuted, fontSize: 12 }}>
                No status changes recorded yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {history.map((entry, i) => {
                  const prev = entry.previous_status ? STAGE_COLOR[entry.previous_status] : null;
                  const next = STAGE_COLOR[entry.new_status as TicketStatus] ?? STAGE_COLOR.open;
                  const changer = (entry as any).changer;
                  const isLast = i === history.length - 1;

                  return (
                    <div key={entry.id} style={{
                      display: 'flex', alignItems: 'flex-start', gap: 12,
                      padding: '11px 16px',
                      borderBottom: isLast ? 'none' : `1px solid ${C.border}`,
                    }}>
                      {/* Left: who changed it */}
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: 'linear-gradient(135deg,#6D28D9,#A855F7)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: '#fff',
                      }}>
                        {changer ? initials(changer.full_name ?? changer.email) : '?'}
                      </div>

                      {/* Right: transition */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                          {entry.previous_status && prev ? (
                            <>
                              <span style={{ fontSize: 11, fontWeight: 500, color: prev.label,
                                backgroundColor: `${prev.dot}18`, padding: '1px 7px', borderRadius: 3 }}>
                                {STAGES.find(s => s.key === entry.previous_status)?.label ?? entry.previous_status}
                              </span>
                              <span style={{ fontSize: 10, color: C.textMuted }}>→</span>
                            </>
                          ) : (
                            <span style={{ fontSize: 11, color: C.textMuted }}>Ticket opened as</span>
                          )}
                          <span style={{ fontSize: 11, fontWeight: 600, color: next.label,
                            backgroundColor: `${next.dot}18`, padding: '1px 7px', borderRadius: 3 }}>
                            {STAGES.find(s => s.key === entry.new_status)?.label ?? entry.new_status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {isStaff && changer && (
                            <span style={{ fontSize: 10, color: C.textSub }}>
                              by {changer.full_name ?? changer.email}
                            </span>
                          )}
                          {isStaff && changer && <span style={{ fontSize: 10, color: C.border2 }}>·</span>}
                          <span style={{ fontSize: 10, color: C.textMuted }}>{relativeTime(entry.created_at)}</span>
                          <span style={{ fontSize: 10, color: C.border2 }}>·</span>
                          <span style={{ fontSize: 10, color: C.textMuted }}>{fmtDate(entry.created_at)}</span>
                        </div>

                        {entry.note && (
                          <div style={{ marginTop: 4, fontSize: 11, color: C.textSub, fontStyle: 'italic' }}>
                            "{entry.note}"
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
