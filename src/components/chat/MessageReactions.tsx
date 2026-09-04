import { useState } from 'react';
import { C } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🎉'];

interface Reaction {
  emoji: string;
  user_ids: string[];
  count: number;
}

export default function MessageReactions({ 
  messageId, 
  reactions, 
  onReactionAdd 
}: { 
  messageId: string; 
  reactions?: Record<string, string[]>; 
  onReactionAdd?: (emoji: string) => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const [localReactions, setLocalReactions] = useState<Record<string, string[]>>(reactions || {});

  const handleReaction = async (emoji: string) => {
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    // Optimistic update
    setLocalReactions(prev => {
      const current = prev[emoji] || [];
      const hasReacted = current.includes(user.id);
      
      if (hasReacted) {
        // Remove reaction
        return { ...prev, [emoji]: current.filter(id => id !== user.id) };
      } else {
        // Add reaction
        return { ...prev, [emoji]: [...current, user.id] };
      }
    });

    onReactionAdd?.(emoji);
    setShowPicker(false);
  };

  const reactionEntries = Object.entries(localReactions).filter(([_, ids]) => ids.length > 0);

  return (
    <div style={{ position: 'relative', display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
      {reactionEntries.map(([emoji, userIds]) => (
        <button
          key={emoji}
          onClick={() => handleReaction(emoji)}
          style={{
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: '2px 8px',
            fontSize: 12,
            backgroundColor: C.surface2,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <span>{emoji}</span>
          <span style={{ color: C.textSub, fontSize: 11 }}>{userIds.length}</span>
        </button>
      ))}
      
      <button
        onClick={() => setShowPicker(!showPicker)}
        style={{
          border: `1px solid ${C.border}`,
          borderRadius: 12,
          padding: '2px 8px',
          fontSize: 14,
          backgroundColor: C.surface2,
          cursor: 'pointer',
          opacity: 0.6,
        }}
        title="Add reaction"
      >
        😊
      </button>

      {showPicker && (
        <div style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          backgroundColor: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          padding: 8,
          display: 'flex',
          gap: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100,
        }}>
          {REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReaction(emoji)}
              style={{
                fontSize: 20,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                padding: 4,
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
