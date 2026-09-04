// ── Funded Cobra Design System ────────────────────────────────────
// Brand: Black base, purple (#A855F7 / #7C3AED) accent, white text

export const C = {
  bg:           '#060608',
  surface:      '#0E0E12',
  surface2:     '#141418',
  surface3:     '#1C1C22',
  border:       '#2A2A35',
  border2:      '#363642',
  text:         '#F2F2F5',
  textSub:      '#9090A0',
  textMuted:    '#52525F',
  accent:       '#8B5CF6',
  accentHi:     '#A855F7',
  accentDeep:   '#6D28D9',
  accentDim:    'rgba(139,92,246,0.12)',
  accentBorder: 'rgba(139,92,246,0.28)',
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
  open:                 { label: 'Open',                  color: '#93C5FD', bg: 'rgba(147,197,253,0.08)', dot: '#93C5FD' },
  in_progress:          { label: 'In Progress',           color: '#FCD34D', bg: 'rgba(252,211,77,0.08)',  dot: '#FCD34D' },
  waiting_for_customer: { label: 'Waiting for Customer',  color: '#FB923C', bg: 'rgba(251,146,60,0.08)',  dot: '#FB923C' },
  waiting_for_staff:    { label: 'Waiting for Staff',     color: '#C084FC', bg: 'rgba(192,132,252,0.08)', dot: '#C084FC' },
  waiting_customer:     { label: 'Waiting for Customer',  color: '#FB923C', bg: 'rgba(251,146,60,0.08)',  dot: '#FB923C' },
  waiting_staff:        { label: 'Waiting for Staff',     color: '#C084FC', bg: 'rgba(192,132,252,0.08)', dot: '#C084FC' },
  resolved:             { label: 'Resolved',              color: '#4ADE80', bg: 'rgba(74,222,128,0.08)',  dot: '#4ADE80' },
  closed:               { label: 'Closed',                color: '#6B7280', bg: 'rgba(107,114,128,0.08)', dot: '#6B7280' },
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
  width: '100%', backgroundColor: C.surface3,
  border: `1px solid ${C.border}`, borderRadius: 6,
  padding: '9px 12px', color: C.text, fontSize: 14,
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

export const label: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block',
};

export const btn = {
  primary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: C.accent, color: '#fff', border: 'none',
    padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600,
    cursor: 'pointer', textDecoration: 'none', transition: 'background 0.15s',
  } as React.CSSProperties,
  secondary: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: C.surface2, color: C.text, border: `1px solid ${C.border}`,
    padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500,
    cursor: 'pointer', textDecoration: 'none',
  } as React.CSSProperties,
  ghost: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: 'transparent', color: C.textSub, border: 'none',
    padding: '6px 10px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
  } as React.CSSProperties,
  danger: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: C.dangerDim, color: C.danger,
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

/** Relative time formatter */
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

/** Format date for display */
export function fmtDate(ts: string): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Initials from name */
export function initials(name: string | null | undefined): string {
  if (!name) return '?';
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
