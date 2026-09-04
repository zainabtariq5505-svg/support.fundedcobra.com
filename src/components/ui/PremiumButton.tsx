import { ReactNode, CSSProperties } from 'react';
import { C } from '@/lib/ds';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface PremiumButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: CSSProperties;
  className?: string;
}

export default function PremiumButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  className,
}: PremiumButtonProps) {
  
  const getVariantStyles = (): CSSProperties => {
    const base = {
      border: 'none',
      borderRadius: 8,
      cursor: disabled || loading ? 'not-allowed' : 'pointer',
      fontWeight: 600,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden',
      opacity: disabled ? 0.5 : 1,
      width: fullWidth ? '100%' : 'auto',
    };

    const sizes = {
      sm: { padding: '6px 12px', fontSize: 12 },
      md: { padding: '10px 20px', fontSize: 14 },
      lg: { padding: '14px 28px', fontSize: 16 },
    };

    const variants = {
      primary: {
        background: `linear-gradient(135deg, ${C.accent}, ${C.accentHover})`,
        color: 'white',
        boxShadow: '0 2px 8px rgba(124, 58, 237, 0.3)',
      },
      secondary: {
        background: C.surface2,
        color: C.text,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      },
      danger: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
      },
      ghost: {
        background: 'transparent',
        color: C.textSub,
        border: 'none',
      },
      success: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
      },
    };

    return { ...base, ...sizes[size], ...variants[variant] };
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const btn = e.currentTarget;
    
    if (variant === 'primary') {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 20px rgba(124, 58, 237, 0.4)';
    } else if (variant === 'danger') {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
    } else if (variant === 'success') {
      btn.style.transform = 'translateY(-2px)';
      btn.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
    } else if (variant === 'secondary') {
      btn.style.transform = 'translateY(-1px)';
      btn.style.backgroundColor = C.surface3;
    } else if (variant === 'ghost') {
      btn.style.backgroundColor = C.surface2;
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const btn = e.currentTarget;
    btn.style.transform = 'translateY(0)';
    
    if (variant === 'primary') {
      btn.style.boxShadow = '0 2px 8px rgba(124, 58, 237, 0.3)';
    } else if (variant === 'danger') {
      btn.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.3)';
    } else if (variant === 'success') {
      btn.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.3)';
    } else if (variant === 'secondary') {
      btn.style.backgroundColor = C.surface2;
    } else if (variant === 'ghost') {
      btn.style.backgroundColor = 'transparent';
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const btn = e.currentTarget;
    btn.style.transform = 'scale(0.98)';
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;
    const btn = e.currentTarget;
    btn.style.transform = variant === 'ghost' ? 'scale(1)' : 'translateY(-2px)';
    
    // Ripple effect
    const ripple = document.createElement('span');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
    ripple.style.pointerEvents = 'none';
    ripple.style.animation = 'ripple 0.6s ease-out';
    
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  return (
    <>
      <button
        onClick={disabled || loading ? undefined : onClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ ...getVariantStyles(), ...style }}
        className={className}
        disabled={disabled || loading}
      >
        {loading && <Loader2 size={size === 'sm' ? 14 : 16} className="spin" />}
        {!loading && icon}
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </button>

      <style>{`
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
