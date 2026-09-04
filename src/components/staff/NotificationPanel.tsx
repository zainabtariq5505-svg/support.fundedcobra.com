'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Bell, X, CheckCheck, MessageSquare, ExternalLink } from 'lucide-react';
import { C, relativeTime } from '@/lib/ds';
import type { StaffNotification } from '@/lib/supabase/useStaffNotifications';

interface NotificationPanelProps {
  notifications: StaffNotification[];
  unreadCount: number;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}

export default function NotificationPanel({
  notifications,
  unreadCount,
  isOpen,
  onOpen,
  onClose,
  onMarkAllRead,
  onMarkRead,
}: NotificationPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose]);

  return (
    <div ref={panelRef} style={{ position: 'relative' }}>
      {/* Bell button */}
      <button
        onClick={() => isOpen ? onClose() : onOpen()}
        style={{
          position: 'relative',
          width: 34,
          height: 34,
          borderRadius: 7,
          border: isOpen ? `1px solid ${C.accentBorder}` : `1px solid ${C.border}`,
          backgroundColor: isOpen ? C.accentDim : 'transparent',
          color: isOpen ? C.accentHi : C.textSub,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          if (!isOpen) {
            (e.currentTarget).style.backgroundColor = C.surface2;
            (e.currentTarget).style.borderColor = C.accentBorder;
            (e.currentTarget).style.color = C.accentHi;
          }
        }}
        onMouseLeave={e => {
          if (!isOpen) {
            (e.currentTarget).style.backgroundColor = 'transparent';
            (e.currentTarget).style.borderColor = C.border;
            (e.currentTarget).style.color = C.textSub;
          }
        }}
        title="Notifications"
      >
        <Bell size={15} />
        {/* Unread badge */}
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute',
            top: -5,
            right: -5,
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
            border: `2px solid ${C.surface}`,
            animation: 'badgePop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            boxShadow: '0 0 6px rgba(239,68,68,0.6)',
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </div>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          left: 'calc(100% + 8px)',
          top: 0,
          width: 360,
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(124,58,237,0.08)',
          zIndex: 9999,
          overflow: 'hidden',
          animation: 'slideInPanel 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: `1px solid ${C.border}`,
            background: 'linear-gradient(90deg, rgba(109,40,217,0.08) 0%, transparent 100%)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={14} color={C.accentHi} />
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                Notifications
              </span>
              {unreadCount > 0 && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: 'white',
                  backgroundColor: '#ef4444',
                  borderRadius: 8,
                  padding: '1px 6px',
                }}>
                  {unreadCount} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {unreadCount > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{
                    fontSize: 11,
                    color: C.accentHi,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 6px',
                    borderRadius: 4,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.accentDim)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: C.textMuted,
                  padding: '3px',
                  borderRadius: 4,
                  display: 'flex',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.surface2)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Notification list */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{
                padding: '40px 20px',
                textAlign: 'center',
              }}>
                <Bell size={28} color={C.textMuted} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
                <div style={{ fontSize: 13, color: C.textMuted }}>No notifications yet</div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>
                  New customer messages will appear here
                </div>
              </div>
            ) : (
              notifications.map((notif, i) => (
                <Link
                  key={notif.id}
                  href={`/staff/tickets/${notif.ticket_id}`}
                  onClick={() => { onMarkRead(notif.id); onClose(); }}
                  style={{
                    display: 'block',
                    textDecoration: 'none',
                    color: 'inherit',
                    borderBottom: i < notifications.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 16px',
                      backgroundColor: notif.is_read ? 'transparent' : 'rgba(109,40,217,0.04)',
                      borderLeft: notif.is_read ? '3px solid transparent' : '3px solid #7c3aed',
                      transition: 'background 0.15s',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(109,40,217,0.07)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.backgroundColor = notif.is_read ? 'transparent' : 'rgba(109,40,217,0.04)';
                    }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #6d28d9, #a855f7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'white',
                      flexShrink: 0,
                    }}>
                      {notif.customer_name.charAt(0).toUpperCase()}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                          {notif.customer_name}
                        </span>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: '#a855f7',
                          fontFamily: 'monospace',
                        }}>
                          {notif.ticket_number}
                        </span>
                        {!notif.is_read && (
                          <div style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            backgroundColor: '#7c3aed',
                            flexShrink: 0,
                            marginLeft: 'auto',
                            boxShadow: '0 0 4px #7c3aed',
                          }} />
                        )}
                      </div>

                      {/* Message preview */}
                      <div style={{
                        fontSize: 11,
                        color: C.textSub,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: 4,
                        fontStyle: notif.message_preview.startsWith('📎') ? 'normal' : 'italic',
                      }}>
                        {notif.message_preview}
                      </div>

                      {/* Ticket subject + time */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: 10,
                          color: C.textMuted,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: 180,
                        }}>
                          {notif.subject}
                        </span>
                        <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>
                          {relativeTime(notif.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '10px 16px',
              borderTop: `1px solid ${C.border}`,
              textAlign: 'center',
            }}>
              <Link
                href="/staff/tickets"
                onClick={onClose}
                style={{
                  fontSize: 12,
                  color: C.accentHi,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 5,
                  transition: 'opacity 0.15s',
                }}
              >
                <ExternalLink size={12} />
                View all tickets
              </Link>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes badgePop {
          0%   { transform: scale(0); }
          70%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes slideInPanel {
          from { opacity: 0; transform: translateX(-8px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
