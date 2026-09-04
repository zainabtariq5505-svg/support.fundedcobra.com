import { C } from '@/lib/ds';

export default function TypingIndicator({ userName }: { userName?: string }) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 8, 
      padding: '8px 12px',
      marginTop: 8,
    }}>
      <div style={{ 
        width: 28, 
        height: 28, 
        borderRadius: '50%',
        background: `linear-gradient(135deg,${C.surface3},${C.border})`,
        border: `1px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 10,
        fontWeight: 700,
        color: C.textSub,
      }}>
        {userName?.charAt(0)?.toUpperCase() ?? '?'}
      </div>
      <div style={{
        backgroundColor: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: '3px 10px 10px 10px',
        padding: '8px 12px',
        display: 'flex',
        gap: 4,
      }}>
        <span 
          className="typing-dot" 
          style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: C.textMuted,
            animation: 'typing 1.4s infinite',
            animationDelay: '0s',
          }} 
        />
        <span 
          className="typing-dot" 
          style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: C.textMuted,
            animation: 'typing 1.4s infinite',
            animationDelay: '0.2s',
          }} 
        />
        <span 
          className="typing-dot" 
          style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: C.textMuted,
            animation: 'typing 1.4s infinite',
            animationDelay: '0.4s',
          }} 
        />
        <style>{`
          @keyframes typing {
            0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
            30% { opacity: 1; transform: translateY(-4px); }
          }
        `}</style>
      </div>
      {userName && (
        <span style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>
          {userName} is typing...
        </span>
      )}
    </div>
  );
}
