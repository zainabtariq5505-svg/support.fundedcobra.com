// ── Funded Cobra Design System ────────────────────────────────────
// Uses CSS variables so dark/light mode works automatically.
// Variables are set in globals.css on [data-theme="dark"|"light"]

export const C = {
  // Backgrounds
  bg:           'var(--bg)',
  surface:      'var(--surface)',
  surface2:     'var(--surface2)',
  surface3:     'var(--surface3)',
  // Borders
  border:       'var(--border)',
  border2:      'var(--border2)',
  // Text
  text:         'var(--text)',
  textSub:      'var(--text-sub)',
  textMuted:    'var(--text-muted)',
  // Accent (purple)
  accent:       'var(--accent)',
  accentHi:     'var(--accent-hi)',
  accentDeep:   'var(--accent-deep)',
  accentDim:    'var(--accent-dim)',
  accentBorder: 'var(--accent-border)',
  // Semantic
  danger:       '#E53E3E',
  dangerDim:    'rgba(229,62,62,0.1)',
  warn:         '#D69E2E',
  warnDim:      'rgba(214,158,46,0.1)',
  success:      '#38A169',
  successDim:   'rgba(56,161,105,0.1)',
  info:         '#3182CE',
  infoDim:      'rgba(49,130,206,0.1)',
} as const;

// ── Status metadata ────────────────────────────────────────────────
export const STATUS_META: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  open:                 { label: 'Open',                 color: '#93C5FD', bg: 'rgba(147,197,253,0.08)', dot: '#93C5FD' },
  in_progress:          { label: 'In Progress',          color: '#FCD34D', bg: 'rgba(252,211,77,0.08)',  dot: '#FCD34D' },
  waiting_for_customer: { label: 'Waiting for Customer', color: '#FB923C', bg: 'rgba(251,146,60,0.08)',  dot: '#FB923C' },
  waiting_for_staff:    { label: 'Waiting for Staff',    color: '#C084FC', bg: 'rgba(192,132,252,0.08)', dot: '#C084FC' },
  waiting_customer:     { label: 'Waiting for Customer', color: '#FB923C', bg: 'rgba(251,146,60,0.08)',  dot: '#FB923C' },
  waiting_staff:        { label: 'Waiting for Staff',    color: '#C084FC', bg: 'rgba(192,132,252,0.08)', dot: '#C084FC' },
  resolved:             { label: 'Resolved',             color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  dot: '#4ADE80' },
  closed:               { label: 'Closed',               color: '#6B7280', bg: 'rgba(107,114,128,0.08)', dot: '#6B7280' },
};

export const PRIORITY_META: Record<string, { label: string; color: string; bg: string }> = {
  low:    { label: 'Low',    color: '#6B7280', bg: 'rgba(107,114,128,0.08)' },
  normal: { label: 'Normal', color: '#60A5FA', bg: 'rgba(96,165,250,0.08)'  },
  high:   { label: 'High',   color: '#FCD34D', bg: 'rgba(252,211,77,0.08)'  },
  urgent: { label: 'Urgent', color: '#F87171', bg: 'rgba(248,113,113,0.08)' },
};

// ── Style helpers ──────────────────────────────────────────────────
export const pill = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '2px 8px', borderRadius: 4,
  fontSize: 11, fontWeight: 500, letterSpacing: '0.02em',
  color, backgroundColor: bg, whiteSpace: 'nowrap',
});

export const input: React.CSSProperties = {
  width: '100%', backgroundColor: 'var(--surface3)',
  border: `1px solid var(--border)`, borderRadius: 6,
  padding: '9px 12px', color: 'var(--text)', fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

export const label: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--text-sub)', marginBottom: 5, display: 'block',
};

export const btn = {
  primary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: 'var(--accent)', color: '#fff', border: 'none',
    padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none', transition: 'background 0.15s',
  } as React.CSSProperties,
  secondary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: 'var(--surface2)', color: 'var(--text)', border: `1px solid var(--border)`,
    padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none',
  } as React.CSSProperties,
  ghost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'transparent', color: 'var(--text-sub)', border: 'none',
    padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
  } as React.CSSProperties,
  danger: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'rgba(229,62,62,0.1)', color: '#E53E3E',
    border: `1px solid rgba(229,62,62,0.25)`,
    padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer',
  } as React.CSSProperties,
  discord: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#5865F2', color: '#fff', border: 'none',
    padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none',
  } as React.CSSProperties,
};

export function relativeTime(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
