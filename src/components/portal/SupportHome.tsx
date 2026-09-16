'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search, Plus, ArrowRight, Clock, Ticket,
  DollarSign, TrendingUp, CreditCard, Lock, Handshake, HelpCircle,
  MessageSquare, Shield, Zap, CheckCircle2, ChevronRight, Star,
} from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { STATUS_META, PRIORITY_META, pill, relativeTime } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { Ticket as TicketType } from '@/types/database';

const TOPICS = [
  { icon: DollarSign,  label: 'Payout Support',     slug: 'payout_support',    color: '#4ADE80', desc: 'Payment delays & withdrawals' },
  { icon: TrendingUp,  label: 'Trading Accounts',   slug: 'trading_account',   color: '#93C5FD', desc: 'MT4/MT5, rules & credentials'  },
  { icon: CreditCard,  label: 'Billing & Payments', slug: 'billing_payments',  color: '#C084FC', desc: 'Charges, refunds & invoices'    },
  { icon: Lock,        label: 'Account Access',     slug: 'account_access',    color: '#FCD34D', desc: 'Login issues & lockouts'        },
  { icon: Handshake,   label: 'Partnerships',       slug: 'partnerships',      color: '#FB923C', desc: 'Affiliate & IB inquiries'       },
  { icon: HelpCircle,  label: 'General Support',    slug: 'general_support',   color: '#9CA3AF', desc: 'Everything else'                },
];

const STATS = [
  { value: '< 2h',  label: 'Avg First Response' },
  { value: '98%',   label: 'Satisfaction Rate'   },
  { value: '24/7',  label: 'Support Coverage'    },
  { value: '50k+',  label: 'Issues Resolved'     },
];

const FEATURES = [
  { icon: Zap,           title: 'Instant Responses',   desc: 'Our team responds within 2 hours on average, often faster for urgent issues.' },
  { icon: Shield,        title: 'Secure & Private',    desc: 'All communications are encrypted. Your account data is never shared.' },
  { icon: MessageSquare, title: 'Real-Time Chat',      desc: 'Live chat interface with typing indicators, attachments, and read receipts.' },
  { icon: CheckCircle2,  title: 'Full Transparency',   desc: 'Track every status change. Know exactly where your ticket stands.' },
];

export default function SupportHome() {
  const profile = useProfile();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [ticketsLoading, setTL] = useState(false);
  const [search, setSearch]     = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

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
  const name = profile?.full_name?.split(' ')[0] ?? profile?.email?.split('@')[0] ?? '';

  const filteredTopics = TOPICS.filter(t =>
    !search || t.label.toLowerCase().includes(search.toLowerCase()) || t.desc.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#08080F', fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}>
      <TopBar />

      {/* ── HERO ───────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(109,40,217,0.08) 0%, transparent 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: -160, left: '50%', transform: 'translateX(-50%)', width: 800, height: 400, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(109,40,217,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '72px 24px 60px', position: 'relative', zIndex: 1, textAlign: 'center' }}>

          {/* Status badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(74,222,128,0.07)', border: '1px solid rgba(74,222,128,0.15)', borderRadius: 20, padding: '6px 16px', marginBottom: 24 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} />
            <span style={{ fontSize: 12, color: '#4ADE80', fontWeight: 600, letterSpacing: '0.04em' }}>
              All systems operational · Avg response &lt; 2 hours
            </span>
          </div>

          {/* Headline */}
          {isLoggedIn ? (
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 900, color: '#F0F0FF', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 16 }}>
              Welcome back, <span style={{ background: 'linear-gradient(135deg, #A855F7, #C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{name}</span> 👋
            </h1>
          ) : (
            <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#F0F0FF', letterSpacing: '-0.04em', lineHeight: 1.08, marginBottom: 16 }}>
              How can we<br />
              <span style={{ background: 'linear-gradient(135deg, #A855F7, #C084FC, #A855F7)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 4s linear infinite' }}>
                help you today?
              </span>
            </h1>
          )}

          <p style={{ fontSize: 16, color: 'rgba(180,180,210,0.55)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto 36px' }}>
            {isLoggedIn
              ? 'Open a new ticket, track existing requests, or browse support categories below.'
              : 'Expert support for Funded Cobra traders. Fast, secure, and always available.'}
          </p>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            maxWidth: 560, margin: '0 auto 28px',
            backgroundColor: '#0E0E1C',
            border: `1.5px solid ${searchFocus ? 'rgba(168,85,247,0.5)' : '#1A1A2E'}`,
            borderRadius: 14, padding: '13px 18px',
            boxShadow: searchFocus ? '0 0 0 4px rgba(168,85,247,0.07), 0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.3)',
            transition: 'all 0.2s',
          }}>
            <Search size={17} color={searchFocus ? '#A855F7' : '#303050'} style={{ flexShrink: 0, transition: 'color 0.2s' }} />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
              placeholder="Search support topics…"
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#F0F0FF', fontSize: 15, fontFamily: 'inherit' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#303050', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
            )}
          </div>

          {/* CTA buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href={isLoggedIn ? '/dashboard/new-ticket' : '/signup'}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: 'linear-gradient(135deg, #6D28D9, #9333EA)',
                color: '#fff', padding: '13px 28px', borderRadius: 10,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(109,40,217,0.4)',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 28px rgba(109,40,217,0.5)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 20px rgba(109,40,217,0.4)'; }}
            >
              <Plus size={15} />
              {isLoggedIn ? 'Open New Ticket' : 'Get Support Now'}
            </Link>
            {isLoggedIn ? (
              <Link href="/dashboard/tickets" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#C0C0E0', padding: '13px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor='rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'; }}
              >
                My Tickets <ArrowRight size={14} />
              </Link>
            ) : (
              <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#C0C0E0', padding: '13px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={(e: any) => { e.currentTarget.style.backgroundColor='rgba(255,255,255,0.07)'; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.backgroundColor='rgba(255,255,255,0.04)'; }}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 0, justifyContent: 'center', maxWidth: 600, margin: '48px auto 0', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, overflow: 'hidden' }}>
            {STATS.map((s, i) => (
              <div key={s.label} style={{ flex: 1, padding: '18px 12px', textAlign: 'center', borderRight: i < STATS.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#A855F7', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#404060', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>

        {/* Recent tickets (logged-in only) */}
        {isLoggedIn && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#F0F0FF', letterSpacing: '-0.02em' }}>
                Your Recent Tickets
              </h2>
              <Link href="/dashboard/tickets" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#A855F7', textDecoration: 'none', fontWeight: 600 }}>
                View all <ChevronRight size={14} />
              </Link>
            </div>

            {ticketsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[1,2,3].map(i => (
                  <div key={i} style={{ height: 72, backgroundColor: '#0E0E1C', border: '1px solid #1A1A2E', borderRadius: 10, animation: 'pulse 1.5s ease-in-out infinite' }} />
                ))}
              </div>
            ) : tickets.length === 0 ? (
              <div style={{ backgroundColor: '#0E0E1C', border: '1px solid #1A1A2E', borderRadius: 14, padding: '48px 24px', textAlign: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Ticket size={22} color="#6D28D9" />
                </div>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#F0F0FF', marginBottom: 8 }}>No support requests yet</p>
                <p style={{ fontSize: 13, color: '#404060', marginBottom: 20 }}>
                  Create a ticket whenever you need help from our team.
                </p>
                <Link href="/dashboard/new-ticket" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#6D28D9,#9333EA)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 16px rgba(109,40,217,0.35)' }}>
                  <Plus size={14} /> Open a Ticket
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {tickets.map(t => {
                  const st = STATUS_META[t.status] ?? STATUS_META.open;
                  const pr = PRIORITY_META[t.priority] ?? PRIORITY_META.normal;
                  return (
                    <Link key={t.id} href={`/dashboard/tickets/${t.id}`} style={{ textDecoration: 'none' }}>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', backgroundColor: '#0E0E1C', border: '1px solid #1A1A2E', borderRadius: 10, transition: 'all 0.15s', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor='rgba(168,85,247,0.3)'; (e.currentTarget as HTMLDivElement).style.backgroundColor='#111120'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor='#1A1A2E'; (e.currentTarget as HTMLDivElement).style.backgroundColor='#0E0E1C'; }}
                      >
                        <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 2, backgroundColor: st.dot, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#7C3AED', fontWeight: 700 }}>{t.ticket_number}</span>
                            <span style={pill(st.color, st.bg)}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', backgroundColor: st.dot, display: 'inline-block' }} />
                              {st.label}
                            </span>
                            <span style={pill(pr.color, pr.bg)}>{pr.label}</span>
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: '#D0D0E8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.subject}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                          <Clock size={12} color="#303050" />
                          <span style={{ fontSize: 12, color: '#303050' }}>{relativeTime(t.updated_at)}</span>
                          <ChevronRight size={14} color="#252540" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Support categories */}
        <div style={{ marginBottom: 56 }}>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F0F0FF', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Browse Support Topics
            </h2>
            <p style={{ fontSize: 14, color: '#404060' }}>Select the area that matches your issue for faster routing.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
            {filteredTopics.map(({ icon: Icon, label, slug, color, desc }) => (
              <Link
                key={slug}
                href={`/dashboard/new-ticket?cat=${slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', backgroundColor: '#0E0E1C', border: '1px solid #1A1A2E', borderRadius: 12, cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor=`${color}40`; d.style.backgroundColor='#111120'; d.style.transform='translateY(-2px)'; d.style.boxShadow=`0 8px 24px rgba(0,0,0,0.25)`; }}
                  onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor='#1A1A2E'; d.style.backgroundColor='#0E0E1C'; d.style.transform='translateY(0)'; d.style.boxShadow='none'; }}
                >
                  <div style={{ width: 42, height: 42, borderRadius: 10, backgroundColor: `${color}12`, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon size={18} color={color} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#E0E0F0', marginBottom: 3 }}>{label}</div>
                    <div style={{ fontSize: 12, color: '#404060' }}>{desc}</div>
                  </div>
                  <ArrowRight size={15} color="#252540" style={{ flexShrink: 0 }} />
                </div>
              </Link>
            ))}
          </div>

          {filteredTopics.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#404060', fontSize: 14 }}>
              No topics match "<strong>{search}</strong>". Try a different search.
            </div>
          )}
        </div>

        {/* Why choose us (guest only) */}
        {!isLoggedIn && (
          <div style={{ marginBottom: 56 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#F0F0FF', letterSpacing: '-0.03em', marginBottom: 8 }}>
                Why traders trust us
              </h2>
              <p style={{ fontSize: 14, color: '#404060' }}>Built specifically for prop trading firms and their clients.</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {FEATURES.map(({ icon: Icon, title, desc }) => (
                <div key={title} style={{ backgroundColor: '#0E0E1C', border: '1px solid #1A1A2E', borderRadius: 12, padding: '24px 22px' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <Icon size={18} color="#A855F7" />
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#E0E0F0', marginBottom: 8 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#404060', lineHeight: 1.65 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA banner (guest only) */}
        {!isLoggedIn && profile !== undefined && (
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, #0D0B22 0%, #130F30 50%, #0A0818 100%)',
            border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: 16, padding: '48px 40px',
            textAlign: 'center',
          }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'linear-gradient(rgba(139,92,246,1) 1px, transparent 1px), linear-gradient(90deg, rgba(139,92,246,1) 1px, transparent 1px)', backgroundSize: '32px 32px', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 400, height: 200, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(109,40,217,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginBottom: 16 }}>
                {[1,2,3,4,5].map(i => <Star key={i} size={16} fill="#FCD34D" color="#FCD34D" />)}
              </div>
              <h3 style={{ fontSize: 26, fontWeight: 900, color: '#F0F0FF', letterSpacing: '-0.03em', marginBottom: 12 }}>
                Ready to get help?
              </h3>
              <p style={{ fontSize: 15, color: 'rgba(180,180,210,0.55)', marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                Join thousands of funded traders who trust Funded Cobra Support for fast, expert assistance.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/signup" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#6D28D9,#9333EA)', color: '#fff', padding: '13px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 20px rgba(109,40,217,0.4)' }}>
                  Create Free Account <ArrowRight size={15} />
                </Link>
                <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#C0C0E0', padding: '13px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────── */}
      <footer style={{ borderTop: '1px solid #111120', backgroundColor: '#08080F', padding: '28px 24px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: 'linear-gradient(135deg,#6D28D9,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 40 40" fill="none">
                <path d="M6 29 C5 18 12 8 20 6 C20 6 17 14 14 19 C11 24 8 27 6 29Z" fill="rgba(255,255,255,0.9)" />
                <path d="M34 29 C35 18 28 8 20 6 C20 6 23 14 26 19 C29 24 32 27 34 29Z" fill="rgba(255,255,255,0.9)" />
                <ellipse cx="20" cy="26" rx="10" ry="11" fill="white" />
                <ellipse cx="16.5" cy="23" rx="2.2" ry="2.5" fill="#6D28D9" />
                <ellipse cx="23.5" cy="23" rx="2.2" ry="2.5" fill="#6D28D9" />
              </svg>
            </div>
            <span style={{ fontSize: 13, color: '#303050' }}>
              © 2026 Funded Cobra Support Portal. All rights reserved.
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Terms', 'Privacy', 'Status'].map(l => (
              <Link key={l} href={`/${l.toLowerCase()}`} style={{ fontSize: 12, color: '#303050', textDecoration: 'none', transition: 'color .15s' }}
                onMouseEnter={(e: any) => e.target.style.color='#6060A0'}
                onMouseLeave={(e: any) => e.target.style.color='#303050'}
              >
                {l}
              </Link>
            ))}
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer { 0%{background-position:0% 50%} 100%{background-position:200% 50%} }
        input::placeholder { color: #252535; }
      `}</style>
    </div>
  );
}
