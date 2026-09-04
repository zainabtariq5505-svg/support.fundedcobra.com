import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from './browser';

export function subscribeToTicketMessages(
  ticketId: string,
  onMessage: (msg: any) => void,
  onTicketUpdate?: (ticket: any) => void
): RealtimeChannel {
  const sb = createClient();
  
  const channel = sb.channel(`ticket:${ticketId}`, {
    config: {
      broadcast: { self: true },
      presence: { key: '' },
    },
  });

  // Listen for new messages
  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'ticket_messages',
      filter: `ticket_id=eq.${ticketId}`,
    },
    async (payload) => {
      console.log('[Realtime] New message event:', payload);
      
      // Fetch full message with sender details
      const { data: msg } = await sb
        .from('ticket_messages')
        .select('*, sender:profiles!sender_id(*), attachments:ticket_attachments(*)')
        .eq('id', payload.new.id)
        .single();
      
      if (msg) {
        console.log('[Realtime] Delivering message to callback:', msg);
        onMessage(msg);
      }
    }
  );

  // Listen for ticket updates (status, priority changes)
  if (onTicketUpdate) {
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'tickets',
        filter: `id=eq.${ticketId}`,
      },
      (payload) => {
        console.log('[Realtime] Ticket update:', payload);
        onTicketUpdate(payload.new);
      }
    );
  }

  channel.subscribe((status, err) => {
    console.log('[Realtime] Channel status:', status, err);
  });

  return channel;
}

export function subscribeToInternalNotes(
  ticketId: string,
  onNote: (note: any) => void
): RealtimeChannel {
  const sb = createClient();
  
  const channel = sb.channel(`notes:${ticketId}`);

  channel.on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'internal_notes',
      filter: `ticket_id=eq.${ticketId}`,
    },
    async (payload) => {
      console.log('[Realtime] New note event:', payload);
      
      const { data: note } = await sb
        .from('internal_notes')
        .select('*, staff:profiles!staff_id(full_name,email)')
        .eq('id', payload.new.id)
        .single();
      
      if (note) {
        console.log('[Realtime] Delivering note to callback:', note);
        onNote(note);
      }
    }
  );

  channel.subscribe((status) => {
    console.log('[Realtime] Notes channel status:', status);
  });

  return channel;
}
