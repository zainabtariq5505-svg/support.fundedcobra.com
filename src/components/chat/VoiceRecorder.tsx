import { useState, useRef } from 'react';
import { Mic, Square, Send, X } from 'lucide-react';
import { C } from '@/lib/ds';

export default function VoiceRecorder({ onSend }: { onSend: (audioBlob: Blob) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Update duration timer
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    chunksRef.current = [];
    setDuration(0);
  };

  const sendRecording = () => {
    if (chunksRef.current.length > 0) {
      const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
      onSend(audioBlob);
      stopRecording();
      chunksRef.current = [];
      setDuration(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isRecording) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        backgroundColor: C.surface2,
        borderRadius: 8,
        border: `1px solid ${C.accent}`,
      }}>
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: '#ef4444',
          animation: 'pulse 1.5s infinite',
        }} />
        <span style={{ color: C.text, fontSize: 14, flex: 1 }}>
          Recording... {formatDuration(duration)}
        </span>
        <button
          onClick={sendRecording}
          style={{
            border: 'none',
            background: C.accent,
            color: 'white',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Send size={16} />
          Send
        </button>
        <button
          onClick={cancelRecording}
          style={{
            border: 'none',
            background: 'transparent',
            color: C.textMuted,
            cursor: 'pointer',
            padding: 6,
          }}
        >
          <X size={18} />
        </button>
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <button
      onClick={startRecording}
      style={{
        border: `1px solid ${C.border}`,
        background: 'transparent',
        borderRadius: 6,
        padding: 8,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        color: C.textSub,
      }}
      title="Record voice message"
    >
      <Mic size={18} />
    </button>
  );
}
