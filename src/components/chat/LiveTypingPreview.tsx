import { useEffect, useState } from 'react';
import { C } from '@/lib/ds';

export default function LiveTypingPreview({ 
  userName, 
  text 
}: { 
  userName: string; 
  text: string;
}) {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  if (!text) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 8,
      padding: '8px 12px',
      marginTop: 8,
      animation: 'slideInFromBottom 0.3s ease-out',
    }}>
      <div style={{
        width: 28,
        height: 28,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`,
        border: `2px solid ${C.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 11,
        fontWeight: 700,
        color: 'white',
        flexShrink: 0,
      }}>
        {userName.charAt(0).toUpperCase()}
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 10,
          color: C.textMuted,
          marginBottom: 4,
          fontStyle: 'italic',
        }}>
          {userName} is typing...
        </div>
        <div style={{
          backgroundColor: C.surface2,
          border: `1px dashed ${C.accent}`,
          borderRadius: '3px 10px 10px 10px',
          padding: '10px 14px',
          position: 'relative',
          maxWidth: '80%',
          animation: 'fadeIn 0.2s ease-in',
        }}>
          <div style={{
            color: C.textSub,
            fontSize: 13,
            lineHeight: 1.5,
            fontStyle: 'italic',
            wordWrap: 'break-word',
          }}>
            {text}
            <span style={{
              display: 'inline-block',
              width: 2,
              height: 16,
              backgroundColor: C.accent,
              marginLeft: 2,
              verticalAlign: 'middle',
              opacity: showCursor ? 1 : 0,
              transition: 'opacity 0.1s',
            }} />
          </div>
          <div style={{
            position: 'absolute',
            top: -6,
            right: 12,
            backgroundColor: C.accent,
            color: 'white',
            fontSize: 9,
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 8,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}>
            LIVE
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInFromBottom {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
