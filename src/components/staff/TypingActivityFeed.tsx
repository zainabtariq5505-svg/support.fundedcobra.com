'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { MessageSquare, Zap } from 'lucide-react';
import { C, relativeTime } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';

interface TypingActivity {
  ticket_id: string;
  ticket_number: string;
  subject: string;
  customer_name: string;
  customer_id: string;
  typing_text: string;
  last_typed_at: string; // ISO string
}

export default function TypingActivityFeed() {
  const [activities, setActivities] = useState<TypingActivity[]>([]);
  const channelsRef = useRef<Map<string, any>>(new Map());
  const activitiesRef = useRef<Map<string, TypingActivity>>(new Map());

  useEffect(() => {
    const sb = createClient();

    // Step 1: fetch all open/active tickets so we can subscribe to their presence channels
    const subscribeToTickets = async () => {
      const { data: tickets } = await sb
        .from('tickets')
        .select('id, ticket_number, subject, customer_id, customer:profiles!customer_id(full_name, email)')
        .in('status', ['open', 'in_progress', 'waiting_for_staff', 'waiting_for_customer'])
        .order('updated_at', { ascending: false })
        .limit(50);

      if (!tickets) return;

      tickets.forEach((ticket: any) => {
        const key = `presence:ticket:${ticket.id}`;

        // Skip if already subscribed
        if (channelsRef.current.has(ticket.id)) return;

        const ch = sb.channel(key);

        ch.on('presence', { event: 'sync' }, () => {
          const state = ch.presenceState<any>();
          const allPresences = Object.values(state).flat() as any[];

          // Find typing presences from customers (not staff)
          const typing = allPresences.find(
            (p: any) => p.is_typing && p.typing_text && p.user_id === ticket.customer_id
          );

          if (typing) {
            const activity: TypingActivity = {
              ticket_id: ticket.id,
              ticket_number: ticket.ticket_number,
              subject: ticket.subject,
              customer_name: ticket.customer?.full_name || ticket.customer?.email || 'Customer',
              customer_id: ticket.customer_id,
              typing_text: typing.typing_text,
              last_typed_at: typing.last_seen || new Date().toISOString(),
            };
            activitiesRef.current.set(ticket.id, activity);
          } else {
            activitiesRef.current.delete(ticket.id);
          }

          setActivities(Array.from(activitiesRef.current.values()));
        })
        .on('presence', { event: 'join' }, () => {
          const state = ch.presenceState<any>();
          const allPresences = Object.values(state).flat() as any[];
          const typing = allPresences.find(
            (p: any) => p.is_typing && p.typing_text && p.user_id === ticket.customer_id
          );
          if (typing) {
            const activity: TypingActivity = {
              ticket_id: ticket.id,
              ticket_number: ticket.ticket_number,
              subject: ticket.subject,
              customer_name: ticket.customer?.full_name || ticket.customer?.email || 'Customer',
              customer_id: ticket.customer_id,
              typing_text: typing.typing_text,
              last_typed_at: typing.last_seen || new Date().toISOString(),
            };
            activitiesRef.current.set(ticket.id, activity);
            setActivities(Array.from(activitiesRef.current.values()));
          }
        })
        .on('presence', { event: 'leave' }, () => {
          activitiesRef.current.delete(ticket.id);
          setActivities(Array.from(activitiesRef.current.values()));
        })
        .subscribe();

        channelsRef.current.set(ticket.id, ch);
      });
    };

    subscribeToTickets();

    // Re-subscribe every 30s to pick up new tickets
    const refreshInterval = setInterval(subscribeToTickets, 30_000);

    // Stale cleanup — remove activities older than 5 seconds with no update
    const staleInterval = setInterval(() => {
      const now = Date.now();
      let changed = false;
      activitiesRef.current.forEach((activity, key) => {
        const age = now - new Date(activity.last_typed_at).getTime();
        if (age > 5000) {
          activitiesRef.current.delete(key);
          changed = true;
        }
      });
      if (changed) setActivities(Array.from(activitiesRef.current.values()));
    }, 2000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(staleInterval);
      channelsRef.current.forEach((ch) => sb.removeChannel(ch));
      channelsRef.current.clear();
    };
  }, []);

  if (activities.length === 0) return null;

  return (
    <div style={{
      backgroundColor: C.surface,
      border: `1px solid rgba(168, 85, 247, 0.4)`,
      borderRadius: 10,
      overflow: 'hidden',
      marginBottom: 24,
      boxShadow: '0 0 0 1px rgba(124,58,237,0.08), 0 4px 20px rgba(124,58,237,0.08)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 16px',
        background: 'linear-gradient(90deg, rgba(109,40,217,0.12) 0%, transparent 100%)',
        borderBottom: `1px solid rgba(168,85,247,0.15)`,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#a855f7',
          boxShadow: '0 0 6px #a855f7',
          animation: 'livePing 1.5s ease-in-out infinite',
        }} />
        <Zap size={13} color="#a855f7" />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#a855f7', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Live Typing Activity
        </span>
        <span style={{
          marginLeft: 'auto',
          fontSize: 11,
          fontWeight: 700,
          color: 'white',
          backgroundColor: '#7c3aed',
          borderRadius: 20,
          padding: '1px 8px',
        }}>
          {activities.length}
        </span>
      </div>

      {/* Activity list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {activities.map((act, i) => (
          <Link
            key={act.ticket_id}
            href={`/staff/tickets/${act.ticket_id}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              borderBottom: i < activities.length - 1 ? `1px solid ${C.border}` : 'none',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '12px 16px',
                backgroundColor: 'transparent',
                transition: 'background-color 0.15s',
                cursor: 'pointer',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(109,40,217,0.06)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
              }}
            >
              {/* Avatar with typing animation */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #6d28d9, #a855f7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'white',
                }}>
                  {act.customer_name.charAt(0).toUpperCase()}
                </div>
                {/* Typing ring */}
                <div style={{
                  position: 'absolute',
                  inset: -3,
                  borderRadius: '50%',
                  border: '2px solid #a855f7',
                  animation: 'typingRing 1.2s ease-in-out infinite',
                }} />
              </div>

              {/* Text content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                    {act.customer_name}
                  </span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#a855f7',
                    fontFamily: 'monospace',
                  }}>
                    {act.ticket_number}
                  </span>
                  <span style={{
                    fontSize: 10,
                    color: C.textMuted,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: 200,
                  }}>
                    · {act.subject}
                  </span>
                </div>

                {/* Live typing preview */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: 'rgba(109,40,217,0.08)',
                  border: '1px dashed rgba(168,85,247,0.3)',
                  borderRadius: 6,
                  padding: '5px 10px',
                  maxWidth: 480,
                }}>
                  <MessageSquare size={11} color="#a855f7" style={{ flexShrink: 0 }} />
                  <span style={{
                    fontSize: 12,
                    color: C.textSub,
                    fontStyle: 'italic',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {act.typing_text}
                  </span>
                  {/* Blinking cursor */}
                  <span style={{
                    display: 'inline-block',
                    width: 2,
                    height: 12,
                    backgroundColor: '#a855f7',
                    flexShrink: 0,
                    animation: 'blink 1s step-end infinite',
                  }} />
                </div>
              </div>

              {/* Respond CTA */}
              <div style={{
                flexShrink: 0,
                padding: '6px 14px',
                backgroundColor: '#7c3aed',
                color: 'white',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.03em',
                boxShadow: '0 2px 8px rgba(124,58,237,0.4)',
                transition: 'all 0.15s',
              }}>
                Respond →
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style>{`
        @keyframes livePing {
          0%, 100% { opacity: 1; box-shadow: 0 0 6px #a855f7; }
          50% { opacity: 0.6; box-shadow: 0 0 12px #a855f7, 0 0 20px rgba(168,85,247,0.4); }
        }
        @keyframes typingRing {
          0%, 100% { opacity: 0.8; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.15); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
