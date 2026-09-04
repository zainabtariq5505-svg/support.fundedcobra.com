import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from './browser';

export type PresenceState = {
  user_id: string;
  user_name: string;
  is_typing: boolean;
  last_seen: string;
};

export function useTicketPresence(
  ticketId: string,
  userId: string,
  userName: string,
  onPresenceChange: (users: Record<string, PresenceState[]>) => void
): {
  channel: RealtimeChannel | null;
  updateTyping: (isTyping: boolean) => void;
} {
  const sb = createClient();
  
  const channel = sb.channel(`presence:ticket:${ticketId}`, {
    config: {
      presence: {
        key: userId,
      },
    },
  });

  // Track initial state
  channel
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      onPresenceChange(state);
    })
    .on('presence', { event: 'join' }, ({ key, newPresences }) => {
      console.log('[Presence] User joined:', key, newPresences);
      const state = channel.presenceState();
      onPresenceChange(state);
    })
    .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      console.log('[Presence] User left:', key, leftPresences);
      const state = channel.presenceState();
      onPresenceChange(state);
    })
    .subscribe(async (status) => {
      console.log('[Presence] Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        await channel.track({
          user_id: userId,
          user_name: userName,
          is_typing: false,
          last_seen: new Date().toISOString(),
        });
      }
    });

  const updateTyping = async (isTyping: boolean) => {
    await channel.track({
      user_id: userId,
      user_name: userName,
      is_typing: isTyping,
      last_seen: new Date().toISOString(),
    });
  };

  return { channel, updateTyping };
}
