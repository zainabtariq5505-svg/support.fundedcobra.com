'use client';
import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Star, Plus, MessageSquare } from 'lucide-react';
import { C } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';

interface TicketClosedCardProps {
  ticketId: string;
  ticketNumber: string;
  closedAt: string;
  existingRating?: number; // if already rated
}

export default function TicketClosedCard({
  ticketId,
  ticketNumber,
  closedAt,
  existingRating,
}: TicketClosedCardProps) {
  const [hovered, setHovered]   = useState(0);
  const [selected, setSelected] = useState(existingRating ?? 0);
  const [submitted, setSubmitted] = useState(!!existingRating);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);

  const handleRate = async (rating: number) => {
    if (submitted || submitting) return;
    setSelected(rating);
    setShowFeedback(true);
  };

  const handleSubmit = async () => {
    if (submitting || !selected) return;
    setSubmitting(true);
    const sb = createClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;

    await sb.from('customer_ratings').upsert({
      ticket_id: ticketId,
      customer_id: user.id,
      rating: selected,
      feedback: feedback.trim() || null,
    }, { onConflict: 'ticket_id' });

    setSubmitted(true);
    setSubmitting(false);
  };

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];
  const starColors = ['', '#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  return (
    <div style={{
      margin: '24px 0',
      display: 'flex',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid rgba(16,185,129,0.25)`,
        boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        animation: 'slideInCard 0.4s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Green top bar */}
        <div style={{
          height: 3,
          background: 'linear-gradient(90deg, #10b981, #34d399, #10b981)',
          backgroundSize: '200% 100%',
          animation: 'shimmerBar 2s linear infinite',
        }} />

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(0,0,0,0) 100%)',
          backgroundColor: C.surface,
          display: 'flex',
          gap: 14,
          alignItems: 'flex-start',
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            backgroundColor: 'rgba(16,185,129,0.12)',
            border: '1px solid rgba(16,185,129,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>
              Ticket {ticketNumber} Closed
            </div>
            <div style={{ fontSize: 13, color: C.textSub, lineHeight: 1.5 }}>
              Our team has resolved your issue. Thank you for contacting Funded Cobra Support!
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, backgroundColor: C.border, margin: '0 24px' }} />

        {/* Rating section */}
        <div style={{
          padding: '16px 24px 20px',
          backgroundColor: C.surface,
        }}>
          {submitted ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              animation: 'fadeIn 0.3s ease-out',
            }}>
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4,5].map(i => (
                  <Star
                    key={i}
                    size={24}
                    fill={i <= selected ? starColors[selected] : 'none'}
                    color={i <= selected ? starColors[selected] : C.border}
                  />
                ))}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#10b981' }}>
                Thanks for your feedback! {selected >= 4 ? '🎉' : '🙏'}
              </div>
              <div style={{ fontSize: 12, color: C.textMuted }}>
                You rated this support experience: <strong style={{ color: starColors[selected] }}>{starLabels[selected]}</strong>
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                fontSize: 13,
                fontWeight: 600,
                color: C.text,
                marginBottom: 12,
                textAlign: 'center',
              }}>
                How was your support experience?
              </div>

              {/* Stars */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                {[1,2,3,4,5].map(i => (
                  <button
                    key={i}
                    onClick={() => handleRate(i)}
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      transition: 'transform 0.15s',
                      transform: hovered >= i || selected >= i ? 'scale(1.15)' : 'scale(1)',
                    }}
                    title={starLabels[i]}
                  >
                    <Star
                      size={28}
                      fill={hovered >= i ? starColors[hovered] : selected >= i ? starColors[selected] : 'none'}
                      color={hovered >= i ? starColors[hovered] : selected >= i ? starColors[selected] : C.border}
                      style={{ transition: 'all 0.15s' }}
                    />
                  </button>
                ))}
              </div>

              {/* Label */}
              {(hovered > 0 || selected > 0) && (
                <div style={{
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: starColors[hovered || selected],
                  marginBottom: 12,
                  animation: 'fadeIn 0.15s ease-out',
                }}>
                  {starLabels[hovered || selected]}
                </div>
              )}

              {/* Optional feedback textarea */}
              {showFeedback && (
                <div style={{ animation: 'slideDown 0.2s ease-out' }}>
                  <textarea
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Any additional feedback? (optional)"
                    rows={2}
                    style={{
                      width: '100%',
                      backgroundColor: C.surface3,
                      border: `1px solid ${C.border}`,
                      borderRadius: 6,
                      padding: '8px 10px',
                      color: C.text,
                      fontSize: 12,
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                      marginBottom: 10,
                      lineHeight: 1.5,
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = C.accentBorder; }}
                    onBlur={e => { e.currentTarget.style.borderColor = C.border; }}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!selected || submitting}
                    style={{
                      width: '100%',
                      padding: '9px',
                      backgroundColor: selected ? '#10b981' : C.surface3,
                      color: selected ? 'white' : C.textMuted,
                      border: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: selected ? 'pointer' : 'default',
                      transition: 'all 0.2s',
                      boxShadow: selected ? '0 2px 8px rgba(16,185,129,0.3)' : 'none',
                    }}
                    onMouseEnter={e => {
                      if (selected) (e.currentTarget).style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget).style.transform = 'translateY(0)';
                    }}
                  >
                    {submitting ? 'Submitting…' : 'Submit Rating'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer — Open New Ticket */}
        <div style={{
          padding: '12px 24px 16px',
          backgroundColor: C.surface2,
          borderTop: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MessageSquare size={13} color={C.textMuted} />
            <span style={{ fontSize: 12, color: C.textMuted }}>
              Need more help?
            </span>
          </div>
          <Link
            href="/dashboard/new-ticket"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              backgroundColor: C.accent,
              color: 'white',
              borderRadius: 6,
              textDecoration: 'none',
              fontSize: 12,
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-1px)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLAnchorElement).style.boxShadow = '0 2px 8px rgba(124,58,237,0.3)';
            }}
          >
            <Plus size={13} />
            Open New Ticket
          </Link>
        </div>
      </div>

      <style>{`
        @keyframes slideInCard {
          from { opacity: 0; transform: translateY(16px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes shimmerBar {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
