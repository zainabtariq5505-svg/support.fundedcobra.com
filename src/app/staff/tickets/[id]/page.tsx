'use client';
import React from 'react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Paperclip, Lock, Tag, UserPlus, Loader2, Ticket, X, FileText, Image as ImageIcon, Check, CheckCheck } from 'lucide-react';
import { C, STATUS_META, PRIORITY_META, pill, fmtDate, relativeTime, initials } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import StatusTimeline from '@/components/tickets/StatusTimeline';
import LiveTypingPreview from '@/components/chat/LiveTypingPreview';
import MessageReactions from '@/components/chat/MessageReactions';
import VoiceRecorder from '@/components/chat/VoiceRecorder';
import MessageSearch from '@/components/chat/MessageSearch';
import CannedResponses from '@/components/chat/CannedResponses';
import SLATimer from '@/components/tickets/SLATimer';
import { playMessageSound, showDesktopNotification } from '@/lib/notifications';
import type { Ticket as TicketType, TicketMessage, Profile, TicketStatus } from '@/types/database';

// Only valid DB status values (no alias keys)
const VALID_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: 'open',                  label: 'Open'                  },
  { value: 'in_progress',           label: 'In Progress'           },
  { value: 'waiting_for_customer',  label: 'Waiting for Customer'  },
  { value: 'waiting_for_staff',     label: 'Waiting for Staff'     },
  { value: 'resolved',              label: 'Resolved'              },
  { value: 'closed',                label: 'Closed'                },
];

export default function StaffTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const profile = useProfile();
  const [ticket, setTicket]           = useState<TicketType | null>(null);
  const [messages, setMessages]       = useState<TicketMessage[]>([]);
  const [notes, setNotes]             = useState<any[]>([]);
  const [customer, setCustomer]       = useState<Profile | null>(null);
  const [prevTickets, setPrevTickets] = useState<TicketType[]>([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState<'reply' | 'note'>('reply');
  const [body, setBody]               = useState('');
  const [sending, setSending]         = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});
  const [messageStatuses, setMessageStatuses] = useState<Record<string, 'sending' | 'sent'>>({});
  const [newMessageAlert, setNewMessageAlert] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const attachRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    const sb = createClient();
    let pollInterval: NodeJS.Timeout;
    let realtimeWorking = false;
    let lastMessageCount = 0;
    
    console.log('🚀 [Staff] Component mounted, ticket ID:', id);
    
    const loadData = async () => {
      console.log('📥 [Staff] Loading initial data...');
      const { data: t, error: tErr } = await sb.from('tickets').select('*').eq('id', id).single();
      if (tErr) console.error('❌ [Staff] Ticket load error:', tErr);
      if (!t) { setLoading(false); return; }

      const [{ data: msgs, error: msgsErr }, { data: ns, error: nsErr }] = await Promise.all([
        sb.from('ticket_messages')
          .select('*, sender:profiles!sender_id(full_name,email,role), attachments:ticket_attachments(*)')
          .eq('ticket_id', id)
          .order('created_at', { ascending: true }),
        sb.from('internal_notes')
          .select('*, staff:profiles!staff_id(full_name,email)')
          .eq('ticket_id', id)
          .order('created_at', { ascending: true }),
      ]);
      
      if (msgsErr) console.error('❌ [Staff] Messages load error:', msgsErr);
      if (nsErr) console.error('❌ [Staff] Notes load error:', nsErr);

      const { data: cust } = await sb.from('profiles').select('*').eq('id', t.customer_id).single();
      let assigneeData = null;
      if (t.assigned_to) {
        const { data: asgn } = await sb.from('profiles').select('full_name,email').eq('id', t.assigned_to).single();
        assigneeData = asgn;
      }

      console.log('✅ [Staff] Initial data loaded:', { 
        ticket: t.ticket_number, 
        messages: msgs?.length || 0,
        notes: ns?.length || 0 
      });

      setTicket({ ...t, customer: cust, assignee: assigneeData } as any);
      setMessages(msgs ?? []);
      lastMessageCount = msgs?.length || 0;
      setNotes(ns ?? []);
      setCustomer(cust ?? null);

      if (cust) {
        const { data: pt } = await sb.from('tickets').select('*')
          .eq('customer_id', cust.id).neq('id', id)
          .order('created_at', { ascending: false }).limit(4);
        setPrevTickets(pt ?? []);
      }
      setLoading(false);
    };

    // AGGRESSIVE polling - check every 1.5 seconds
    const pollMessages = async () => {
      console.log('🔄 [Staff Poll] Checking for new messages... (Realtime working:', realtimeWorking, ')');
      
      try {
        const { data: msgs, error } = await sb.from('ticket_messages')
          .select('*, sender:profiles!sender_id(full_name,email,role), attachments:ticket_attachments(*)')
          .eq('ticket_id', id)
          .order('created_at', { ascending: true });
        
        if (error) {
          console.error('❌ [Staff Poll] Error:', error);
          return;
        }
        
        const currentCount = msgs?.length || 0;
        console.log('📊 [Staff Poll] Message count - Previous:', lastMessageCount, 'Current:', currentCount);
        
        if (msgs && currentCount > lastMessageCount) {
          console.log('🎉 [Staff Poll] NEW MESSAGES DETECTED! Adding', currentCount - lastMessageCount, 'messages');
          const newMessages = msgs.slice(lastMessageCount);
          
          newMessages.forEach(msg => {
            if (msg.sender_id !== profile?.id) {
              console.log('🔔 [Staff Poll] Playing notification for message:', msg.id);
              playMessageSound();
              showDesktopNotification(
                'New message from customer',
                msg.message?.slice(0, 100) || 'New attachment',
                '/logo/logo.png'
              );
            }
          });
          
          setMessages(msgs);
          lastMessageCount = currentCount;
        } else if (msgs) {
          console.log('✓ [Staff Poll] No new messages');
        }
      } catch (err) {
        console.error('❌ [Staff Poll] Exception:', err);
      }
    };

    loadData();

    // Set up Realtime subscription
    console.log('[Staff] Setting up Realtime for ticket:', id);
    const channel = sb.channel(`staff-ticket-${id}`, {
      config: {
        broadcast: { ack: true },
        presence: { key: '' },
      }
    })
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${id}` },
        async (payload) => {
          console.log('[Staff Realtime] ✅ New message received!', payload.new);
          realtimeWorking = true; // Mark Realtime as working
          const { data: msg } = await sb.from('ticket_messages')
            .select('*, sender:profiles!sender_id(full_name,email,role), attachments:ticket_attachments(*)')
            .eq('id', payload.new.id).single();
          if (msg) {
            console.log('[Staff Realtime] Adding message to state');
            // Play sound if message is from customer
            if (msg.sender_id !== profile?.id) {
              playMessageSound();
              showDesktopNotification(
                'New message from customer',
                msg.message?.slice(0, 100) || 'New attachment',
                '/logo/logo.png'
              );
            }
            setMessages(prev => {
              const exists = prev.some(m => m.id === msg.id);
              if (!exists) {
                console.log('✨ [Staff Realtime] Message added! New count:', prev.length + 1);
                // Flash alert
                setNewMessageAlert(true);
                setTimeout(() => setNewMessageAlert(false), 3000);
              }
              return exists ? prev : [...prev, msg];
            });
            // Force scroll after short delay
            setTimeout(() => {
              bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 200);
          }
        })
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'internal_notes', filter: `ticket_id=eq.${id}` },
        async (payload) => {
          console.log('[Staff Realtime] ✅ New note received!', payload.new);
          realtimeWorking = true;
          const { data: note } = await sb.from('internal_notes')
            .select('*, staff:profiles!staff_id(full_name,email)')
            .eq('id', payload.new.id).single();
          if (note) {
            console.log('[Staff Realtime] Adding note to state');
            setNotes(prev => {
              const exists = prev.some(n => n.id === note.id);
              return exists ? prev : [...prev, note];
            });
          }
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${id}` },
        (payload) => {
          console.log('[Staff Realtime] ✅ Ticket updated!', payload.new);
          realtimeWorking = true;
          setTicket(prev => prev ? { ...prev, ...payload.new } : prev);
        })
      .subscribe((status, err) => {
        console.log('[Staff Realtime] 🔌 Subscription status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('[Staff Realtime] ✅ Successfully subscribed!');
          realtimeWorking = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Staff Realtime] ❌ Failed to subscribe, using polling fallback');
          realtimeWorking = false;
          // Start polling fallback
          pollInterval = setInterval(pollMessages, 2000);
        }
      });

    // Start polling IMMEDIATELY and AGGRESSIVELY
    console.log('⏰ [Staff] Starting polling interval (1.5s)');
    pollInterval = setInterval(pollMessages, 1500);

    // Set up Realtime subscription
    if (profile) {
      const presenceChannel = sb.channel(`presence:ticket:${id}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          console.log('[Presence] State synced:', state);
          setTypingUsers(state);
        })
        .on('presence', { event: 'join' }, () => {
          const state = presenceChannel.presenceState();
          setTypingUsers(state);
        })
        .on('presence', { event: 'leave' }, () => {
          const state = presenceChannel.presenceState();
          setTypingUsers(state);
        })
        .subscribe(async (status) => {
          console.log('[Presence] Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: profile.id,
              user_name: profile.full_name || profile.email,
              is_typing: false,
              last_seen: new Date().toISOString(),
            });
          }
        });
      presenceChannelRef.current = presenceChannel;
    }

    return () => {
      console.log('[Staff] Cleaning up Realtime and polling');
      clearInterval(pollInterval);
      sb.removeChannel(channel);
      if (presenceChannelRef.current) {
        sb.removeChannel(presenceChannelRef.current);
      }
    };
  }, [id]);

  useEffect(() => { 
    console.log('📜 [Staff] Messages/notes changed, scrolling to bottom. Count:', messages.length, notes.length);
    
    // Check if user is scrolled up
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        // Auto-scroll only if already near bottom
        bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      } else {
        // User scrolled up, show unread indicator
        setIsScrolledUp(true);
        setUnreadCount(prev => prev + 1);
      }
    } else {
      // First render, always scroll
      bottomRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
    }
  }, [messages, notes]);
  
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    setUnreadCount(0);
    setIsScrolledUp(false);
  };

  // ── Record status history + send notification ──────────────────────
  const updateStatus = async (newStatus: TicketStatus) => {
    if (!ticket || !profile) return;
    const sb = createClient();
    const prevStatus = ticket.status;
    if (prevStatus === newStatus) return;

    const now = new Date().toISOString();
    const isResolved = newStatus === 'resolved';

    // 1. Update the ticket row
    await sb.from('tickets').update({
      status: newStatus,
      updated_at: now,
      ...(isResolved ? { resolved_at: now } : {}),
    }).eq('id', id);

    // 2. Record in history table
    await sb.from('ticket_status_history' as any).insert({
      ticket_id:       id,
      previous_status: prevStatus,
      new_status:      newStatus,
      changed_by:      profile.id,
    });

    // 3. Optimistic UI update
    setTicket(p => p ? { ...p, status: newStatus, ...(isResolved ? { resolved_at: now } : {}) } : p);

    // 4. Insert system message in chat when closed or resolved
    if (newStatus === 'closed' || newStatus === 'resolved') {
      const systemMsg = newStatus === 'closed'
        ? `🔒 This ticket has been **closed** by our support team. Thank you for reaching out to Funded Cobra Support! If you need further assistance, please open a new ticket.`
        : `✅ This ticket has been marked as **resolved**. We hope your issue has been addressed! Please rate your experience below.`;

      await sb.from('ticket_messages').insert({
        ticket_id:   id,
        sender_id:   profile.id,
        message:     systemMsg,
        is_internal: false,
      });
    }

    // 5. Notify customer
    if (customer) {
      const statusLabel = VALID_STATUSES.find(s => s.value === newStatus)?.label ?? newStatus;
      await sb.from('notifications').insert({
        user_id:   customer.id,
        title:     `Ticket ${ticket.ticket_number} status updated`,
        message:   `Your ticket has been updated to: ${statusLabel}`,
        type:      'status_change',
        ticket_id: id,
      });
    }
  };

  // ── Priority update ────────────────────────────────────────────────
  const updatePriority = async (priority: string) => {
    const sb = createClient();
    await sb.from('tickets').update({ priority: priority as any, updated_at: new Date().toISOString() }).eq('id', id);
    setTicket(p => p ? { ...p, priority: priority as any } : p);
  };

  const isImage = (type: string) => type?.startsWith('image/');
  const fmtSize = (bytes: number) => bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(1)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).filter(f => {
      const allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf'];
      return allowed.includes(f.type) && f.size <= 10 * 1024 * 1024;
    });
    setAttachments(p => [...p, ...newFiles]);
    e.target.value = '';
  };

  const handleBodyChange = (value: string) => {
    setBody(value);
    
    // Update live typing preview with actual text
    if (presenceChannelRef.current && profile) {
      presenceChannelRef.current.track({
        user_id: profile.id,
        user_name: profile.full_name || profile.email,
        is_typing: value.length > 0,
        typing_text: value, // Send actual text for live preview
        last_seen: new Date().toISOString(),
      });
      
      // Clear typing after 2 seconds of no typing
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        presenceChannelRef.current?.track({
          user_id: profile.id,
          user_name: profile.full_name || profile.email,
          is_typing: false,
          typing_text: '',
          last_seen: new Date().toISOString(),
        });
      }, 2000);
    }
  };

  // ── Send reply or internal note ────────────────────────────────────
  const handleSend = async () => {
    if ((!body.trim() && attachments.length === 0) || !profile || sending) return;
    setSending(true);
    setUploading(attachments.length > 0);
    const sb = createClient();

    if (tab === 'reply') {
      const { data: msg } = await sb.from('ticket_messages').insert({
        ticket_id:   id,
        sender_id:   profile.id,
        message:     body.trim() || (attachments.length > 0 ? '📎 Attachment' : ''),
        is_internal: false,
      }).select().single();

      // Upload attachments
      if (msg && attachments.length > 0) {
        for (const file of attachments) {
          try {
            const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path     = `${id}/${Date.now()}_${safeName}`;
            const { data: upload } = await sb.storage.from('ticket-attachments').upload(path, file, { upsert: false });
            if (upload) {
              const { data: { publicUrl } } = sb.storage.from('ticket-attachments').getPublicUrl(path);
              await sb.from('ticket_attachments').insert({
                ticket_id: id, message_id: msg.id, uploaded_by: profile.id,
                file_name: file.name, file_url: publicUrl,
                file_type: file.type, file_size: file.size,
              });
            }
          } catch { /* skip failed uploads */ }
        }
      }

      if (ticket?.status === 'open') {
        await updateStatus('in_progress');
      } else {
        await sb.from('tickets').update({ updated_at: new Date().toISOString() }).eq('id', id);
      }

      if (customer) {
        await sb.from('notifications').insert({
          user_id: customer.id,
          title:   `Staff replied to ${ticket?.ticket_number}`,
          message: body.trim().slice(0, 100) || 'Staff sent an attachment',
          type:    'ticket_reply',
          ticket_id: id,
        });
      }
    } else {
      await sb.from('internal_notes').insert({
        ticket_id: id,
        staff_id:  profile.id,
        note:      body.trim(),
      });
    }

    setBody('');
    setAttachments([]);
    setSending(false);
    setUploading(false);
  };

  // ── Loading / not found states ─────────────────────────────────────
  if (loading) return (
    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!ticket) return (
    <div style={{ padding: 32, backgroundColor: C.bg, minHeight: '100%', textAlign: 'center' }}>
      <Ticket size={32} color={C.textMuted} style={{ margin: '40px auto 12px', display: 'block' }} />
      <p style={{ color: C.text, marginBottom: 8 }}>Ticket not found</p>
      <Link href="/staff/tickets" style={{ color: C.accentHi, fontSize: 13 }}>← Back to tickets</Link>
    </div>
  );

  const st  = STATUS_META[ticket.status] ?? STATUS_META.open;
  const pr  = PRIORITY_META[ticket.priority] ?? PRIORITY_META.normal;
  const sel: React.CSSProperties = {
    backgroundColor: C.surface3, border: `1px solid ${C.border}`,
    borderRadius: 5, padding: '5px 8px', color: C.text,
    fontSize: 12, cursor: 'pointer', outline: 'none',
  };

  // Merged chronological timeline
  type TLItem = { id: string; kind: 'message' | 'note'; created_at: string; data: any };
  const timeline: TLItem[] = [
    ...messages.map(m => ({ id: m.id, kind: 'message' as const, created_at: m.created_at, data: m })),
    ...notes.map(n => ({ id: n.id, kind: 'note' as const, created_at: n.created_at, data: n })),
  ].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: C.bg }}>

      {/* ── Top bar ── */}
      <div style={{
        backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`,
        padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
      }}>
        <Link href="/staff/tickets" style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.textMuted, fontSize: 12, textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Tickets
        </Link>
        <span style={{ color: C.border2 }}>·</span>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.accentHi, fontWeight: 700 }}>{ticket.ticket_number}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {ticket.subject}
        </span>

        {/* Status select — only valid DB values */}
        <select style={sel} value={ticket.status} onChange={e => updateStatus(e.target.value as TicketStatus)}>
          {VALID_STATUSES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* Priority select */}
        <select style={sel} value={ticket.priority} onChange={e => updatePriority(e.target.value)}>
          {Object.entries(PRIORITY_META).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>

        <button style={{
          display: 'flex', alignItems: 'center', gap: 5,
          backgroundColor: C.surface3, border: `1px solid ${C.border}`,
          borderRadius: 5, padding: '5px 10px', color: C.textSub, fontSize: 12, cursor: 'pointer',
        }}>
          <UserPlus size={12} /> Assign
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Conversation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* New message alert */}
          {newMessageAlert && (
            <div style={{
              backgroundColor: '#10b981',
              color: 'white',
              padding: '8px 16px',
              textAlign: 'center',
              fontSize: 13,
              fontWeight: 600,
              animation: 'slideDown 0.3s ease-out',
            }}>
              ✨ New message received!
            </div>
          )}
          <div 
            ref={messagesContainerRef}
            onScroll={(e) => {
              const container = e.currentTarget;
              const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
              if (isNearBottom) {
                setIsScrolledUp(false);
                setUnreadCount(0);
              }
            }}
            style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {timeline.length === 0 && (
              <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 13, marginTop: 40 }}>
                No messages yet.
              </div>
            )}
            {timeline.map((item, i) => {
              // Internal note
              if (item.kind === 'note') {
                const note = item.data;
                const staff = note.staff;
                return (
                  <div key={item.id} style={{ margin: '14px 0', display: 'flex', gap: 10 }}>
                    <div style={{ width: 28, flexShrink: 0 }} />
                    <div style={{
                      flex: 1, backgroundColor: 'rgba(252,211,77,0.04)',
                      border: '1px solid rgba(252,211,77,0.18)', borderLeft: '3px solid #FCD34D',
                      borderRadius: '0 7px 7px 0', padding: '10px 14px', maxWidth: 580,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                        <Lock size={11} color="#FCD34D" />
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#FCD34D', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                          Internal Note
                        </span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>
                          · {staff?.full_name ?? 'Staff'} · {relativeTime(note.created_at)}
                        </span>
                      </div>
                      <p style={{ fontSize: 13, color: C.textSub, lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{note.note}</p>
                    </div>
                  </div>
                );
              }

              // Regular message
              const msg     = item.data as TicketMessage;
              const sender  = (msg as any).sender as Profile | null;
              const isStaff = sender?.role !== 'customer';
              const grouped = i > 0 && timeline[i - 1].kind === 'message' && timeline[i - 1].data.sender_id === msg.sender_id;

              return (
                <div key={item.id} style={{ display: 'flex', gap: 10, marginTop: grouped ? 3 : 18 }}>
                  <div style={{ width: 28, flexShrink: 0, paddingTop: 2 }}>
                    {!grouped && (
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: isStaff
                          ? 'linear-gradient(135deg,#6D28D9,#A855F7)'
                          : `linear-gradient(135deg,${C.surface3},${C.border})`,
                        border: `1px solid ${isStaff ? 'rgba(139,92,246,0.3)' : C.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 10, fontWeight: 700, color: isStaff ? '#fff' : C.textSub,
                      }}>
                        {initials(sender?.full_name ?? sender?.email)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {!grouped && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>
                          {sender?.full_name ?? sender?.email ?? 'User'}
                        </span>
                        <span style={{
                          fontSize: 10, padding: '1px 6px', borderRadius: 3,
                          color: isStaff ? C.accentHi : C.textMuted,
                          backgroundColor: isStaff ? C.accentDim : C.surface3,
                          border: `1px solid ${isStaff ? C.accentBorder : C.border}`,
                        }}>
                          {isStaff ? 'Staff' : 'Customer'}
                        </span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>{relativeTime(msg.created_at)}</span>
                      </div>
                    )}
                    <div style={{
                      backgroundColor: C.surface, border: `1px solid ${C.border}`,
                      borderRadius: '3px 10px 10px 10px', padding: '10px 13px', maxWidth: 580,
                    }}>
                      <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>
                        {msg.message}
                      </p>
                      
                      {/* Attachments */}
                      {(msg as any).attachments && (msg as any).attachments.length > 0 && (
                        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(msg as any).attachments.map((att: any) => {
                            const isImage = att.file_type?.startsWith('image/');
                            const isPDF = att.file_type === 'application/pdf';
                            
                            return (
                              <div key={att.id}>
                                {isImage ? (
                                  <a 
                                    href={att.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    style={{ display: 'block', textDecoration: 'none' }}
                                  >
                                    <img 
                                      src={att.file_url} 
                                      alt={att.file_name}
                                      style={{
                                        maxWidth: '100%',
                                        maxHeight: 300,
                                        borderRadius: 6,
                                        border: `1px solid ${C.border}`,
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                      }}
                                      onMouseEnter={(e) => {
                                        (e.target as HTMLImageElement).style.transform = 'scale(1.02)';
                                      }}
                                      onMouseLeave={(e) => {
                                        (e.target as HTMLImageElement).style.transform = 'scale(1)';
                                      }}
                                    />
                                  </a>
                                ) : (
                                  <a
                                    href={att.file_url}
                                    download={att.file_name}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 10,
                                      padding: '10px 12px',
                                      backgroundColor: C.surface2,
                                      border: `1px solid ${C.border}`,
                                      borderRadius: 6,
                                      textDecoration: 'none',
                                      transition: 'all 0.2s',
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.surface3;
                                      (e.currentTarget as HTMLAnchorElement).style.transform = 'translateX(4px)';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.surface2;
                                      (e.currentTarget as HTMLAnchorElement).style.transform = 'translateX(0)';
                                    }}
                                  >
                                    <div style={{
                                      width: 36,
                                      height: 36,
                                      borderRadius: 6,
                                      backgroundColor: isPDF ? 'rgba(239, 68, 68, 0.1)' : C.surface3,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}>
                                      {isPDF ? (
                                        <FileText size={18} color="#ef4444" />
                                      ) : (
                                        <Paperclip size={18} color={C.textMuted} />
                                      )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{
                                        fontSize: 13,
                                        fontWeight: 500,
                                        color: C.text,
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}>
                                        {att.file_name}
                                      </div>
                                      <div style={{ fontSize: 11, color: C.textMuted }}>
                                        {att.file_size ? `${(att.file_size / 1024).toFixed(1)} KB` : 'File'}
                                      </div>
                                    </div>
                                    <div style={{
                                      padding: '4px 8px',
                                      backgroundColor: C.accent,
                                      color: 'white',
                                      borderRadius: 4,
                                      fontSize: 11,
                                      fontWeight: 600,
                                    }}>
                                      Download
                                    </div>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Live typing preview - shows actual text being typed */}
            {Object.values(typingUsers).flat().filter((u: any) => 
              u.user_id !== profile?.id && u.is_typing && u.typing_text
            ).map((u: any) => (
              <LiveTypingPreview 
                key={u.user_id} 
                userName={u.user_name} 
                text={u.typing_text} 
              />
            ))}
            
            {/* Scroll to bottom button */}
            {isScrolledUp && unreadCount > 0 && (
              <div 
                onClick={scrollToBottom}
                style={{
                  position: 'absolute',
                  bottom: 80,
                  right: 24,
                  backgroundColor: C.accent,
                  color: 'white',
                  padding: '10px 16px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  zIndex: 10,
                }}
              >
                ↓ {unreadCount} new message{unreadCount > 1 ? 's' : ''}
              </div>
            )}
            
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.surface, padding: '13px 20px' }}>
            <div style={{ display: 'flex', gap: 2, marginBottom: 10, justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {(['reply', 'note'] as const).map(t2 => (
                  <button key={t2} onClick={() => setTab(t2)} style={{
                    padding: '5px 12px', borderRadius: 5, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer',
                    backgroundColor: tab === t2 ? (t2 === 'note' ? 'rgba(252,211,77,0.08)' : C.accentDim) : 'transparent',
                    color: tab === t2 ? (t2 === 'note' ? '#FCD34D' : C.accentHi) : C.textMuted,
                    borderBottom: tab === t2 ? `2px solid ${t2 === 'note' ? '#FCD34D' : C.accent}` : '2px solid transparent',
                    transition: 'all 0.2s',
                  }}>
                    {t2 === 'note' && <Lock size={10} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
                    {t2 === 'reply' ? 'Reply' : 'Whisper'}
                  </button>
                ))}
              </div>
              {tab === 'reply' && (
                <button
                  onClick={() => {
                    // Generate smart reply based on last message
                    const lastMsg = messages[messages.length - 1];
                    if (lastMsg) {
                      const suggestions = [
                        `Thanks for reaching out! I'm looking into "${lastMsg.message?.slice(0, 30)}..." and will update you shortly.`,
                        `I understand your concern. Let me check the details and get back to you within the next hour.`,
                        `Got it! I've escalated this to our technical team. You should receive an update within 24 hours.`
                      ];
                      const random = suggestions[Math.floor(Math.random() * suggestions.length)];
                      setBody(random);
                    }
                  }}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 5,
                    border: `1px solid ${C.border}`,
                    fontSize: 11,
                    fontWeight: 500,
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    color: C.accent,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.accentDim;
                    (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                  }}
                >
                  ✨ Smart Reply
                </button>
              )}
            </div>
            {/* Attachment previews */}
            {attachments.length > 0 && tab === 'reply' && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {attachments.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 5 }}>
                    {isImage(file.type) ? <ImageIcon size={11} color={C.accentHi} /> : <FileText size={11} color={C.accentHi} />}
                    <span style={{ fontSize: 11, color: C.text, maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                    <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 0, display: 'flex' }}>
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              rows={3} value={body} onChange={e => handleBodyChange(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
              placeholder={tab === 'reply' ? 'Write a reply… (Ctrl+Enter to send)' : 'Add a private note (only visible to staff)…'}
              style={{
                width: '100%', backgroundColor: C.surface3,
                border: `1px solid ${tab === 'note' ? 'rgba(252,211,77,0.2)' : C.border}`,
                borderRadius: 6, padding: '10px 12px', color: C.text,
                fontSize: 13, resize: 'none', outline: 'none',
                lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 10,
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {tab === 'reply' && (
                  <>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      background: 'none', 
                      border: `1px solid ${C.border}`, 
                      borderRadius: 6, 
                      padding: '7px 12px', 
                      color: C.textSub, 
                      fontSize: 13, 
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLLabelElement).style.backgroundColor = C.surface2;
                      (e.currentTarget as HTMLLabelElement).style.borderColor = C.accent;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLLabelElement).style.backgroundColor = 'transparent';
                      (e.currentTarget as HTMLLabelElement).style.borderColor = C.border;
                    }}
                    >
                      <Paperclip size={14} />
                      <input
                        ref={attachRef}
                        type="file"
                        multiple
                        accept="image/*,.pdf,application/pdf"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                      />
                    </label>
                    <button 
                      onClick={() => {
                        const emojis = ['👍', '😊', '🎉', '✅', '⭐', '💯'];
                        const emoji = emojis[Math.floor(Math.random() * emojis.length)];
                        setBody(prev => prev + emoji);
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 6, 
                        background: 'none', 
                        border: `1px solid ${C.border}`, 
                        borderRadius: 6, 
                        padding: '7px 12px', 
                        color: C.textSub, 
                        fontSize: 13, 
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.surface2;
                        (e.currentTarget as HTMLButtonElement).style.borderColor = C.accent;
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                        (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                      }}
                    >
                      😊
                    </button>
                  </>
                )}
              </div>
              <button onClick={handleSend} disabled={!body.trim() || sending} style={{
                display: 'flex', 
                alignItems: 'center', 
                gap: 8,
                padding: '8px 20px',
                backgroundColor: sending ? C.surface3 : C.accent,
                color: 'white',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: sending || !body.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !body.trim() ? 0.5 : 1,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!sending && body.trim()) {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 12px rgba(124, 58, 237, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.3)';
              }}
              >
                {sending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                {tab === 'note' ? 'Save Note' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right panel ── */}
        <aside style={{
          width: 268, flexShrink: 0, borderLeft: `1px solid ${C.border}`,
          backgroundColor: C.surface, overflowY: 'auto', padding: '16px 14px',
          display: 'flex', flexDirection: 'column', gap: 20,
        }}>
          {/* Status Timeline */}
          <StatusTimeline
            ticketId={id}
            currentStatus={ticket.status}
            isStaff={true}
          />

          <div style={{ height: 1, backgroundColor: C.border }} />

          {/* Ticket metadata */}
          <section>
            <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Ticket
            </h3>
            {[
              { k: 'Priority', v: <span style={pill(pr.color, pr.bg)}>{pr.label}</span> },
              { k: 'Category', v: <span style={{ fontSize: 12, color: C.text }}>{ticket.category}</span> },
              { k: 'Assigned', v: <span style={{ fontSize: 12, color: (ticket as any).assignee ? C.text : C.textMuted }}>{(ticket as any).assignee?.full_name ?? 'Unassigned'}</span> },
              { k: 'Created',  v: <span style={{ fontSize: 12, color: C.text }}>{fmtDate(ticket.created_at)}</span> },
              ...(ticket.account_id     ? [{ k: 'Account ID',     v: <span style={{ fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{ticket.account_id}</span>     }] : []),
              ...(ticket.transaction_id ? [{ k: 'Transaction ID', v: <span style={{ fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{ticket.transaction_id}</span> }] : []),
            ].map(({ k, v }) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>{k}</span>{v}
              </div>
            ))}
          </section>

          {/* Customer */}
          {customer && (
            <>
              <div style={{ height: 1, backgroundColor: C.border }} />
              <section>
                <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Customer
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                    background: `linear-gradient(135deg,${C.surface3},${C.border})`,
                    border: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 700, color: C.textSub,
                  }}>
                    {initials(customer.full_name ?? customer.email)}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{customer.full_name ?? 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{customer.email}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: C.textMuted }}>Customer since</span>
                  <span style={{ fontSize: 11, color: C.text }}>{fmtDate(customer.created_at)}</span>
                </div>
              </section>
            </>
          )}

          {/* Previous tickets */}
          {prevTickets.length > 0 && (
            <>
              <div style={{ height: 1, backgroundColor: C.border }} />
              <section>
                <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                  Previous Tickets
                </h3>
                {prevTickets.map(t => {
                  const s = STATUS_META[t.status] ?? STATUS_META.open;
                  return (
                    <Link key={t.id} href={`/staff/tickets/${t.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 3, padding: '8px 0', borderBottom: `1px solid ${C.border}`, textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.accentHi }}>{t.ticket_number}</span>
                        <span style={pill(s.color, s.bg)}>{s.label}</span>
                      </div>
                      <span style={{ fontSize: 12, color: C.textSub, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {t.subject}
                      </span>
                    </Link>
                  );
                })}
              </section>
            </>
          )}
        </aside>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
