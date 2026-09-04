'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Trash2, MessageSquare, Clock, AlertCircle, CheckCircle2, Ticket, Loader2 } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { C, relativeTime } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Notification } from '@/types/database';

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
  new_ticket:    { icon: <Ticket size={15} />,        color: '#93C5FD', bg: 'rgba(147,197,253,0.1)'  },
  ticket_reply:  { icon: <MessageSquare size={15} />, color: '#A855F7', bg: 'rgba(168,85,247,0.1)'   },
  status_change: { icon: <Clock size={15} />,         color: '#FCD34D', bg: 'rgba(252,211,77,0.1)'   },
  assigned:      { icon: <AlertCircle size={15} />,   color: '#FB923C', bg: 'rgba(251,146,60,0.1)'   },
  resolved:      { icon: <CheckCircle2 size={15} />,  color: '#4ADE80', bg: 'rgba(74,222,128,0.1)'   },
  closed:        { icon: <CheckCircle2 size={15} />,  color: '#6B7280', bg: 'rgba(107,114,128,0.1)'  },
};

export default function NotificationsPage() {
  const profile = useProfile();
  const [notifs, setNotifs]   = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    const sb = createClient();
    sb.from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setNotifs(data ?? []); setLoading(false); });
  }, [profile?.id]);

  const unread = notifs.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    if (!profile) return;
    const sb = createClient();
    await sb.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false);
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    const sb = createClient();
    await sb.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const remove = async (id: string) => {
    const sb = createClient();
    await sb.from('notifications').delete().eq('id', id);
    setNotifs(p => p.filter(n => n.id !== id));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '36px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 3 }}>Notifications</h1>
            <p style={{ fontSize: 13, color: C.textSub }}>{loading ? '…' : unread > 0 ? `${unread} unread` : 'All caught up'}</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 13px', color: C.textSub, fontSize: 12, cursor: 'pointer' }}>
              <CheckCheck size={13} /> Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : notifs.length === 0 ? (
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '64px 24px', textAlign: 'center' }}>
            <Bell size={36} color={C.textMuted} style={{ margin: '0 auto 14px', display: 'block' }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No notifications</p>
            <p style={{ fontSize: 13, color: C.textMuted }}>You'll see ticket updates and replies here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {notifs.map(n => {
              const tc = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.ticket_reply;
              return (
                <div key={n.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, backgroundColor: n.is_read ? C.surface : 'rgba(139,92,246,0.04)', border: `1px solid ${n.is_read ? C.border : 'rgba(139,92,246,0.15)'}`, borderRadius: 8, padding: '14px 16px', position: 'relative' }}>
                  {!n.is_read && <span style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', backgroundColor: C.accentHi }} />}
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, backgroundColor: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {tc.icon}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, color: C.text }}>{n.title}</span>
                      <span style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', flexShrink: 0 }}>{relativeTime(n.created_at)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: C.textSub, lineHeight: 1.5, marginBottom: 10 }}>{n.message}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {n.ticket_id && (
                        <Link href={`/dashboard/tickets/${n.ticket_id}`} onClick={() => markRead(n.id)} style={{ fontSize: 12, color: C.accentHi, fontWeight: 500, textDecoration: 'none' }}>
                          View ticket →
                        </Link>
                      )}
                      {!n.is_read && (
                        <button onClick={() => markRead(n.id)} style={{ fontSize: 11, color: C.textMuted, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          Mark as read
                        </button>
                      )}
                    </div>
                  </div>
                  <button onClick={() => remove(n.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: '2px', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
