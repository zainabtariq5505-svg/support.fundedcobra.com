'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Plus, ArrowRight, Clock, ChevronRight,
  DollarSign, TrendingUp, CreditCard, Lock, Handshake, HelpCircle,
  Ticket, MessageSquare, Shield, Zap,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { STATUS_META, PRIORITY_META, pill, relativeTime } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Ticket as TicketType } from '@/types/database';

const TOPICS = [
  { icon: DollarSign,  label: 'Payout Support',     slug: 'payout_support',    color: '#22C55E' },
  { icon: TrendingUp,  label: 'Trading Accounts',   slug: 'trading_account',   color: '#60A5FA' },
  { icon: CreditCard,  label: 'Billing & Payments', slug: 'billing_payments',  color: '#A78BFA' },
  { icon: Lock,        label: 'Account Access',     slug: 'account_access',    color: '#FBBF24' },
  { icon: Handshake,   label: 'Partnerships',       slug: 'partnerships',      color: '#FB923C' },
  { icon: HelpCircle,  label: 'General Support',    slug: 'general_support',   color: '#9CA3AF' },
];

export default function SupportHome() {
  const profile           = useProfile();
  const [tickets, setTickets]   = useState<TicketType[]>([]);
  const [ticketsLoading, setTL] = useState(false);
  const [search, setSearch]     = useState('');
  const [searchFocused, setSF]  = useState(false);

  useEffect(() => {
    if (!profile || !isSupabaseConfigured()) return;
    setTL(true);
    const sb = createClient();
    sb.from('tickets')
      .select('*')
      .eq('customer_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setTickets(data ?? []); setTL(false); });
  }, [profile?.id]);

  const isLoggedIn = !!profile && profile !== null;
  const name       = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? '';

  const filtered = TOPICS.filter(t =>
    !search ||
    t.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F1117',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }}>
      <TopBar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div style={{
        backgroundColor: '#161B2E',
        borderBottom: '1px solid #1F2537',
        padding: '56px 24px',
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
          {isLoggedIn ? (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: '#F1F1F3', marginBottom: 10, letterSpacing: '-0.02em' }}>
                Welcome back, {name}
              </h1>
              <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 28 }}>
                How can we help you today?
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 32, fontWeight: 700, color: '#F1F1F3', marginBottom: 12, letterSpacing: '-0.02em', lineHeight: 1.25 }}>
                Funded Cobra Support
              </h1>
              <p style={{ fontSize: 15, color: '#6B7280', marginBottom: 28, maxWidth: 440, margin: '0 auto 28px' }}>
                Get help from our expert team. Submit a ticket, track its status, and get a resolution fast.
              </p>
            </>
          )}

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            maxWidth: 500, margin: '0 auto 24px',
            backgroundColor: '#0F1117',
            border: `1px solid ${searchFocused ? '#7B61FF' : '#1F2537'}`,
            borderRadius: 10, padding: '11px 16px',
            transition: 'border-color .15s',
          }}>
            <Search size={15} color={searchFocused ? '#7B61FF' : '#4B5563'} style={{ flexShrink: 0, transition: 'color .15s' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSF(true)} onBlur={() => setSF(false)}
              placeholder="Search support topics…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F1F1F3', fontSize: 14, fontFamily: 'inherit' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4B5563', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={isLoggedIn ? '/dashboard/new-ticket' : '/signup'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: '#7B61FF', color: '#fff', padding: '11px 22px', borderRadius: 8, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'background .15s' }}
              onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#6D52F5'}
              onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#7B61FF'}
            >
              <Plus size={14} />
              {isLoggedIn ? 'Open New Ticket' : 'Get Support'}
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: '#1E2436', border: '1px solid #2A3350', color: '#D1D5DB', padding: '11px 22px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'background .15s' }}
                onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#242C42'}
                onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#1E2436'}
              >
                My Tickets
              </Link>
            ) : (
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: '#1E2436', border: '1px solid #2A3350', color: '#D1D5DB', padding: '11px 22px', borderRadius: 8, fontSize: 14, fontWeight: 500, textDecoration: 'none', transition: 'background .15s' }}
                onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#242C42'}
                onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#1E2436'}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main ─────────────────────────────────────────────── */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Recent tickets */}
        {isLoggedIn && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F1F1F3' }}>Recent Tickets</h2>
              <Link href="/dashboard/tickets" style={{ fontSize: 13, color: '#7B61FF', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ChevronRight size={13} />
              </Link>
            </div>

            {ticketsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {[1,2,3].map(i => <div key={i} style={{ height: 64, backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 8, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 10, padding: '36px 24px', textAlign: 'center' }}>
                <Ticket size={28} color="#374151" style={{ margin: '0 auto 12px', display: 'block' }} />
                <p style={{ fontSize: 14, color: '#6B7280', marginBottom: 16 }}>No tickets yet. Open one whenever you need help.</p>
                <Link href="/dashboard/new-ticket" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#7B61FF', color: '#fff', padding: '9px 18px', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  <Plus size={13} /> Open a Ticket
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tickets.map(t => {
                  const st = STATUS_META[t.status] ?? STATUS_META.open;
                  const pr = PRIORITY_META[t.priority] ?? PRIORITY_META.normal;
                  return (
                    <Link key={t.id} href={`/dashboard/tickets/${t.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 8, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#2A3350'; d.style.backgroundColor = '#1A2034'; }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#1F2537'; d.style.backgroundColor = '#161B2E'; }}
                      >
                        <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: st.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#7B61FF', fontWeight: 700 }}>{t.ticket_number}</span>
                            <span style={pill(st.color, st.bg)}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />
                              {st.label}
                            </span>
                            <span style={pill(pr.color, pr.bg)}>{pr.label}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#D1D5DB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Clock size={11} color="#374151" />
                          <span style={{ fontSize: 12, color: '#374151' }}>{relativeTime(t.updated_at)}</span>
                          <ArrowRight size={13} color="#2A3350" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Support topics */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F1F1F3' }}>Support Topics</h2>
            {search && (
              <button onClick={() => setSearch('')} style={{ fontSize: 13, color: '#7B61FF', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Clear filter
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 8, padding: '32px', textAlign: 'center', color: '#6B7280', fontSize: 14 }}>
              No topics match "{search}".
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 8 }}>
              {filtered.map(({ icon: Icon, label, slug, color }) => (
                <Link key={slug} href={`/dashboard/new-ticket?cat=${slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '15px 16px', backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 8, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
                    onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#2A3350'; d.style.backgroundColor = '#1A2034'; }}
                    onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = '#1F2537'; d.style.backgroundColor = '#161B2E'; }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: `${color}14`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={16} color={color} />
                    </div>
                    <span style={{ fontSize: 14, color: '#D1D5DB', fontWeight: 500, flex: 1 }}>{label}</span>
                    <ArrowRight size={14} color="#2A3350" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Guest — sign in prompt */}
        {!isLoggedIn && profile !== undefined && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 10, padding: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: '#F1F1F3', marginBottom: 6 }}>Track your existing tickets</h3>
                <p style={{ fontSize: 14, color: '#6B7280' }}>Sign in to see your open requests and reply to our team.</p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#7B61FF', color: '#fff', padding: '10px 20px', borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
                <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#1E2436', border: '1px solid #2A3350', color: '#D1D5DB', padding: '10px 20px', borderRadius: 7, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  Create Account
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Why us — only for guests */}
        {!isLoggedIn && (
          <section>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: '#F1F1F3', marginBottom: 14 }}>Why traders choose us</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 8 }}>
              {[
                { icon: Zap,           title: '< 2h responses',    desc: 'Most tickets answered within two hours.' },
                { icon: MessageSquare, title: 'Real-time chat',    desc: 'Live typing, read receipts, and file sharing.' },
                { icon: Shield,        title: 'Fully encrypted',   desc: 'Your data and conversations stay private.' },
                { icon: Clock,         title: '24 / 7 coverage',   desc: 'Support available around the clock.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ backgroundColor: '#161B2E', border: '1px solid #1F2537', borderRadius: 8, padding: '18px 16px' }}>
                  <Icon size={18} color="#7B61FF" style={{ marginBottom: 10 }} />
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F1F3', marginBottom: 5 }}>{title}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{desc}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #1F2537', backgroundColor: '#0F1117', padding: '20px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#374151' }}>© 2026 Funded Cobra. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Terms', 'Privacy'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 12, color: '#374151', textDecoration: 'none' }}
                onMouseEnter={(e: any) => e.target.style.color = '#6B7280'}
                onMouseLeave={(e: any) => e.target.style.color = '#374151'}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
      `}</style>
    </div>
  );
}
