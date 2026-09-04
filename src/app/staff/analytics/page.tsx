'use client';
import { useState, useEffect, useCallback } from 'react';
import { Loader2, BarChart2, TrendingUp, Users, Ticket, CheckCircle2, Clock, RefreshCw, Star, MessageSquare, ThumbsUp } from 'lucide-react';
import { C, STATUS_META, PRIORITY_META, pill, initials, fmtDate, relativeTime } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

// ── Types ─────────────────────────────────────────────────────────
interface StaffStat {
  id:             string;
  name:           string;
  email:          string;
  role:           string;
  total:          number;
  resolved:       number;
  active:         number;
  resolvedToday:  number;
  resolvedWeek:   number;
  resolutionRate: number; // (resolved / total) * 100
}

interface Overview {
  total:            number;
  open:             number;
  in_progress:      number;
  waiting_customer: number;
  waiting_staff:    number;
  resolved:         number;
  closed:           number;
  urgent:           number;
  resolvedToday:    number;
  resolvedWeek:     number;
}

interface CategoryCount { category: string; count: number }

interface RatingEntry {
  id: string;
  rating: number;
  feedback: string | null;
  created_at: string;
  ticket_number: string;
  ticket_subject: string;
  customer_name: string;
  customer_email: string;
}

// ── Date helpers ──────────────────────────────────────────────────
const startOfDay  = () => { const d = new Date(); d.setHours(0,0,0,0); return d.toISOString(); };
const startOfWeek = () => {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0,0,0,0);
  return d.toISOString();
};

// ── Bar component ─────────────────────────────────────────────────
function Bar({ value, max, color, width = '100%' }: { value: number; max: number; color: string; width?: string }) {
  return (
    <div style={{ height: 4, backgroundColor: C.surface3, borderRadius: 2, overflow: 'hidden', width }}>
      <div style={{
        height: '100%',
        width: max > 0 ? `${Math.round((value / max) * 100)}%` : '0%',
        backgroundColor: color, borderRadius: 2, transition: 'width 0.4s ease',
      }} />
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, sub }: {
  label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string;
}) {
  return (
    <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, backgroundColor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 500, color: C.text }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [overview, setOverview]     = useState<Overview | null>(null);
  const [byCategory, setByCategory] = useState<CategoryCount[]>([]);
  const [staffStats, setStaffStats] = useState<StaffStat[]>([]);
  const [ratings, setRatings]       = useState<RatingEntry[]>([]);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return; }
    setLoading(true);
    const sb = createClient();

    const todayISO = startOfDay();
    const weekISO  = startOfWeek();

    // ── Fetch all tickets (status, priority, category, assigned_to, resolved_at)
    const { data: tickets, error } = await sb
      .from('tickets')
      .select('id,status,priority,category,assigned_to,resolved_at,created_at');

    if (error || !tickets) { setLoading(false); return; }

    // ── Overview counts ────────────────────────────────────────────
    const ov: Overview = {
      total:            tickets.length,
      open:             tickets.filter(t => t.status === 'open').length,
      in_progress:      tickets.filter(t => t.status === 'in_progress').length,
      waiting_customer: tickets.filter(t => t.status === 'waiting_for_customer').length,
      waiting_staff:    tickets.filter(t => t.status === 'waiting_for_staff').length,
      resolved:         tickets.filter(t => t.status === 'resolved').length,
      closed:           tickets.filter(t => t.status === 'closed').length,
      urgent:           tickets.filter(t => t.priority === 'urgent' && !['resolved','closed'].includes(t.status)).length,
      // Fix: use resolved_at for "resolved today/this week", not created_at
      resolvedToday:    tickets.filter(t => t.status === 'resolved' && t.resolved_at && t.resolved_at >= todayISO).length,
      resolvedWeek:     tickets.filter(t => t.status === 'resolved' && t.resolved_at && t.resolved_at >= weekISO).length,
    };
    setOverview(ov);

    // ── By category ────────────────────────────────────────────────
    const catMap: Record<string, number> = {};
    for (const t of tickets) catMap[t.category] = (catMap[t.category] ?? 0) + 1;
    setByCategory(
      Object.entries(catMap)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
    );

    // ── Staff performance ──────────────────────────────────────────
    const { data: staffProfiles } = await sb
      .from('profiles')
      .select('id,full_name,email,role')
      .in('role', ['support_agent','finance','partnership_manager','admin']);

    if (staffProfiles) {
      const rows: StaffStat[] = staffProfiles.map(sp => {
        const assigned = tickets.filter(t => t.assigned_to === sp.id);
        const resolved = assigned.filter(t => t.status === 'resolved');
        const active   = assigned.filter(t => !['resolved','closed'].includes(t.status));
        const rToday   = assigned.filter(t => t.status === 'resolved' && t.resolved_at && t.resolved_at >= todayISO);
        const rWeek    = assigned.filter(t => t.status === 'resolved' && t.resolved_at && t.resolved_at >= weekISO);
        return {
          id:             sp.id,
          name:           sp.full_name ?? sp.email ?? sp.id,
          email:          sp.email ?? '',
          role:           sp.role,
          total:          assigned.length,
          resolved:       resolved.length,
          active:         active.length,
          resolvedToday:  rToday.length,
          resolvedWeek:   rWeek.length,
          resolutionRate: assigned.length > 0
            ? Math.round((resolved.length / assigned.length) * 100)
            : 0,
        };
      })
      .filter(s => s.total > 0)
      .sort((a, b) => b.resolved - a.resolved || b.resolutionRate - a.resolutionRate);
      setStaffStats(rows);
    }

    // ── Ratings & Feedback ─────────────────────────────────────────
    const { data: ratingsData } = await sb
      .from('customer_ratings')
      .select(`
        id,
        rating,
        feedback,
        created_at,
        ticket:tickets!ticket_id (
          ticket_number,
          subject
        ),
        customer:profiles!customer_id (
          full_name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (ratingsData) {
      setRatings(ratingsData.map((r: any) => ({
        id:              r.id,
        rating:          r.rating,
        feedback:        r.feedback,
        created_at:      r.created_at,
        ticket_number:   r.ticket?.ticket_number ?? '—',
        ticket_subject:  r.ticket?.subject ?? '—',
        customer_name:   r.customer?.full_name ?? r.customer?.email ?? 'Unknown',
        customer_email:  r.customer?.email ?? '',
      })));
    }

    setLastUpdated(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Not configured ─────────────────────────────────────────────
  if (!isSupabaseConfigured()) return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '48px', textAlign: 'center' }}>
        <BarChart2 size={32} color={C.textMuted} style={{ margin: '0 auto 12px', display: 'block' }} />
        <p style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>Supabase not configured</p>
        <p style={{ fontSize: 13, color: C.textMuted }}>Add your credentials to .env.local to enable analytics.</p>
      </div>
    </div>
  );

  // ── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // ── Empty ──────────────────────────────────────────────────────
  if (!overview || overview.total === 0) return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 24 }}>Analytics</h1>
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '64px 24px', textAlign: 'center' }}>
        <BarChart2 size={36} color={C.textMuted} style={{ margin: '0 auto 14px', display: 'block' }} />
        <p style={{ fontSize: 15, fontWeight: 600, color: C.text, marginBottom: 6 }}>No data yet</p>
        <p style={{ fontSize: 13, color: C.textMuted }}>Analytics will appear once tickets are created and assigned.</p>
      </div>
    </div>
  );

  const maxCategory = Math.max(...byCategory.map(c => c.count), 1);
  const maxStaff    = Math.max(...staffStats.map(s => s.total), 1);

  const roleLabel: Record<string, string> = {
    admin: 'Admin', support_agent: 'Support', finance: 'Finance', partnership_manager: 'Partnerships',
  };

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>Analytics</h1>
          <p style={{ fontSize: 13, color: C.textSub }}>
            Calculated from live Supabase data
            {lastUpdated && <span style={{ color: C.textMuted }}> · Last updated {lastUpdated.toLocaleTimeString()}</span>}
          </p>
        </div>
        <button onClick={load} style={{
          display: 'flex', alignItems: 'center', gap: 6,
          backgroundColor: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 6, padding: '7px 14px', color: C.textSub, fontSize: 12, cursor: 'pointer',
        }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* ── Overview cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatCard label="Total Tickets"    value={overview.total}         icon={<Ticket size={16} />}       color="#93C5FD" />
        <StatCard label="Open"             value={overview.open}          icon={<BarChart2 size={16} />}    color="#93C5FD" sub={`${overview.in_progress} in progress`} />
        <StatCard label="Resolved Total"   value={overview.resolved}      icon={<CheckCircle2 size={16} />} color="#4ADE80" sub={`${overview.closed} closed`} />
        <StatCard label="Urgent Active"    value={overview.urgent}        icon={<TrendingUp size={16} />}   color="#F87171" sub="Needs attention" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <StatCard label="Resolved Today"   value={overview.resolvedToday} icon={<Clock size={16} />}        color="#4ADE80" sub="Based on resolved_at" />
        <StatCard label="Resolved This Week" value={overview.resolvedWeek} icon={<TrendingUp size={16} />} color="#A855F7" />
        <StatCard label="Waiting (Customer)" value={overview.waiting_customer} icon={<Users size={16} />}  color="#FB923C" />
        <StatCard label="Waiting (Staff)"  value={overview.waiting_staff} icon={<Users size={16} />}        color="#C084FC" />
      </div>

      {/* ── Two-column: Category + Status ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>

        {/* By category */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Tickets by Category
          </h2>
          {byCategory.length === 0 ? (
            <p style={{ fontSize: 13, color: C.textMuted }}>No category data yet.</p>
          ) : byCategory.map(({ category, count }) => (
            <div key={category} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 12, color: C.text }}>{category}</span>
                <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 600 }}>{count}</span>
              </div>
              <Bar value={count} max={maxCategory} color={C.accent} />
            </div>
          ))}
        </div>

        {/* By status */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '18px 20px' }}>
          <h2 style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Tickets by Status
          </h2>
          {/* Only show canonical 6 status keys */}
          {(['open','in_progress','waiting_for_customer','waiting_for_staff','resolved','closed'] as const).map(key => {
            const meta  = STATUS_META[key];
            const count = (overview as any)[key === 'in_progress' ? 'in_progress' : key === 'waiting_for_customer' ? 'waiting_customer' : key === 'waiting_for_staff' ? 'waiting_staff' : key] ??
              // fallback: direct lookup from overview object by canonical key
              ({ open: overview.open, in_progress: overview.in_progress, waiting_for_customer: overview.waiting_customer, waiting_for_staff: overview.waiting_staff, resolved: overview.resolved, closed: overview.closed }[key] ?? 0);
            return (
              <div key={key} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', backgroundColor: C.surface3, borderRadius: 5, marginBottom: 4,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: meta.dot, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, color: C.text }}>{meta.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Bar value={count} max={overview.total} color={meta.dot} width="60px" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.text, minWidth: 24, textAlign: 'right' }}>{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Staff Performance Leaderboard ── */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Staff Performance</h2>
            <p style={{ fontSize: 11, color: C.textMuted }}>
              Resolution Rate = (Resolved ÷ Total Assigned) × 100
            </p>
          </div>
          <div style={{ fontSize: 11, color: C.textMuted }}>{staffStats.length} staff member{staffStats.length !== 1 ? 's' : ''}</div>
        </div>

        {staffStats.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Users size={28} color={C.textMuted} style={{ margin: '0 auto 10px', display: 'block' }} />
            <p style={{ fontSize: 13, color: C.textMuted }}>No staff with assigned tickets yet.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 88px 88px 88px 88px 88px 100px',
              gap: 10, padding: '8px 20px',
              backgroundColor: C.surface2,
            }}>
              {['Staff Member','Assigned','Resolved','Active','Today','This Week','Resolution Rate'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Table rows */}
            {staffStats.map((s, rank) => {
              const rateColor = s.resolutionRate >= 80 ? '#4ADE80' : s.resolutionRate >= 50 ? '#FCD34D' : '#F87171';
              return (
                <div key={s.id} style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 88px 88px 88px 88px 88px 100px',
                  gap: 10, alignItems: 'center',
                  padding: '12px 20px',
                  borderBottom: rank < staffStats.length - 1 ? `1px solid ${C.border}` : 'none',
                  backgroundColor: rank === 0 ? 'rgba(139,92,246,0.03)' : 'transparent',
                }}>
                  {/* Member */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Rank badge */}
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      backgroundColor: rank === 0 ? 'rgba(252,211,77,0.15)' : C.surface3,
                      border: `1px solid ${rank === 0 ? 'rgba(252,211,77,0.3)' : C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700,
                      color: rank === 0 ? '#FCD34D' : C.textMuted,
                    }}>
                      {rank + 1}
                    </div>
                    {/* Avatar */}
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg,#6D28D9,#A855F7)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 700, color: '#fff',
                    }}>
                      {initials(s.name)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {s.name}
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted, textTransform: 'capitalize' }}>
                        {roleLabel[s.role] ?? s.role}
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{s.total}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#4ADE80' }}>{s.resolved}</span>
                  <span style={{ fontSize: 13, color: s.active > 0 ? '#FCD34D' : C.textMuted }}>{s.active}</span>
                  <span style={{ fontSize: 13, color: s.resolvedToday > 0 ? '#4ADE80' : C.textMuted }}>{s.resolvedToday}</span>
                  <span style={{ fontSize: 13, color: s.resolvedWeek > 0 ? '#A855F7' : C.textMuted }}>{s.resolvedWeek}</span>

                  {/* Resolution rate */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: rateColor }}>{s.resolutionRate}%</span>
                    </div>
                    <Bar value={s.resolutionRate} max={100} color={rateColor} />
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* ── Ratings & Feedback ── */}
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginTop: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, background: 'linear-gradient(90deg, rgba(109,40,217,0.06) 0%, transparent 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star size={16} color="#f59e0b" />
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 2 }}>Customer Ratings & Feedback</h2>
              <p style={{ fontSize: 11, color: C.textMuted }}>Submitted after ticket closure</p>
            </div>
          </div>
          {/* Summary stats */}
          {ratings.length > 0 && (() => {
            const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
            const dist = [1,2,3,4,5].map(n => ({ star: n, count: ratings.filter(r => r.rating === n).length }));
            const starColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                {/* Average */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#f59e0b', lineHeight: 1 }}>{avg.toFixed(1)}</div>
                  <div style={{ display: 'flex', gap: 2, justifyContent: 'center', margin: '3px 0' }}>
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} size={10} fill={i <= Math.round(avg) ? '#f59e0b' : 'none'} color={i <= Math.round(avg) ? '#f59e0b' : C.border} />
                    ))}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted }}>{ratings.length} rating{ratings.length !== 1 ? 's' : ''}</div>
                </div>
                {/* Distribution bars */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {[5,4,3,2,1].map(n => {
                    const c = ratings.filter(r => r.rating === n).length;
                    const pct = ratings.length > 0 ? (c / ratings.length) * 100 : 0;
                    return (
                      <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 10, color: C.textMuted, width: 8 }}>{n}</span>
                        <Star size={9} fill={starColors[n]} color={starColors[n]} />
                        <div style={{ width: 80, height: 5, backgroundColor: C.surface3, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: starColors[n], borderRadius: 3, transition: 'width 0.4s' }} />
                        </div>
                        <span style={{ fontSize: 10, color: C.textMuted, width: 20 }}>{c}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {ratings.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <Star size={32} color={C.textMuted} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 14, color: C.text, marginBottom: 4 }}>No ratings yet</p>
            <p style={{ fontSize: 12, color: C.textMuted }}>Ratings appear after customers close and rate their tickets.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr 160px 80px 1fr 110px', gap: 12, padding: '8px 20px', backgroundColor: C.surface2 }}>
              {['Ticket', 'Subject', 'Customer', 'Rating', 'Feedback', 'Date'].map(h => (
                <span key={h} style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
              ))}
            </div>

            {/* Rows */}
            {ratings.map((r, i) => {
              const starColor = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][r.rating];
              const starLabel = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][r.rating];
              return (
                <div
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '100px 1fr 160px 80px 1fr 110px',
                    gap: 12,
                    alignItems: 'center',
                    padding: '12px 20px',
                    borderBottom: i < ratings.length - 1 ? `1px solid ${C.border}` : 'none',
                    backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(109,40,217,0.04)'}
                  onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)'}
                >
                  {/* Ticket number */}
                  <span style={{ fontSize: 11, fontWeight: 700, color: C.accentHi, fontFamily: 'monospace' }}>{r.ticket_number}</span>

                  {/* Subject */}
                  <span style={{ fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.ticket_subject}</span>

                  {/* Customer */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(135deg,#6D28D9,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                      {r.customer_name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.customer_name}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.customer_email}</div>
                    </div>
                  </div>

                  {/* Star rating */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={12} fill={n <= r.rating ? starColor : 'none'} color={n <= r.rating ? starColor : C.border} />
                      ))}
                    </div>
                    <span style={{ fontSize: 10, color: starColor, fontWeight: 600 }}>{starLabel}</span>
                  </div>

                  {/* Feedback */}
                  {r.feedback ? (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                      <MessageSquare size={12} color={C.textMuted} style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ fontSize: 12, color: C.textSub, fontStyle: 'italic', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                        "{r.feedback}"
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>No feedback</span>
                  )}

                  {/* Date */}
                  <div>
                    <div style={{ fontSize: 11, color: C.text }}>{fmtDate(r.created_at)}</div>
                    <div style={{ fontSize: 10, color: C.textMuted }}>{relativeTime(r.created_at)}</div>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
