import { ReactNode, CSSProperties } from 'react';
import { C } from '@/lib/ds';

interface PremiumInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password' | 'textarea';
  icon?: ReactNode;
  rows?: number;
  disabled?: boolean;
  error?: string;
  label?: string;
  style?: CSSProperties;
}

export default function PremiumInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
  rows = 3,
  disabled = false,
  error,
  label,
  style,
}: PremiumInputProps) {
  
  const baseStyle: CSSProperties = {
    width: '100%',
    padding: icon ? '12px 12px 12px 44px' : '12px 16px',
    fontSize: 14,
    color: C.text,
    backgroundColor: C.surface,
    border: `2px solid ${error ? '#ef4444' : C.border}`,
    borderRadius: 8,
    outline: 'none',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    fontFamily: 'inherit',
    resize: type === 'textarea' ? 'vertical' as const : undefined,
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = C.accent;
    e.currentTarget.style.boxShadow = `0 0 0 3px rgba(124, 58, 237, 0.1)`;
    e.currentTarget.style.transform = 'translateY(-1px)';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = error ? '#ef4444' : C.border;
    e.currentTarget.style.boxShadow = 'none';
    e.currentTarget.style.transform = 'translateY(0)';
  };

  return (
    <div style={{ position: 'relative', ...style }}>
      {label && (
        <label style={{
          display: 'block',
          fontSize: 13,
          fontWeight: 600,
          color: C.text,
          marginBottom: 8,
        }}>
          {label}
        </label>
      )}
      
      {icon && (
        <div style={{
          position: 'absolute',
          left: 14,
          top: label ? 46 : 14,
          color: C.textMuted,
          pointerEvents: 'none',
          transition: 'color 0.2s',
        }}>
          {icon}
        </div>
      )}

      {type === 'textarea' ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          style={baseStyle}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={baseStyle}
        />
      )}

      {error && (
        <div style={{
          fontSize: 12,
          color: '#ef4444',
          marginTop: 6,
          animation: 'slideDown 0.2s ease-out',
        }}>
          {error}
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
