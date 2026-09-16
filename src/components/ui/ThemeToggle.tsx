'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/theme';

export default function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { theme, toggle } = useTheme();
  const dim = size === 'sm' ? 28 : 32;
  const iconSize = size === 'sm' ? 13 : 15;

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        width: dim,
        height: dim,
        borderRadius: 7,
        border: `1px solid var(--border)`,
        backgroundColor: 'transparent',
        color: 'var(--text-sub)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'var(--surface3)';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-border)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-hi)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-sub)';
      }}
    >
      <div style={{
        position: 'absolute',
        transition: 'opacity 0.2s, transform 0.2s',
        opacity: theme === 'dark' ? 1 : 0,
        transform: theme === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
      }}>
        <Moon size={iconSize} />
      </div>
      <div style={{
        position: 'absolute',
        transition: 'opacity 0.2s, transform 0.2s',
        opacity: theme === 'light' ? 1 : 0,
        transform: theme === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
      }}>
        <Sun size={iconSize} />
      </div>
    </button>
  );
}
