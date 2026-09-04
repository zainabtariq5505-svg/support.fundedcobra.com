'use client';
import Image from 'next/image';
import { useState } from 'react';

interface FCLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animated?: boolean;
}

const heights: Record<string, number> = {
  sm: 30,
  md: 40,
  lg: 54,
  xl: 80,
};

export default function FCLogo({ size = 'md', animated = true }: FCLogoProps) {
  const [imgError, setImgError] = useState(false);
  const h = heights[size];
  const iconSize = h * 0.85;

  const logoMark = (
    <div style={{
      width: iconSize,
      height: iconSize,
      borderRadius: iconSize * 0.22,
      background: 'linear-gradient(135deg, #1a0035 0%, #2d006e 50%, #1a0035 100%)',
      border: '1.5px solid rgba(168, 85, 247, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      flexShrink: 0,
      boxShadow: animated
        ? '0 0 16px rgba(124,58,237,0.5), 0 0 32px rgba(124,58,237,0.2)'
        : '0 0 8px rgba(124,58,237,0.3)',
      animation: animated ? 'logoPulse 3s ease-in-out infinite' : undefined,
    }}>
      {/* Glow ring */}
      {animated && (
        <div style={{
          position: 'absolute',
          inset: -3,
          borderRadius: iconSize * 0.27,
          border: '1px solid rgba(168,85,247,0.3)',
          animation: 'ringPulse 3s ease-in-out infinite',
        }} />
      )}

      {/* Cobra SVG */}
      <svg width={iconSize * 0.72} height={iconSize * 0.72} viewBox="0 0 40 40" fill="none">
        {/* Hood left */}
        <path d="M6 29 C5 18 12 8 20 6 C20 6 17 14 14 19 C11 24 8 27 6 29Z" fill="#7C3AED" />
        {/* Hood right */}
        <path d="M34 29 C35 18 28 8 20 6 C20 6 23 14 26 19 C29 24 32 27 34 29Z" fill="#7C3AED" />
        {/* Body */}
        <ellipse cx="20" cy="26" rx="10" ry="12" fill="#8B5CF6" />
        {/* Face */}
        <ellipse cx="20" cy="22" rx="7" ry="6" fill="#A855F7" />
        {/* Hood shimmer */}
        <path d="M8 26 C7 17 13 9 20 7 C19 10 16 15 14 20 C12 23 10 25 8 26Z" fill="rgba(196,132,251,0.25)" />
        <path d="M32 26 C33 17 27 9 20 7 C21 10 24 15 26 20 C28 23 30 25 32 26Z" fill="rgba(196,132,251,0.25)" />
        {/* Eyes */}
        <ellipse cx="16.5" cy="22" rx="2.5" ry="2.8" fill="#0a0020" />
        <ellipse cx="23.5" cy="22" rx="2.5" ry="2.8" fill="#0a0020" />
        {/* Pupils glow */}
        <ellipse cx="16.5" cy="22" rx="1.4" ry="1.6" fill="#C084FC" />
        <ellipse cx="23.5" cy="22" rx="1.4" ry="1.6" fill="#C084FC" />
        {/* Eye shine */}
        <circle cx="15.8" cy="21.2" r="0.5" fill="white" opacity="0.8" />
        <circle cx="22.8" cy="21.2" r="0.5" fill="white" opacity="0.8" />
        {/* Fangs */}
        <path d="M17 30 L15.5 35 L17.5 32 L18 35 L19.5 30Z" fill="white" opacity="0.9" />
        <path d="M23 30 L24.5 35 L22.5 32 L22 35 L20.5 30Z" fill="white" opacity="0.9" />
        {/* Scale pattern */}
        <path d="M17 18 Q20 16 23 18" stroke="rgba(196,132,251,0.4)" strokeWidth="0.8" fill="none" />
        <path d="M15 21 Q16 19.5 18 21" stroke="rgba(196,132,251,0.4)" strokeWidth="0.6" fill="none" />
        <path d="M22 21 Q24 19.5 25 21" stroke="rgba(196,132,251,0.4)" strokeWidth="0.6" fill="none" />
      </svg>
    </div>
  );

  const textMark = (
    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, gap: 1 }}>
      <span style={{
        fontWeight: 900,
        fontSize: h * 0.38,
        color: '#ffffff',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        lineHeight: 1,
      }}>
        FUNDED
      </span>
      <span style={{
        fontWeight: 900,
        fontSize: h * 0.42,
        background: 'linear-gradient(90deg, #A855F7, #C084FC, #A855F7)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        lineHeight: 1,
        animation: animated ? 'shimmerText 3s linear infinite' : undefined,
      }}>
        COBRA
      </span>
    </div>
  );

  return (
    <>
      {imgError ? (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {logoMark}
          {textMark}
        </div>
      ) : (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
          position: 'relative',
        }}>
          {/* Glow behind image logo */}
          {animated && (
            <div style={{
              position: 'absolute',
              inset: -8,
              background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)',
              borderRadius: 12,
              animation: 'logoPulse 3s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
          )}
          <Image
            src="/logo/logo.png"
            alt="Funded Cobra"
            width={h * 3}
            height={h}
            onError={() => setImgError(true)}
            style={{
              objectFit: 'contain',
              height: h,
              width: 'auto',
              position: 'relative',
              zIndex: 1,
              filter: animated
                ? 'drop-shadow(0 0 8px rgba(168,85,247,0.6)) drop-shadow(0 0 16px rgba(124,58,237,0.3))'
                : 'none',
            }}
            priority
          />
        </div>
      )}

      <style>{`
        @keyframes logoPulse {
          0%, 100% {
            box-shadow: 0 0 16px rgba(124,58,237,0.5), 0 0 32px rgba(124,58,237,0.2);
            opacity: 1;
          }
          50% {
            box-shadow: 0 0 24px rgba(168,85,247,0.7), 0 0 48px rgba(124,58,237,0.35);
            opacity: 0.95;
          }
        }
        @keyframes ringPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.04); }
        }
        @keyframes shimmerText {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </>
  );
}
