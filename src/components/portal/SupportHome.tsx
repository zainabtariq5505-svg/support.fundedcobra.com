'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Plus, ArrowRight,
  DollarSign, TrendingUp, CreditCard, Lock, Handshake, HelpCircle,
  Clock, Ticket,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { C, STATUS_META, pill, relativeTime } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Ticket as TicketType } from '@/types/database';

const topics = [
  { icon: DollarSign,  label: 'Payouts',          href: '/dashboard/new-ticket?cat=payout_support',   color: '#4ADE80' },
  { icon: TrendingUp,  label: 'Trading Accounts',  href: '/dashboard/new-ticket?cat=trading_account',  color: '#93C5FD' },
  { icon: CreditCard,  label: 'Payments',          href: '/dashboard/new-ticket?cat=billing_payments', color: '#C084FC' },
  { icon: Lock,        label: 'Account Access',    href: '/dashboard/new-ticket?cat=account_access',   color: '#FCD34D' },
  { icon: Handshake,   label: 'Partnerships',      href: '/dashboard/new-ticket?cat=partnerships',     color: '#FB923C' },
  { icon: HelpCircle,  label: 'General',           href: '/dashboard/new-ticket?cat=general_support',  color: '#9CA3AF' },
];

export default function SupportHome() {
  const profile = useProfile(); // undefined=loading, null=guest, Profile=authed
  const [tickets, setTickets]     = useState<TicketType[]>([]);
  const [ticketsLoading, setTL]   = useState(false);
  const [search, setSearch]       = useState('');

  // Load tickets only once we know the user is logged in
  useEffect(() => {
    if (!profile || !isSupabaseConfigured()) return;
    setTL(true);
    const sb = createClient();
    sb.from('tickets')
      .select('*')
      .eq('customer_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(4)
      .then(({ data }) => { setTickets(data ?? []); setTL(false); });
  }, [profile?.id]);

  const name = profile?.full_name ?? profile?.email ?? '';
  const isLoggedIn = !!profile && profile !== null;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      {/* TopBar renders immediately — no blank screen */}
      <TopBar />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '44px 24px' }}>

        {/* ── Greeting ── */}
        <div style={{ marginBottom: 32 }}>
          {/* Show name once loaded, otherwise show generic welcome */}
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 4, letterSpacing: '-0.02em' }}>
            {profile === undefined
              ? 'Welcome to Funded Cobra Support'
              : isLoggedIn
                ? <>Welcome back, <span style={{ color: C.accentHi }}>{name.split(' ')[0] || name}</span></>
                : 'Welcome to Funded Cobra Support'}
          </h1>
          <p style={{ color: C.textSub, fontSize: 14 }}>
            {isLoggedIn
              ? 'How can we help you today?'
              : 'Sign in to manage your support tickets, or browse the topics below to open a request.'}
          </p>
        </div>

        {/* ── Search ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          backgroundColor: C.surface, border: `1px solid ${C.border}`,
          borderRadius: 8, padding: '11px 14px', marginBottom: 28,
        }}>
          <Search size={15} color={C.textMuted} style={{ flexShrink: 0 }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 14 }}
            placeholder="Search your tickets or support topics…"
          />
        </div>

        {/* ── Quick actions ── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 40, flexWrap: 'wrap' }}>
          <Link href={isLoggedIn ? '/dashboard/new-ticket' : '/login'} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            backgroundColor: C.accent, color: '#fff',
            padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}>
            <Plus size={14} /> Open a Ticket
          </Link>
          {isLoggedIn && (
            <Link href="/dashboard/tickets" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text,
              padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none',
            }}>
              View All Tickets
            </Link>
          )}
          {!isLoggedIn && profile !== undefined && (
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              backgroundColor: C.surface, border: `1px solid ${C.border}`, color: C.text,
              padding: '9px 18px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none',
            }}>
              Sign In
            </Link>
          )}
        </div>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 28, alignItems: 'start' }}>

          {/* LEFT — Recent tickets (logged-in) OR Sign-in prompt (guest) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h2 style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                {isLoggedIn ? 'Recent Tickets' : 'Get Support'}
              </h2>
              {isLoggedIn && (
                <Link href="/dashboard/tickets" style={{ fontSize: 12, color: C.accentHi, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
                  View all <ArrowRight size={12} />
                </Link>
              )}
            </div>

            {/* Guest: show feature cards instead of blank */}
            {!isLoggedIn && profile !== undefined && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {[
                  { icon: '🎫', title: 'Track Your Tickets', desc: 'Sign in to view all your open and resolved support requests in one place.' },
                  { icon: '⚡', title: 'Fast Response Times', desc: 'Our team responds within 2 hours on average for all submitted tickets.' },
                  { icon: '🔒', title: 'Secure & Private', desc: 'Your account data and conversations are fully encrypted and private.' },
                ].map(f => (
                  <div key={f.title} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px',
                    backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
                    marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 22, flexShrink: 0 }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{f.title}</div>
                      <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
                <Link href="/login" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  marginTop: 8, padding: '11px',
                  backgroundColor: C.accent, color: '#fff',
                  borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                }}>
                  Sign in to view your tickets
                </Link>
              </div>
            )}

            {/* Loading skeleton while useProfile is resolving */}
            {profile === undefined && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: 64, backgroundColor: C.surface, border: `1px solid ${C.border}`,
                    borderRadius: 7, animation: 'pulse 1.5s ease-in-out infinite',
                    animationDelay: `${i * 0.1}s`,
                  }} />
                ))}
              </div>
            )}

            {/* Logged in: show tickets or empty state */}
            {isLoggedIn && (
              ticketsLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ height: 64, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 7, animation: 'pulse 1.5s ease-in-out infinite' }} />
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div style={{
                  backgroundColor: C.surface, border: `1px solid ${C.border}`,
                  borderRadius: 10, padding: '40px 24px', textAlign: 'center',
                }}>
                  <Ticket size={32} color={C.textMuted} style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text, marginBottom: 6 }}>No support requests yet</p>
                  <p style={{ fontSize: 13, color: C.textMuted, marginBottom: 18 }}>
                    Create a ticket whenever you need help from our team.
                  </p>
                  <Link href="/dashboard/new-ticket" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    backgroundColor: C.accent, color: '#fff',
                    padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                  }}>
                    <Plus size={13} /> Open a Ticket
                  </Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {tickets.map(t => {
                    const st = STATUS_META[t.status] ?? STATUS_META['open'];
                    return (
                      <Link key={t.id} href={`/dashboard/tickets/${t.id}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                          backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 7,
                        }}>
                          <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: st.dot, flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.accentHi, fontWeight: 700 }}>
                                {t.ticket_number}
                              </span>
                              <span style={pill(st.color, st.bg)}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />
                                {st.label}
                              </span>
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 500, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {t.subject}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                            <Clock size={11} color={C.textMuted} />
                            <span style={{ fontSize: 11, color: C.textMuted }}>{relativeTime(t.updated_at)}</span>
                          </div>
                          <ArrowRight size={13} color={C.border2} />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )
            )}
          </div>

          {/* RIGHT — Topics (always visible) */}
          <div>
            <h2 style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12 }}>
              Support Topics
            </h2>
            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              {topics.map(({ icon: Icon, label, href, color }, i) => (
                <Link key={label} href={href} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px',
                  textDecoration: 'none', color: C.text,
                  borderBottom: i < topics.length - 1 ? `1px solid ${C.border}` : 'none',
                }}>
                  <Icon size={14} color={color} style={{ flexShrink: 0 }} />
                  <span style={{ fontSize: 13, flex: 1 }}>{label}</span>
                  <ArrowRight size={12} color={C.border2} />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </div>
  );
}
