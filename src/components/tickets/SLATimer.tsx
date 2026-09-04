import { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';
import { C } from '@/lib/ds';

const SLA_TIMES = {
  urgent: 1 * 60 * 60 * 1000, // 1 hour
  high: 4 * 60 * 60 * 1000, // 4 hours
  normal: 24 * 60 * 60 * 1000, // 24 hours
  low: 48 * 60 * 60 * 1000, // 48 hours
};

export default function SLATimer({ 
  createdAt, 
  priority = 'normal',
  status 
}: { 
  createdAt: string; 
  priority?: 'urgent' | 'high' | 'normal' | 'low';
  status: string;
}) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [percentage, setPercentage] = useState(100);

  useEffect(() => {
    if (status === 'resolved' || status === 'closed') return;

    const slaTime = SLA_TIMES[priority];
    const created = new Date(createdAt).getTime();
    
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - created;
      const remaining = slaTime - elapsed;
      
      setTimeLeft(remaining);
      setPercentage(Math.max(0, (remaining / slaTime) * 100));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [createdAt, priority, status]);

  if (status === 'resolved' || status === 'closed') {
    return null;
  }

  const isBreached = timeLeft <= 0;
  const isCritical = percentage < 20;
  const isWarning = percentage < 50;

  const formatTime = (ms: number) => {
    if (ms <= 0) return 'SLA BREACHED!';
    
    const hours = Math.floor(ms / (60 * 60 * 1000));
    const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((ms % (60 * 1000)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getColor = () => {
    if (isBreached) return '#ef4444';
    if (isCritical) return '#f97316';
    if (isWarning) return '#eab308';
    return '#10b981';
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '8px 12px',
      backgroundColor: isBreached ? 'rgba(239, 68, 68, 0.1)' : C.surface2,
      border: `1px solid ${isBreached ? '#ef4444' : C.border}`,
      borderRadius: 6,
    }}>
      {isBreached ? (
        <AlertTriangle size={16} color="#ef4444" />
      ) : (
        <Clock size={16} color={getColor()} />
      )}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: 11,
          color: C.textMuted,
          marginBottom: 2,
        }}>
          SLA {isBreached ? 'Breach' : 'Response Time'}
        </div>
        <div style={{
          fontSize: 13,
          fontWeight: 600,
          color: getColor(),
        }}>
          {formatTime(timeLeft)}
        </div>
      </div>
      <div style={{
        width: 40,
        height: 40,
        position: 'relative',
      }}>
        <svg width="40" height="40" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={C.border}
            strokeWidth="3"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={getColor()}
            strokeWidth="3"
            strokeDasharray={`${2 * Math.PI * 16}`}
            strokeDashoffset={`${2 * Math.PI * 16 * (1 - percentage / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          color: getColor(),
        }}>
          {Math.round(percentage)}%
        </div>
      </div>
    </div>
  );
}
