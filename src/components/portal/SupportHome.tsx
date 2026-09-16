'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Clock, Plus, Search,
  DollarSign, TrendingUp, CreditCard, Lock, Handshake, HelpCircle,
  Ticket, ChevronRight,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { STATUS_META, PRIORITY_META, pill, relativeTime } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Ticket as TicketType } from '@/types/database';

const TOPICS = [
  { icon: DollarSign,  label: 'Payout Support',     slug: 'payout_support',   desc: 'Payment delays, withdrawals, and verification.' },
  { icon: TrendingUp,  label: 'Trading Accounts',   slug: 'trading_account',  desc: 'MT4/MT5 credentials, account rules, and access.' },
  { icon: CreditCard,  label: 'Billing & Payments', slug: 'billing_payments', desc: 'Purchase issues, charges, and refund requests.'   },
  { icon: Lock,        label: 'Account Access',     slug: 'account_access',   desc: 'Login problems and account lockouts.'            },
  { icon: Handshake,   label: 'Partnerships',       slug: 'partnerships',     desc: 'Affiliate, influencer, and IB inquiries.'        },
  { icon: HelpCircle,  label: 'General Support',    slug: 'general_support',  desc: 'Anything else not covered above.'               },
];

export default function SupportHome() {
  const profile               = useProfile();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [sFocus, setSFocus]   = useState(false);

  useEffect(() => {
    if (!profile || !isSupabaseConfigured()) return;
    setLoading(true);
    const sb = createClient();
    sb.from('tickets')
      .select('*')
      .eq('customer_id', profile.id)
      .order('updated_at', { ascending: false })
      .limit(5)
      .then(({ data }) => { setTickets(data ?? []); setLoading(false); });
  }, [profile?.id]);

  const isLoggedIn = !!profile && profile !== null;
  const name       = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? '';

  const filtered = TOPICS.filter(t =>
    !search ||
    t.label.toLowerCase().includes(search.toLowerCase()) ||
    t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", sans-serif',
      color: '#fff',
    }}>
      <TopBar />

      {/* ── Hero ── */}
      <div style={{ borderBottom: '1px solid #111' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 24px 48px' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 28, fontSize: 13, color: '#333' }}>
            <a href="https://fundedcobra.com" style={{ color: '#333', textDecoration: 'none' }}>fundedcobra.com</a>
            <span>/</span>
            <span style={{ color: '#555' }}>Support</span>
          </div>

          {isLoggedIn ? (
            <>
              <h1 style={{ fontSize: 26, fontWeight: 600, color: '#fff', marginBottom: 8, letterSpacing: '-0.02em' }}>
                Welcome back, {name}.
              </h1>
              <p style={{ fontSize: 15, color: '#555', marginBottom: 28 }}>
                Open a ticket, track an existing request, or pick a topic below.
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 28, fontWeight: 600, color: '#fff', marginBottom: 10, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Funded Cobra Support
              </h1>
              <p style={{ fontSize: 15, color: '#555', marginBottom: 28, maxWidth: 480 }}>
                Get help from our team. Submit a ticket, track its status, and get a resolution fast.
              </p>
            </>
          )}

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            backgroundColor: '#0d0d0d',
            border: `1px solid ${sFocus ? '#4ade80' : '#1a1a1a'}`,
            borderRadius: 7, padding: '10px 14px', maxWidth: 460,
            transition: 'border-color .15s',
          }}>
            <Search size={14} color={sFocus ? '#4ade80' : '#333'} style={{ flexShrink: 0, transition: 'color .15s' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSFocus(true)} onBlur={() => setSFocus(false)}
              placeholder="Search support topics…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#fff', fontSize: 14, fontFamily: 'inherit' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#333', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20, flexWrap: 'wrap' }}>
            <Link
              href={isLoggedIn ? '/dashboard/new-ticket' : '/signup'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: '#4ade80', color: '#000', padding: '10px 20px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none', transition: 'background .15s' }}
              onMouseEnter={(e: any) => e.currentTarget.style.backgroundColor = '#22c55e'}
              onMouseLeave={(e: any) => e.currentTarget.style.backgroundColor = '#4ade80'}
            >
              <Plus size={14} />
              {isLoggedIn ? 'Open New Ticket' : 'Get Support'}
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard/tickets"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: 'transparent', border: '1px solid #1a1a1a', color: '#888', padding: '10px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all .15s' }}
                onMouseEnter={(e: any) => { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.color='#ccc'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.borderColor='#1a1a1a'; e.currentTarget.style.color='#888'; }}
              >
                My Tickets
              </Link>
            ) : (
              <Link href="/login"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 7, backgroundColor: 'transparent', border: '1px solid #1a1a1a', color: '#888', padding: '10px 20px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none', transition: 'all .15s' }}
                onMouseEnter={(e: any) => { e.currentTarget.style.borderColor='#333'; e.currentTarget.style.color='#ccc'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.borderColor='#1a1a1a'; e.currentTarget.style.color='#888'; }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Recent tickets */}
        {isLoggedIn && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: '#ccc', letterSpacing: '0.02em' }}>Recent Tickets</h2>
              <Link href="/dashboard/tickets" style={{ fontSize: 13, color: '#4ade80', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                View all <ChevronRight size={13} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 60, backgroundColor: '#0d0d0d', border: '1px solid #111', borderRadius: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #111', borderRadius: 8, padding: '32px 20px', textAlign: 'center' }}>
                <Ticket size={24} color="#222" style={{ margin: '0 auto 10px', display: 'block' }} />
                <p style={{ fontSize: 14, color: '#444', marginBottom: 14 }}>No tickets yet.</p>
                <Link href="/dashboard/new-ticket" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4ade80', color: '#000', padding: '9px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  <Plus size={13} /> Open a Ticket
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #111', borderRadius: 8, overflow: 'hidden' }}>
                {tickets.map((t, i) => {
                  const st = STATUS_META[t.status] ?? STATUS_META.open;
                  const pr = PRIORITY_META[t.priority] ?? PRIORITY_META.normal;
                  const isLast = i === tickets.length - 1;
                  return (
                    <Link key={t.id} href={`/dashboard/tickets/${t.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', backgroundColor: '#0d0d0d', borderBottom: isLast ? 'none' : '1px solid #111', cursor: 'pointer', transition: 'background .1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#111'}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#0d0d0d'}
                      >
                        <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, backgroundColor: st.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#4ade80', fontWeight: 700 }}>{t.ticket_number}</span>
                            <span style={pill(st.color, `${st.color}14`)}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />
                              {st.label}
                            </span>
                            <span style={pill(pr.color, `${pr.color}14`)}>{pr.label}</span>
                          </div>
                          <div style={{ fontSize: 13, color: '#aaa', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Clock size={11} color="#333" />
                          <span style={{ fontSize: 12, color: '#333' }}>{relativeTime(t.updated_at)}</span>
                          <ArrowRight size={12} color="#222" />
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, color: '#ccc', letterSpacing: '0.02em' }}>Support Topics</h2>
            {search && (
              <button onClick={() => setSearch('')} style={{ fontSize: 13, color: '#4ade80', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                Clear search
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #111', borderRadius: 8, padding: '28px', textAlign: 'center', color: '#444', fontSize: 14 }}>
              No topics match "{search}".
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #111', borderRadius: 8, overflow: 'hidden' }}>
              {filtered.map(({ icon: Icon, label, slug, desc, color }, i) => (
                <Link key={slug} href={`/dashboard/new-ticket?cat=${slug}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', backgroundColor: '#0d0d0d', borderBottom: i < filtered.length - 1 ? '1px solid #111' : 'none', cursor: 'pointer', transition: 'background .1s' }}
                    onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#111'}
                    onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.backgroundColor = '#0d0d0d'}
                  >
                    <Icon size={16} color={color} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, color: '#ddd', fontWeight: 500, marginBottom: 2 }}>{label}</div>
                      <div style={{ fontSize: 12, color: '#444' }}>{desc}</div>
                    </div>
                    <ArrowRight size={14} color="#222" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Sign-in prompt for guests */}
        {!isLoggedIn && profile !== undefined && (
          <section style={{ marginBottom: 48 }}>
            <div style={{ backgroundColor: '#0d0d0d', border: '1px solid #111', borderRadius: 8, padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ddd', marginBottom: 5 }}>Track your existing tickets</div>
                <div style={{ fontSize: 13, color: '#555' }}>Sign in to view and reply to your open support requests.</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: '#4ade80', color: '#000', padding: '9px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
                <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, backgroundColor: 'transparent', border: '1px solid #1a1a1a', color: '#888', padding: '9px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>
                  Create Account
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Stats row */}
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden', border: '1px solid #111' }}>
            {[
              { value: '< 2h',  label: 'Average first response'  },
              { value: '24/7',  label: 'Support availability'     },
              { value: '98%',   label: 'Satisfaction rate'        },
            ].map(s => (
              <div key={s.label} style={{ backgroundColor: '#0d0d0d', padding: '20px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#4ade80', marginBottom: 4, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: '#444' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #111', padding: '18px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#333' }}>© 2026 Funded Cobra.</span>
          <div style={{ display: 'flex', gap: 16 }}>
            {['Terms','Privacy'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}
                onMouseEnter={(e: any) => e.target.style.color = '#555'}
                onMouseLeave={(e: any) => e.target.style.color = '#333'}
              >{l}</Link>
            ))}
            <a href="https://fundedcobra.com" style={{ fontSize: 12, color: '#333', textDecoration: 'none' }}
              onMouseEnter={(e: any) => e.target.style.color = '#555'}
              onMouseLeave={(e: any) => e.target.style.color = '#333'}
            >fundedcobra.com</a>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
