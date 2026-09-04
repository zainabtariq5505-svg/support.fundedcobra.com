'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Ticket, Users, BarChart2, BookOpen, Users2, Settings, LogOut, Shield } from 'lucide-react';
import { C, initials } from '@/lib/ds';
import FCLogo from '@/components/shared/FCLogo';
import NotificationPanel from '@/components/staff/NotificationPanel';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import { useStaffNotifications } from '@/lib/supabase/useStaffNotifications';

const links = [
  { href: '/staff/dashboard',      icon: LayoutDashboard, label: 'Overview'      },
  { href: '/staff/tickets',        icon: Ticket,          label: 'Tickets'       },
  { href: '/staff/customers',      icon: Users,           label: 'Customers'     },
  { href: '/staff/analytics',      icon: BarChart2,       label: 'Analytics'     },
  { href: '/staff/saved-replies',  icon: BookOpen,        label: 'Saved Replies' },
  { href: '/staff/team',           icon: Users2,          label: 'Team'          },
  { href: '/staff/settings',       icon: Settings,        label: 'Settings'      },
];

export default function StaffSidebar() {
  const pathname  = usePathname();
  const router    = useRouter();
  const profile   = useProfile();
  const [notifOpen, setNotifOpen] = useState(false);

  const { notifications, unreadCount, markAllRead, markRead } =
    useStaffNotifications(profile?.id ?? null);

  const handleLogout = async () => {
    const sb = createClient();
    await sb.auth.signOut();
    router.push('/staff/login');
    router.refresh();
  };

  const name = profile?.full_name ?? profile?.email ?? '…';
  const roleLabel: Record<string, string> = {
    admin:                'Administrator',
    support_agent:        'Support Agent',
    finance:              'Finance Team',
    partnership_manager:  'Partnerships',
  };

  return (
    <aside style={{
      width: 210,
      flexShrink: 0,
      backgroundColor: C.surface,
      borderRight: `1px solid ${C.border}`,
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Logo + badge */}
      <div style={{ padding: '16px 16px 14px', borderBottom: `1px solid ${C.border}` }}>
        <FCLogo size="sm" />
        <div style={{
          marginTop: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            backgroundColor: 'rgba(139,92,246,0.08)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 4,
            padding: '3px 8px',
          }}>
            <Shield size={9} color={C.accentHi} />
            <span style={{ fontSize: 9, fontWeight: 700, color: C.accentHi, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Staff Portal
            </span>
          </div>

          {/* Notification bell */}
          <NotificationPanel
            notifications={notifications}
            unreadCount={unreadCount}
            isOpen={notifOpen}
            onOpen={() => setNotifOpen(true)}
            onClose={() => setNotifOpen(false)}
            onMarkAllRead={markAllRead}
            onMarkRead={markRead}
          />
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== '/staff/dashboard' && pathname.startsWith(href));
          // Show unread badge on Tickets nav item
          const isTickets = href === '/staff/tickets';

          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '8px 10px',
                borderRadius: 5,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                color: active ? C.text : C.textSub,
                backgroundColor: active ? C.accentDim : 'transparent',
                borderLeft: active ? `2px solid ${C.accent}` : '2px solid transparent',
                paddingLeft: active ? 8 : 10,
                position: 'relative',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.surface2;
                  (e.currentTarget as HTMLAnchorElement).style.color = C.text;
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'transparent';
                  (e.currentTarget as HTMLAnchorElement).style.color = C.textSub;
                }
              }}
            >
              <Icon size={14} style={{ flexShrink: 0, opacity: active ? 1 : 0.6 }} />
              <span style={{ flex: 1 }}>{label}</span>
              {/* Unread count on Tickets link */}
              {isTickets && unreadCount > 0 && (
                <span style={{
                  minWidth: 17,
                  height: 17,
                  borderRadius: 9,
                  backgroundColor: '#ef4444',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  animation: 'badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  boxShadow: '0 0 6px rgba(239,68,68,0.5)',
                }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Staff user footer */}
      <div style={{ padding: '10px 8px', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 2 }}>
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'linear-gradient(135deg,#6D28D9,#A855F7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
            flexShrink: 0,
          }}>
            {initials(name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted }}>
              {roleLabel[profile?.role ?? ''] ?? profile?.role ?? '…'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 5,
            fontSize: 12,
            color: C.textMuted,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            width: '100%',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            (e.currentTarget).style.color = '#ef4444';
            (e.currentTarget).style.backgroundColor = 'rgba(239,68,68,0.06)';
          }}
          onMouseLeave={e => {
            (e.currentTarget).style.color = C.textMuted;
            (e.currentTarget).style.backgroundColor = 'transparent';
          }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>

      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </aside>
  );
}
