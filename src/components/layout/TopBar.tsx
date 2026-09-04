'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell, ChevronDown, Ticket, Plus, Home,
  CheckCheck, X, User, Settings, LogOut,
  MessageSquare, AlertCircle, Clock, CheckCircle2,
} from 'lucide-react';
import { C, relativeTime, initials } from '@/lib/ds';
import FCLogo from '@/components/shared/FCLogo';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Notification } from '@/types/database';

function useOutsideClick(ref: React.RefObject<HTMLElement | null>, cb: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) cb(); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [ref, cb]);
}

function NotifIcon({ type }: { type: string }) {
  const cfg: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
    new_ticket:    { icon: <Ticket size={13} />,        bg: 'rgba(147,197,253,0.1)', color: '#93C5FD' },
    ticket_reply:  { icon: <MessageSquare size={13} />, bg: 'rgba(139,92,246,0.12)', color: '#A855F7' },
    status_change: { icon: <Clock size={13} />,         bg: 'rgba(252,211,77,0.1)',  color: '#FCD34D' },
    assigned:      { icon: <AlertCircle size={13} />,   bg: 'rgba(251,146,60,0.1)',  color: '#FB923C' },
    resolved:      { icon: <CheckCheck size={13} />,    bg: 'rgba(74,222,128,0.1)',  color: '#4ADE80' },
    closed:        { icon: <CheckCircle2 size={13} />,  bg: 'rgba(107,114,128,0.1)', color: '#6B7280' },
  };
  const c = cfg[type] ?? cfg.ticket_reply;
  return (
    <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, backgroundColor: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {c.icon}
    </div>
  );
}

export default function TopBar() {
  const pathname   = usePathname();
  const router     = useRouter();
  const profile    = useProfile();

  const [notifs, setNotifs]         = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useOutsideClick(notifRef,   () => setShowNotifs(false));
  useOutsideClick(profileRef, () => setShowProfile(false));

  // Load + subscribe to notifications
  useEffect(() => {
    if (!profile) return;
    const sb = createClient();

    const load = async () => {
      const { data } = await sb
        .from('notifications')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setNotifs(data ?? []);
    };
    load();

    const ch = sb
      .channel('notif-topbar')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => setNotifs(p => [payload.new as Notification, ...p])
      )
      .subscribe();

    return () => { sb.removeChannel(ch); };
  }, [profile?.id]);

  const unread = notifs.filter(n => !n.is_read).length;

  const markAllRead = async () => {
    const sb = createClient();
    await sb.from('notifications').update({ is_read: true }).eq('user_id', profile!.id).eq('is_read', false);
    setNotifs(p => p.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: string) => {
    const sb = createClient();
    await sb.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifs(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const dismiss = async (id: string, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const sb = createClient();
    await sb.from('notifications').delete().eq('id', id);
    setNotifs(p => p.filter(n => n.id !== id));
  };

  const handleLogout = async () => {
    setShowProfile(false);
    const sb = createClient();
    await sb.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const navLinks = [
    { href: '/',                     label: 'Support Home', icon: Home   },
    { href: '/dashboard/tickets',    label: 'My Tickets',   icon: Ticket },
    { href: '/dashboard/new-ticket', label: 'Open Ticket',  icon: Plus   },
  ];

  const name = profile?.full_name ?? profile?.email ?? '';

  return (
    <header style={{ height: 52, backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', paddingInline: 20, position: 'sticky', top: 0, zIndex: 200, flexShrink: 0 }}>
      {/* Logo */}
      <Link href="/" style={{ textDecoration: 'none', marginRight: 24, flexShrink: 0 }}>
        <FCLogo size="sm" />
      </Link>
      <div style={{ width: 1, height: 20, backgroundColor: C.border, marginRight: 20, flexShrink: 0 }} />

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
        {navLinks.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 11px', borderRadius: 5, fontSize: 13, fontWeight: active ? 500 : 400, color: active ? C.text : C.textSub, backgroundColor: active ? C.surface3 : 'transparent', textDecoration: 'none' }}>
              <Icon size={13} style={{ opacity: active ? 1 : 0.7 }} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {profile ? (
          <>
            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowNotifs(p => !p); setShowProfile(false); }}
                style={{ background: showNotifs ? C.surface3 : 'none', border: showNotifs ? `1px solid ${C.border}` : '1px solid transparent', padding: '6px 7px', borderRadius: 6, color: showNotifs ? C.text : C.textSub, display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                <Bell size={15} />
                {unread > 0 && (
                  <span style={{ position: 'absolute', top: 4, right: 4, minWidth: 14, height: 14, borderRadius: 7, backgroundColor: C.accentHi, border: `1.5px solid ${C.surface}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 2px' }}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>

              {showNotifs && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 360, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 300 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>Notifications</span>
                      {unread > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: C.accentHi, backgroundColor: C.accentDim, padding: '1px 6px', borderRadius: 10 }}>{unread} new</span>}
                    </div>
                    {unread > 0 && (
                      <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: C.accentHi, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCheck size={12} /> Mark all read
                      </button>
                    )}
                  </div>

                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifs.length === 0 ? (
                      <div style={{ padding: '32px 16px', textAlign: 'center' }}>
                        <Bell size={28} color={C.textMuted} style={{ margin: '0 auto 10px', display: 'block' }} />
                        <p style={{ fontSize: 13, color: C.textMuted }}>You're all caught up</p>
                      </div>
                    ) : notifs.map(n => (
                      <Link key={n.id} href={n.ticket_id ? `/dashboard/tickets/${n.ticket_id}` : '/dashboard/notifications'}
                        onClick={() => { markRead(n.id); setShowNotifs(false); }}
                        style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', textDecoration: 'none', borderBottom: `1px solid ${C.border}`, backgroundColor: n.is_read ? 'transparent' : 'rgba(139,92,246,0.04)', position: 'relative' }}>
                        {!n.is_read && <span style={{ position: 'absolute', left: 5, top: '50%', transform: 'translateY(-50%)', width: 5, height: 5, borderRadius: '50%', backgroundColor: C.accentHi }} />}
                        <NotifIcon type={n.type} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: n.is_read ? 400 : 600, color: C.text, marginBottom: 2, lineHeight: 1.3 }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: C.textSub, lineHeight: 1.4, marginBottom: 3 }}>{n.message}</div>
                          <div style={{ fontSize: 10, color: C.textMuted }}>{relativeTime(n.created_at)}</div>
                        </div>
                        <button onClick={(e) => dismiss(n.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: '2px', borderRadius: 3, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                          <X size={12} />
                        </button>
                      </Link>
                    ))}
                  </div>

                  <div style={{ padding: '10px 14px', borderTop: `1px solid ${C.border}` }}>
                    <Link href="/dashboard/notifications" onClick={() => setShowNotifs(false)} style={{ fontSize: 12, color: C.accentHi, display: 'block', textAlign: 'center', textDecoration: 'none' }}>
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile button */}
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button onClick={() => { setShowProfile(p => !p); setShowNotifs(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 9px', borderRadius: 6, cursor: 'pointer', border: `1px solid ${showProfile ? C.border2 : C.border}`, backgroundColor: showProfile ? C.surface3 : C.surface2 }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6D28D9,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initials(name)}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{name.split(' ')[0] || name}</span>
                <ChevronDown size={11} color={C.textMuted} style={{ transition: 'transform 0.15s', transform: showProfile ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>

              {showProfile && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 220, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden', zIndex: 300 }}>
                  <div style={{ padding: '14px', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6D28D9,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                        {initials(name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.email}</div>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 4, backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 4, padding: '2px 8px' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, color: C.accentHi, textTransform: 'capitalize' }}>{profile.role}</span>
                    </div>
                  </div>

                  <div style={{ padding: '6px' }}>
                    {[
                      { icon: User,     label: 'My Profile',       href: '/dashboard/profile' },
                      { icon: Ticket,   label: 'My Tickets',        href: '/dashboard/tickets' },
                      { icon: Bell,     label: 'Notifications',     href: '/dashboard/notifications' },
                      { icon: Settings, label: 'Account Settings',  href: '/dashboard/settings' },
                    ].map(({ icon: Icon, label, href }) => (
                      <Link key={label} href={href} onClick={() => setShowProfile(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 6, fontSize: 13, color: C.textSub, textDecoration: 'none' }}>
                        <Icon size={14} style={{ flexShrink: 0 }} />
                        {label}
                      </Link>
                    ))}
                  </div>

                  <div style={{ borderTop: `1px solid ${C.border}`, padding: '6px' }}>
                    <button onClick={handleLogout}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '8px 10px', borderRadius: 6, fontSize: 13, color: '#F87171', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <LogOut size={14} style={{ flexShrink: 0 }} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : profile === null ? (
          <>
            <Link href="/login"  style={{ fontSize: 13, color: C.textSub, padding: '6px 12px', borderRadius: 5, textDecoration: 'none' }}>Sign in</Link>
            <Link href="/signup" style={{ fontSize: 13, fontWeight: 600, color: '#fff', backgroundColor: C.accent, padding: '6px 14px', borderRadius: 5, textDecoration: 'none' }}>Create Account</Link>
          </>
        ) : (
          /* loading skeleton */
          <div style={{ width: 120, height: 32, backgroundColor: C.surface3, borderRadius: 6 }} />
        )}
      </div>
    </header>
  );
}
