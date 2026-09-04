'use client';
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

  // Poll for new customer messages across ALL tickets every 3 seconds
  const poll = useCallback(async () => {
    if (!staffId) return;
    const sb = createClient();

    const { data: newMessages } = await sb
      .from('ticket_messages')
      .select(`
        id,
        message,
        created_at,
        sender_id,
        is_internal,
        ticket:tickets!ticket_id (
          id,
          ticket_number,
          subject,
          customer_id
        ),
        sender:profiles!sender_id (
          full_name,
          email,
          role
        )
      `)
      .eq('is_internal', false)
      .neq('sender_id', staffId)              // not sent by this staff member
      .gt('created_at', lastPollRef.current)  // newer than last poll
      .order('created_at', { ascending: false })
      .limit(20);

    if (!newMessages || newMessages.length === 0) return;

    const fresh: StaffNotification[] = [];

    for (const msg of newMessages) {
      if (seenMessageIds.current.has(msg.id)) continue;
      seenMessageIds.current.add(msg.id);

      const ticket = msg.ticket as any;
      const sender = msg.sender as any;
      if (!ticket) continue;

      // Skip messages from the ticket's own customer that are replies to staff
      // (we still want to show them)
      const notif: StaffNotification = {
        id: `msg-${msg.id}`,
        ticket_id: ticket.id,
        ticket_number: ticket.ticket_number,
        subject: ticket.subject,
        customer_name: sender?.full_name || sender?.email || 'Customer',
        message_preview: msg.message?.slice(0, 120) || '📎 Attachment',
        message_id: msg.id,
        created_at: msg.created_at,
        is_read: false,
      };

      fresh.push(notif);
    }

    if (fresh.length > 0) {
      // Update last poll time to the newest message
      lastPollRef.current = fresh[0].created_at;

      setNotifications(prev => {
        const merged = [...fresh, ...prev].slice(0, 50); // keep last 50
        return merged;
      });
      setUnreadCount(prev => prev + fresh.length);

      // Sound + desktop notification for each new message
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

  // Initial load — fetch recent unread notifications from DB
  const loadInitial = useCallback(async () => {
    if (!staffId) return;
    const sb = createClient();

    // Fetch recent customer messages from the last 24 hours
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: recentMessages } = await sb
      .from('ticket_messages')
      .select(`
        id,
        message,
        created_at,
        sender_id,
        is_internal,
        ticket:tickets!ticket_id (
          id,
          ticket_number,
          subject
        ),
        sender:profiles!sender_id (
          full_name,
          email,
          role
        )
      `)
      .eq('is_internal', false)
      .neq('sender_id', staffId)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(30);

    if (recentMessages && recentMessages.length > 0) {
      const notifs: StaffNotification[] = recentMessages.map(msg => {
        const ticket = msg.ticket as any;
        const sender = msg.sender as any;
        seenMessageIds.current.add(msg.id);
        return {
          id: `msg-${msg.id}`,
          ticket_id: ticket?.id || '',
          ticket_number: ticket?.ticket_number || '',
          subject: ticket?.subject || '',
          customer_name: sender?.full_name || sender?.email || 'Customer',
          message_preview: msg.message?.slice(0, 120) || '📎 Attachment',
          message_id: msg.id,
          created_at: msg.created_at,
          is_read: false,
        };
      });
      setNotifications(notifs);
      // We don't set unread count from history — only from new messages during session
    }

    // Set poll start to now so we only pick up truly new messages
    lastPollRef.current = new Date().toISOString();
  }, [staffId]);

  useEffect(() => {
    if (!staffId) return;

    loadInitial();

    // Poll every 3 seconds
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [staffId, loadInitial, poll]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  return { notifications, unreadCount, markAllRead, markRead };
}
