import { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from './browser';
import { playMessageSound, showDesktopNotification } from '@/lib/notifications';

export interface StaffNotification {
  id: string;
  ticket_id: string;
  ticket_number: string;
  subject: string;
  customer_name: string;
  message_preview: string;
  message_id: string;
  created_at: string;
  is_read: boolean;
}

export function useStaffNotifications(staffId: string | null) {
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenMessageIds = useRef<Set<string>>(new Set());
  const lastPollRef = useRef<string>(new Date().toISOString());

  const poll = useCallback(async () => {
    if (!staffId) return;
    const sb = createClient();

    const { data: newMessages } = await sb
      .from('ticket_messages')
      .select('id, message, created_at, sender_id, is_internal, ticket_id')
      .eq('is_internal', false)
      .neq('sender_id', staffId)
      .gt('created_at', lastPollRef.current)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!newMessages || newMessages.length === 0) return;

    const fresh: StaffNotification[] = [];

    for (const msg of newMessages) {
      if (seenMessageIds.current.has(msg.id)) continue;
      seenMessageIds.current.add(msg.id);

      // Fetch ticket + sender details separately to avoid join type issues
      const [{ data: ticket }, { data: sender }] = await Promise.all([
        sb.from('tickets').select('id, ticket_number, subject').eq('id', msg.ticket_id).single(),
        sb.from('profiles').select('full_name, email').eq('id', msg.sender_id).single(),
      ]);

      if (!ticket) continue;

      fresh.push({
        id: `msg-${msg.id}`,
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        customer_name: (sender as any)?.full_name || (sender as any)?.email || 'Customer',
        message_preview: (msg as any).message?.slice(0, 120) || '📎 Attachment',
        message_id: msg.id,
        created_at: msg.created_at,
        is_read: false,
      });
    }

    if (fresh.length > 0) {
      lastPollRef.current = fresh[0].created_at;
      setNotifications(prev => [...fresh, ...prev].slice(0, 50));
      setUnreadCount(prev => prev + fresh.length);
      fresh.forEach(notif => {
        playMessageSound();
        showDesktopNotification(
          `${notif.customer_name} — ${notif.ticket_number}`,
          notif.message_preview,
          '/logo/logo.png'
        );
      });
    }
  }, [staffId]);

  const loadInitial = useCallback(async () => {
    if (!staffId) return;
    const sb = createClient();
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentMessages } = await sb
      .from('ticket_messages')
      .select('id, message, created_at, sender_id, is_internal, ticket_id')
      .eq('is_internal', false)
      .neq('sender_id', staffId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(30);

    if (!recentMessages || recentMessages.length === 0) {
      lastPollRef.current = new Date().toISOString();
      return;
    }

    const notifs: StaffNotification[] = await Promise.all(
      recentMessages.map(async (msg) => {
        seenMessageIds.current.add(msg.id);
        const [{ data: ticket }, { data: sender }] = await Promise.all([
          sb.from('tickets').select('id, ticket_number, subject').eq('id', msg.ticket_id).single(),
          sb.from('profiles').select('full_name, email').eq('id', msg.sender_id).single(),
        ]);
        return {
          id: `msg-${msg.id}`,
          ticket_id: (ticket as any)?.id || '',
          ticket_number: (ticket as any)?.ticket_number || '',
          subject: (ticket as any)?.subject || '',
          customer_name: (sender as any)?.full_name || (sender as any)?.email || 'Customer',
          message_preview: (msg as any).message?.slice(0, 120) || '📎 Attachment',
          message_id: msg.id,
          created_at: msg.created_at,
          is_read: false,
        };
      })
    );

    setNotifications(notifs);
    lastPollRef.current = new Date().toISOString();
  }, [staffId]);

  useEffect(() => {
    if (!staffId) return;
    loadInitial();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [staffId, loadInitial, poll]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, markAllRead, markRead };
}
