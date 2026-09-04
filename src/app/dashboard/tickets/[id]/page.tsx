'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Paperclip, Send, Loader2, Ticket, X, FileText, Image as ImageIcon } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { C, STATUS_META, PRIORITY_META, pill, fmtDate, relativeTime, initials } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import StatusTimeline from '@/components/tickets/StatusTimeline';
import LiveTypingPreview from '@/components/chat/LiveTypingPreview';
import TicketClosedCard from '@/components/tickets/TicketClosedCard';
import type { Ticket as TicketType, TicketMessage, Profile, TicketStatus } from '@/types/database';

export default function CustomerTicketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const profile     = useProfile();
  const [ticket, setTicket]           = useState<TicketType | null>(null);
  const [messages, setMessages]       = useState<TicketMessage[]>([]);
  const [assignee, setAssignee]       = useState<Profile | null>(null);
  const [loading, setLoading]         = useState(true);
  const [reply, setReply]             = useState('');
  const [sending, setSending]         = useState(false);
  const [focused, setFocused]         = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploading, setUploading]     = useState(false);
  const [typingUsers, setTypingUsers] = useState<Record<string, any>>({});
  const [existingRating, setExistingRating] = useState<number | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<any>(null);

  useEffect(() => {
    const sb = createClient();
    let pollInterval: NodeJS.Timeout;
    let realtimeWorking = false;
    let lastMessageCount = 0;

    console.log('🚀 [Customer] Component mounted, ticket ID:', id);

    const load = async () => {
      console.log('📥 [Customer] Loading initial data...');
      const [{ data: t, error: tErr }, { data: msgs, error: msgsErr }] = await Promise.all([
        sb.from('tickets')
          .select('*, customer:profiles!customer_id(*), assignee:profiles!assigned_to(*)')
          .eq('id', id).single(),
        sb.from('ticket_messages')
          .select('*, sender:profiles!sender_id(*), attachments:ticket_attachments(*)')
          .eq('ticket_id', id)
          .eq('is_internal', false)
          .order('created_at', { ascending: true }),
      ]);
      
      if (tErr) console.error('❌ [Customer] Ticket error:', tErr);
      if (msgsErr) console.error('❌ [Customer] Messages error:', msgsErr);
      
      console.log('✅ [Customer] Initial data loaded:', {
        ticket: t?.ticket_number,
        status: t?.status,
        messages: msgs?.length || 0
      });
      
      setTicket(t ?? null);
      setMessages(msgs ?? []);
      lastMessageCount = msgs?.length || 0;
      if (t?.assigned_to) setAssignee((t as any).assignee ?? null);
      setLoading(false);

      // Fetch existing rating if ticket is closed/resolved
      if (t && (t.status === 'closed' || t.status === 'resolved')) {
        const { data: rating } = await sb
          .from('customer_ratings')
          .select('rating')
          .eq('ticket_id', id)
          .single();
        if (rating) setExistingRating(rating.rating);
      }
    };

    // AGGRESSIVE polling
    const pollMessages = async () => {
      console.log('🔄 [Customer Poll] Checking for updates... (Realtime:', realtimeWorking, ')');
      
      try {
        const [{ data: t }, { data: msgs }] = await Promise.all([
          sb.from('tickets').select('*').eq('id', id).single(),
          sb.from('ticket_messages')
            .select('*, sender:profiles!sender_id(*), attachments:ticket_attachments(*)')
            .eq('ticket_id', id)
            .eq('is_internal', false)
            .order('created_at', { ascending: true })
        ]);
        
        // Update ticket status
        if (t) {
          setTicket(prev => {
            if (prev && prev.status !== t.status) {
              console.log('🔄 [Customer Poll] Status changed:', prev.status, '→', t.status);
              // Fetch rating when newly closed/resolved
              if (t.status === 'closed' || t.status === 'resolved') {
                sb.from('customer_ratings')
                  .select('rating')
                  .eq('ticket_id', id)
                  .single()
                  .then(({ data }) => { if (data) setExistingRating(data.rating); });
              }
            }
            return { ...prev, ...t };
          });
        }
        
        const currentCount = msgs?.length || 0;
        console.log('📊 [Customer Poll] Count - Previous:', lastMessageCount, 'Current:', currentCount);
        
        if (msgs && currentCount > lastMessageCount) {
          console.log('🎉 [Customer Poll] NEW MESSAGES! Adding', currentCount - lastMessageCount);
          setMessages(msgs);
          lastMessageCount = currentCount;
        } else {
          console.log('✓ [Customer Poll] No new messages');
        }
      } catch (err) {
        console.error('❌ [Customer Poll] Exception:', err);
      }
    };

    load();

    // Start AGGRESSIVE polling immediately
    console.log('⏰ [Customer] Starting polling interval (1.5s)');
    pollInterval = setInterval(pollMessages, 1500);

    console.log('[Customer] Setting up Realtime for ticket:', id);
    const channel = sb.channel(`customer-ticket-${id}`, {
      config: {
        broadcast: { ack: true },
        presence: { key: '' },
      }
    })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ticket_messages', filter: `ticket_id=eq.${id}` },
        async payload => {
          if (payload.new.is_internal) return;
          console.log('[Customer Realtime] ✅ New message received!', payload.new);
          realtimeWorking = true;
          const { data: msg } = await sb.from('ticket_messages')
            .select('*, sender:profiles!sender_id(*), attachments:ticket_attachments(*)')
            .eq('id', payload.new.id).single();
          if (msg) {
            console.log('[Customer Realtime] Adding to state:', msg);
            setMessages(prev => {
              const exists = prev.some(m => m.id === msg.id);
              return exists ? prev : [...prev, msg];
            });
          }
        })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tickets', filter: `id=eq.${id}` },
        payload => {
          console.log('[Customer Realtime] ✅ Ticket updated!', payload.new);
          realtimeWorking = true;
          setTicket(prev => prev ? { ...prev, ...payload.new } : prev);
        })
      .subscribe((status, err) => {
        console.log('[Customer Realtime] 🔌 Subscription status:', status, err);
        if (status === 'SUBSCRIBED') {
          console.log('[Customer Realtime] ✅ Successfully subscribed!');
          realtimeWorking = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[Customer Realtime] ❌ Failed, using polling');
          realtimeWorking = false;
          pollInterval = setInterval(pollMessages, 1500);
        }
      });

    // Set up presence tracking for typing
    if (profile) {
      const presenceChannel = sb.channel(`presence:ticket:${id}`)
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
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
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({
              user_id: profile.id,
              user_name: profile.full_name || profile.email,
              is_typing: false,
              typing_text: '',
              last_seen: new Date().toISOString(),
            });
          }
        });
      presenceChannelRef.current = presenceChannel;
    }

    return () => {
      console.log('[Customer] Cleaning up Realtime and polling');
      clearInterval(pollInterval);
      sb.removeChannel(channel);
      if (presenceChannelRef.current) {
        sb.removeChannel(presenceChannelRef.current);
      }
    };
  }, [id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const isImage  = (type: string) => type?.startsWith('image/');
  const fmtSize  = (b: number) => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf'];
    const next = Array.from(e.target.files).filter(f => allowed.includes(f.type) && f.size <= 10485760);
    setAttachments(p => [...p, ...next]);
    e.target.value = '';
  };

  const handleReplyChange = (value: string) => {
    setReply(value);
    
    // Update live typing preview
    if (presenceChannelRef.current && profile) {
      presenceChannelRef.current.track({
        user_id: profile.id,
        user_name: profile.full_name || profile.email,
        is_typing: value.length > 0,
        typing_text: value,
        last_seen: new Date().toISOString(),
      });
      
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

  const handleSend = async () => {
    if ((!reply.trim() && attachments.length === 0) || !profile || sending) return;
    setSending(true);
    setUploading(attachments.length > 0);
    const sb = createClient();

    const { data: msg } = await sb.from('ticket_messages').insert({
      ticket_id:   id,
      sender_id:   profile.id,
      message:     reply.trim() || (attachments.length > 0 ? '📎 Attachment' : ''),
      is_internal: false,
    }).select().single();

    if (msg && attachments.length > 0) {
      for (const file of attachments) {
        try {
          const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const path = `${id}/${Date.now()}_${safe}`;
          const { data: up } = await sb.storage.from('ticket-attachments').upload(path, file, { upsert: false });
          if (up) {
            const { data: { publicUrl } } = sb.storage.from('ticket-attachments').getPublicUrl(path);
            await sb.from('ticket_attachments').insert({
              ticket_id: id, message_id: msg.id, uploaded_by: profile.id,
              file_name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size,
            });
          }
        } catch { /* skip */ }
      }
    }

    await sb.from('tickets').update({ updated_at: new Date().toISOString() }).eq('id', id);
    setReply(''); setAttachments([]); setSending(false); setUploading(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - 52px)' }}>
        <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!ticket) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <Ticket size={36} color={C.textMuted} style={{ marginBottom: 14, display: 'block', margin: '0 auto 14px' }} />
        <p style={{ fontSize: 15, color: C.text, marginBottom: 6 }}>Ticket not found</p>
        <Link href="/dashboard/tickets" style={{ fontSize: 13, color: C.accentHi }}>← Back to tickets</Link>
      </div>
    </div>
  );

  const st      = STATUS_META[ticket.status] ?? STATUS_META['open'];
  const pr      = PRIORITY_META[ticket.priority] ?? PRIORITY_META['normal'];
  const canSend = (!!reply.trim() || attachments.length > 0) && !sending;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg, display: 'flex', flexDirection: 'column' }}>
      <TopBar />

      {/* Header */}
      <div style={{ backgroundColor: C.surface, borderBottom: `1px solid ${C.border}`, padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <Link href="/dashboard/tickets" style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.textMuted, fontSize: 12, textDecoration: 'none' }}>
          <ArrowLeft size={13} /> My Tickets
        </Link>
        <span style={{ color: C.border2 }}>·</span>
        <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.accentHi, fontWeight: 700 }}>{ticket.ticket_number}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</span>
        <span style={pill(st.color, st.bg)}><span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />{st.label}</span>
        <span style={pill(pr.color, pr.bg)}>{pr.label}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Conversation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', display: 'flex', flexDirection: 'column' }}>
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: C.textMuted, fontSize: 13, marginTop: 40 }}>No messages yet. Start the conversation below.</div>
            )}
            {messages.map((msg, i) => {
              const isMe   = msg.sender_id === profile?.id;
              const sender = (msg as any).sender as Profile | null;
              const atts   = (msg as any).attachments ?? [];
              const grouped = i > 0 && messages[i - 1].sender_id === msg.sender_id;
              return (
                <div key={msg.id} style={{ display: 'flex', gap: 10, marginTop: grouped ? 3 : 18 }}>
                  <div style={{ width: 28, flexShrink: 0, paddingTop: 2 }}>
                    {!grouped && (
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: isMe ? 'linear-gradient(135deg,#6D28D9,#A855F7)' : `linear-gradient(135deg,${C.surface3},${C.border})`, border: `1px solid ${isMe ? 'rgba(139,92,246,0.3)' : C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isMe ? '#fff' : C.textSub }}>
                        {initials(sender?.full_name ?? sender?.email)}
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {!grouped && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{sender?.full_name ?? sender?.email ?? 'User'}</span>
                        <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 3, color: isMe ? C.accentHi : C.textMuted, backgroundColor: isMe ? C.accentDim : C.surface3, border: `1px solid ${isMe ? C.accentBorder : C.border}` }}>
                          {isMe ? 'You' : 'Support Team'}
                        </span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>{relativeTime(msg.created_at)}</span>
                      </div>
                    )}
                    {msg.message && msg.message !== '📎 Attachment' && (
                      <div style={{ backgroundColor: C.surface, border: `1px solid ${isMe ? C.accentBorder : C.border}`, borderRadius: '3px 10px 10px 10px', padding: '10px 13px', maxWidth: 600, marginBottom: atts.length > 0 ? 8 : 0 }}>
                        <p style={{ fontSize: 13, color: C.text, lineHeight: 1.65, margin: 0, whiteSpace: 'pre-wrap' }}>{msg.message}</p>
                      </div>
                    )}
                    {atts.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, maxWidth: 600 }}>
                        {atts.map((att: any) => isImage(att.file_type ?? '') ? (
                          <a 
                            key={att.id} 
                            href={att.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ display: 'block', textDecoration: 'none' }}
                          >
                            <img 
                              src={att.file_url} 
                              alt={att.file_name} 
                              style={{ 
                                maxWidth: 280, 
                                maxHeight: 200, 
                                borderRadius: 8, 
                                border: `1px solid ${C.border}`, 
                                objectFit: 'cover', 
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                (e.target as HTMLImageElement).style.transform = 'scale(1.05)';
                                (e.target as HTMLImageElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                              }}
                              onMouseLeave={(e) => {
                                (e.target as HTMLImageElement).style.transform = 'scale(1)';
                                (e.target as HTMLImageElement).style.boxShadow = 'none';
                              }}
                            />
                          </a>
                        ) : (
                          <a 
                            key={att.id} 
                            href={att.file_url} 
                            download={att.file_name}
                            target="_blank" 
                            rel="noopener noreferrer" 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: 10, 
                              padding: '10px 14px', 
                              backgroundColor: C.surface2, 
                              border: `1px solid ${C.border}`, 
                              borderRadius: 8, 
                              textDecoration: 'none', 
                              maxWidth: 320,
                              transition: 'all 0.2s',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.surface3;
                              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.surface2;
                              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                              (e.currentTarget as HTMLAnchorElement).style.boxShadow = 'none';
                            }}
                          >
                            <div style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              backgroundColor: 'rgba(124, 58, 237, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}>
                              <FileText size={18} color={C.accent} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ 
                                fontSize: 13, 
                                fontWeight: 500, 
                                color: C.text, 
                                whiteSpace: 'nowrap', 
                                overflow: 'hidden', 
                                textOverflow: 'ellipsis' 
                              }}>
                                {att.file_name}
                              </div>
                              {att.file_size && (
                                <div style={{ fontSize: 11, color: C.textMuted }}>
                                  {fmtSize(att.file_size)}
                                </div>
                              )}
                            </div>
                            <div style={{
                              padding: '4px 10px',
                              backgroundColor: C.accent,
                              color: 'white',
                              borderRadius: 5,
                              fontSize: 11,
                              fontWeight: 600,
                            }}>
                              Open
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            
            {/* Live typing preview - shows what staff is typing */}
            {Object.values(typingUsers).flat().filter((u: any) => 
              u.user_id !== profile?.id && u.is_typing && u.typing_text
            ).map((u: any) => (
              <LiveTypingPreview 
                key={u.user_id} 
                userName={u.user_name} 
                text={u.typing_text} 
              />
            ))}

            {/* Ticket closed / resolved card */}
            {ticket && (ticket.status === 'closed' || ticket.status === 'resolved') && (
              <TicketClosedCard
                ticketId={id}
                ticketNumber={ticket.ticket_number}
                closedAt={ticket.updated_at}
                existingRating={existingRating}
              />
            )}

            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          {/* Composer — locked when ticket is closed or resolved */}
          {ticket && (ticket.status === 'closed' || ticket.status === 'resolved') ? (
            <div style={{
              borderTop: `1px solid ${C.border}`,
              backgroundColor: C.surface,
              padding: '16px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 20px',
                backgroundColor: 'rgba(16,185,129,0.06)',
                border: '1px solid rgba(16,185,129,0.2)',
                borderRadius: 8,
                width: '100%',
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(16,185,129,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 16,
                }}>
                  🔒
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>
                    This ticket is {ticket.status === 'closed' ? 'closed' : 'resolved'}
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>
                    You can no longer reply. Open a new ticket if you need further help.
                  </div>
                </div>
              </div>
              <Link
                href="/dashboard/new-ticket"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 28px',
                  backgroundColor: C.accent,
                  color: 'white',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 16px rgba(124,58,237,0.4)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(124,58,237,0.3)';
                }}
              >
                + Open New Ticket
              </Link>
            </div>
          ) : (
          <div style={{ borderTop: `1px solid ${C.border}`, backgroundColor: C.surface, padding: '14px 24px' }}>
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 10 }}>
                {attachments.map((file, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                    {isImage(file.type) ? <ImageIcon size={12} color={C.accentHi} /> : <FileText size={12} color={C.accentHi} />}
                    <span style={{ fontSize: 11, color: C.text, maxWidth: 140, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</span>
                    <span style={{ fontSize: 10, color: C.textMuted }}>{fmtSize(file.size)}</span>
                    <button onClick={() => setAttachments(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 0, display: 'flex' }}><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
            <textarea
              rows={3} value={reply} onChange={e => handleReplyChange(e.target.value)}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(); }}
              placeholder="Write a reply… (Ctrl+Enter to send)"
              style={{ width: '100%', backgroundColor: C.surface3, border: `1px solid ${focused ? C.accentBorder : C.border}`, boxShadow: focused ? `0 0 0 3px ${C.accentDim}` : 'none', borderRadius: 7, padding: '10px 12px', color: C.text, fontSize: 13, resize: 'none', outline: 'none', lineHeight: 1.6, boxSizing: 'border-box', marginBottom: 10, transition: 'all 0.15s' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', border: `1px solid ${C.border}`, borderRadius: 5, color: C.textMuted, fontSize: 12, cursor: 'pointer' }}>
                <Paperclip size={12} />
                {attachments.length > 0 ? `${attachments.length} file${attachments.length > 1 ? 's' : ''}` : 'Attach file'}
                <input ref={fileRef} type="file" multiple accept="image/*,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleFileSelect} />
              </label>
              <button onClick={handleSend} disabled={!canSend}
                style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: canSend ? C.accent : C.surface3, color: canSend ? '#fff' : C.textMuted, border: 'none', borderRadius: 5, padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: canSend ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                {sending
                  ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />{uploading ? 'Uploading…' : 'Sending…'}</>
                  : <><Send size={12} /> Send Reply</>}
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Right panel */}
        <aside style={{ width: 268, flexShrink: 0, borderLeft: `1px solid ${C.border}`, backgroundColor: C.surface, overflowY: 'auto', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <StatusTimeline ticketId={id} currentStatus={ticket.status as TicketStatus} isStaff={false} />
          <div style={{ height: 1, backgroundColor: C.border }} />
          <section>
            <h3 style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Ticket Details</h3>
            {[
              { k: 'Priority', v: <span style={pill(pr.color, pr.bg)}>{pr.label}</span> },
              { k: 'Category', v: <span style={{ fontSize: 12, color: C.text }}>{ticket.category}</span> },
              { k: 'Assigned', v: <span style={{ fontSize: 12, color: assignee ? C.text : C.textMuted }}>{assignee?.full_name ?? 'Unassigned'}</span> },
              { k: 'Created',  v: <span style={{ fontSize: 12, color: C.text }}>{fmtDate(ticket.created_at)}</span> },
              ...(ticket.account_id     ? [{ k: 'Account ID',     v: <span style={{ fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{ticket.account_id}</span>     }] : []),
              ...(ticket.transaction_id ? [{ k: 'Transaction ID', v: <span style={{ fontSize: 11, color: C.text, fontFamily: 'monospace' }}>{ticket.transaction_id}</span> }] : []),
            ].map(({ k, v }) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 11, color: C.textMuted }}>{k}</span>{v}
              </div>
            ))}
          </section>
        </aside>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
