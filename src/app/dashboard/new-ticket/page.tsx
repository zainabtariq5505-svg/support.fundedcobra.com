'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, DollarSign, TrendingUp, CreditCard, Lock, Handshake, HelpCircle, Paperclip, X, CheckCircle, Loader2 } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { C, btn, input } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';

const CATS = [
  { slug: 'payout_support',   icon: DollarSign,  title: 'Payout Support',     desc: 'Payout status, delays, or payment verification.' },
  { slug: 'trading_account',  icon: TrendingUp,  title: 'Trading Account',    desc: 'Credentials, account rules, or MT5/MT4 issues.' },
  { slug: 'billing_payments', icon: CreditCard,  title: 'Billing & Payments', desc: 'Purchase failures, charges, or refund requests.' },
  { slug: 'account_access',   icon: Lock,        title: 'Account Access',     desc: 'Login problems or account locked issues.' },
  { slug: 'partnerships',     icon: Handshake,   title: 'Partnerships',       desc: 'Affiliate, influencer, or IB inquiries.' },
  { slug: 'general_support',  icon: HelpCircle,  title: 'General Support',    desc: 'Anything else not covered above.' },
];

const LANGUAGES = [
  {
    code:    'en',
    name:    'English',
    native:  'English',
    flag:    '🇬🇧',
    desc:    'Support in English language',
    agents:  'Available 24/7',
  },
  {
    code:    'ur',
    name:    'Urdu / Hindi',
    native:  'اردو / हिंदी',
    flag:    '🇵🇰',
    desc:    'اردو یا ہندی میں سپورٹ',
    agents:  'Available Mon–Fri',
  },
  {
    code:    'ar',
    name:    'Arabic',
    native:  'العربية',
    flag:    '🇸🇦',
    desc:    'الدعم باللغة العربية',
    agents:  'Available Mon–Fri',
  },
];

function NewTicketPageInner() {
  const router  = useRouter();
  const params  = useSearchParams();
  const profile = useProfile();

  // Step -1 = language, 0 = category, 1 = details, 2 = review, 3 = success
  const [step, setStep]           = useState<-1 | 0 | 1 | 2 | 3>(-1);
  const [language, setLanguage]   = useState('');
  const [cat, setCat]             = useState(params.get('cat') ?? '');
  const [files, setFiles]         = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [error, setError]         = useState('');
  const [form, setForm]           = useState({
    subject: '', accountId: '', orderId: '', transactionId: '',
    priority: 'normal', description: '',
  });
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) { setError('You must be logged in to create a ticket.'); return; }
    setError('');
    setSubmitting(true);
    const sb = createClient();

    const { data: ticket, error: err } = await sb.from('tickets').insert({
      customer_id:    profile.id,
      subject:        form.subject,
      description:    form.description,
      category:       CATS.find(c => c.slug === cat)?.title ?? cat,
      priority:       form.priority,
      account_id:     form.accountId     || null,
      order_id:       form.orderId       || null,
      transaction_id: form.transactionId || null,
      status:         'open',
      // Store the preferred language in metadata via subject prefix or account_id field
      // We'll tag the ticket description with language preference
    }).select().single();

    if (err || !ticket) {
      setError(err?.message ?? 'Failed to create ticket. Please try again.');
      setSubmitting(false);
      return;
    }

    const langMeta = LANGUAGES.find(l => l.code === language);

    // Insert opening message with language tag
    const langNote = langMeta
      ? `🌐 **Language Preference:** ${langMeta.flag} ${langMeta.name} (${langMeta.native})\n\n`
      : '';

    await sb.from('ticket_messages').insert({
      ticket_id:   ticket.id,
      sender_id:   profile.id,
      message:     langNote + form.description,
      is_internal: false,
    });

    // Also save language as internal note so staff can see it clearly
    if (langMeta) {
      await sb.from('internal_notes').insert({
        ticket_id: ticket.id,
        staff_id:  profile.id,
        note:      `🌐 Customer prefers support in: ${langMeta.flag} ${langMeta.name} (${langMeta.native}) — ${langMeta.agents}`,
      });
    }

    // Handle file uploads
    if (files.length > 0) {
      for (const file of files) {
        const path = `${ticket.id}/${Date.now()}-${file.name}`;
        const { data: upload } = await sb.storage.from('ticket-attachments').upload(path, file);
        if (upload) {
          const { data: { publicUrl } } = sb.storage.from('ticket-attachments').getPublicUrl(path);
          await sb.from('ticket_attachments').insert({
            ticket_id: ticket.id, uploaded_by: profile.id,
            file_name: file.name, file_url: publicUrl,
            file_type: file.type, file_size: file.size,
          });
        }
      }
    }

    setCreatedId(ticket.id);

    // Discord webhook
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('fc_staff_settings') : null;
      const webhookUrl = stored ? JSON.parse(stored).webhookUrl : null;
      if (webhookUrl && webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
        const categoryTitle = CATS.find(c => c.slug === cat)?.title ?? cat;
        const priorityEmoji: Record<string, string> = { low: '🟢', normal: '🔵', high: '🟠', urgent: '🔴' };
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            embeds: [{
              title: '🎫 New Support Ticket',
              color: form.priority === 'urgent' ? 0xE53E3E : form.priority === 'high' ? 0xD69E2E : 0x8B5CF6,
              fields: [
                { name: 'Ticket',    value: `\`${ticket.ticket_number}\``, inline: true },
                { name: 'Category',  value: categoryTitle,                  inline: true },
                { name: 'Priority',  value: `${priorityEmoji[form.priority] ?? '🔵'} ${form.priority}`, inline: true },
                { name: 'Language',  value: langMeta ? `${langMeta.flag} ${langMeta.name}` : 'English', inline: true },
                { name: 'Customer',  value: profile.full_name ?? profile.email ?? 'Unknown', inline: true },
                { name: 'Subject',   value: form.subject, inline: false },
              ],
              footer: { text: 'Funded Cobra Support Portal' },
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      }
    } catch { /* silent */ }

    setSubmitting(false);
    setStep(3);
  };

  // ── Step labels ──────────────────────────────────────────────────
  const stepLabels = ['Language', 'Category', 'Details', 'Review'];
  const currentStepIdx = step === -1 ? 0 : step + 1; // language = 0, cat = 1, etc.

  // ── Success ──────────────────────────────────────────────────────
  if (step === 3 && createdId) {
    const langMeta = LANGUAGES.find(l => l.code === language);
    return (
      <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
        <TopBar />
        <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Ticket Submitted!</h1>
          <p style={{ color: C.textSub, fontSize: 14, marginBottom: 16 }}>
            Your ticket has been received. Our team will respond in{' '}
            <strong style={{ color: C.accentHi }}>{langMeta?.name ?? 'English'}</strong>.
          </p>
          {langMeta && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`,
              borderRadius: 8, padding: '8px 16px', marginBottom: 24,
              fontSize: 13, color: C.accentHi,
            }}>
              {langMeta.flag} {langMeta.name} support — {langMeta.agents}
            </div>
          )}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <Link href={`/dashboard/tickets/${createdId}`} style={{ ...btn.primary, textDecoration: 'none' }}>
              View Ticket
            </Link>
            <Link href="/dashboard/tickets" style={{ ...btn.secondary, textDecoration: 'none' }}>
              All Tickets
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textMuted, fontSize: 12, marginBottom: 28, textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Back
        </Link>

        {/* Progress steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36, overflowX: 'auto' }}>
          {stepLabels.map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700,
                  backgroundColor: i < currentStepIdx ? C.accent : i === currentStepIdx ? C.accent : C.surface3,
                  color: i <= currentStepIdx ? '#fff' : C.textMuted,
                  border: `1px solid ${i <= currentStepIdx ? C.accent : C.border}`,
                  transition: 'all 0.2s',
                }}>
                  {i < currentStepIdx ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 12, color: i === currentStepIdx ? C.text : C.textMuted, fontWeight: i === currentStepIdx ? 600 : 400 }}>
                  {s}
                </span>
              </div>
              {i < stepLabels.length - 1 && (
                <div style={{ width: 20, height: 1, backgroundColor: i < currentStepIdx ? C.accent : C.border, transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>
            {error}
          </div>
        )}

        {/* ── Step -1: Language Selection ─────────────────────────── */}
        {step === -1 && (
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, marginBottom: 6 }}>
              Welcome to Support 👋
            </h1>
            <p style={{ color: C.textSub, fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              Which language would you like your support agent to communicate in?
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    width: '100%',
                    textAlign: 'left',
                    backgroundColor: language === lang.code ? C.accentDim : C.surface,
                    border: `2px solid ${language === lang.code ? C.accent : C.border}`,
                    borderRadius: 10,
                    padding: '16px 20px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: language === lang.code ? '0 0 0 4px rgba(139,92,246,0.08)' : 'none',
                  }}
                  onMouseEnter={e => {
                    if (language !== lang.code) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.accentBorder;
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.surface2;
                    }
                  }}
                  onMouseLeave={e => {
                    if (language !== lang.code) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = C.border;
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = C.surface;
                    }
                  }}
                >
                  {/* Flag */}
                  <div style={{
                    fontSize: 36,
                    lineHeight: 1,
                    flexShrink: 0,
                    filter: language === lang.code ? 'none' : 'grayscale(20%)',
                    transition: 'filter 0.2s',
                  }}>
                    {lang.flag}
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                        {lang.name}
                      </span>
                      <span style={{
                        fontSize: 13,
                        color: C.textMuted,
                        fontFamily: lang.code === 'ur' ? 'serif' : lang.code === 'ar' ? 'serif' : 'inherit',
                        direction: lang.code === 'ur' || lang.code === 'ar' ? 'rtl' : 'ltr',
                      }}>
                        {lang.native}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, color: C.textSub }}>{lang.desc}</span>
                      <span style={{
                        fontSize: 11,
                        color: lang.code === 'en' ? '#4ADE80' : '#FCD34D',
                        backgroundColor: lang.code === 'en' ? 'rgba(74,222,128,0.1)' : 'rgba(252,211,77,0.1)',
                        border: `1px solid ${lang.code === 'en' ? 'rgba(74,222,128,0.2)' : 'rgba(252,211,77,0.2)'}`,
                        borderRadius: 4,
                        padding: '1px 8px',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}>
                        {lang.agents}
                      </span>
                    </div>
                  </div>

                  {/* Radio indicator */}
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${language === lang.code ? C.accent : C.border}`,
                    backgroundColor: language === lang.code ? C.accent : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}>
                    {language === lang.code && (
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: 'white' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => language && setStep(0)}
                disabled={!language}
                style={{
                  ...btn.primary,
                  opacity: language ? 1 : 0.4,
                  cursor: language ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '11px 24px',
                  fontSize: 14,
                  boxShadow: language ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                Continue <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 0: Category ─────────────────────────────────────── */}
        {step === 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text }}>
                What do you need help with?
              </h1>
              {/* Language badge */}
              {language && (
                <span style={{
                  fontSize: 12,
                  backgroundColor: C.accentDim,
                  border: `1px solid ${C.accentBorder}`,
                  borderRadius: 6,
                  padding: '2px 10px',
                  color: C.accentHi,
                  fontWeight: 600,
                }}>
                  {LANGUAGES.find(l => l.code === language)?.flag} {LANGUAGES.find(l => l.code === language)?.name}
                </span>
              )}
            </div>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 24 }}>
              Select the category that best matches your issue.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 28 }}>
              {CATS.map(({ slug, icon: Icon, title, desc }) => (
                <button key={slug} onClick={() => setCat(slug)} style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left', backgroundColor: cat === slug ? C.surface3 : C.surface, border: `1px solid ${cat === slug ? C.accent : C.border}`, borderRadius: 7, padding: '12px 16px', cursor: 'pointer' }}>
                  <div style={{ width: 34, height: 34, borderRadius: 7, flexShrink: 0, backgroundColor: cat === slug ? C.accentDim : C.surface3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={16} color={cat === slug ? C.accentHi : C.textMuted} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{desc}</div>
                  </div>
                  <ArrowRight size={14} color={cat === slug ? C.accent : C.border} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button onClick={() => setStep(-1)} style={btn.secondary}>
                <ArrowLeft size={14} /> Back
              </button>
              <button onClick={() => cat && setStep(1)} style={{ ...btn.primary, opacity: cat ? 1 : 0.4 }}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Details ──────────────────────────────────────── */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Ticket Details</h1>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 24 }}>Fill in as much detail as possible.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Subject <span style={{ color: '#f87171' }}>*</span></label>
                <input style={input} placeholder="Brief summary of the issue" value={form.subject} onChange={e => f('subject', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                {[['accountId','Account ID'],['orderId','Order ID'],['transactionId','Transaction ID']].map(([k,l]) => (
                  <div key={k}>
                    <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>{l}</label>
                    <input style={input} placeholder="Optional" value={(form as any)[k]} onChange={e => f(k, e.target.value)} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Priority <span style={{ color: '#f87171' }}>*</span></label>
                <select style={{ ...input, cursor: 'pointer' }} value={form.priority} onChange={e => f('priority', e.target.value)}>
                  <option value="low">Low — General inquiry</option>
                  <option value="normal">Normal — Standard issue</option>
                  <option value="high">High — Affecting my account</option>
                  <option value="urgent">Urgent — Critical issue</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Description <span style={{ color: '#f87171' }}>*</span></label>
                <textarea rows={6} style={{ ...input, resize: 'vertical', lineHeight: 1.6 }} placeholder="Describe your issue in detail…" value={form.description} onChange={e => f('description', e.target.value)} required />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Attachments</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: C.surface3, border: `1px dashed ${C.border}`, borderRadius: 6, cursor: 'pointer' }}>
                  <Paperclip size={14} color={C.textMuted} />
                  <span style={{ fontSize: 13, color: C.textMuted }}>Attach files (images, PDFs)</span>
                  <input type="file" multiple style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx" onChange={e => e.target.files && setFiles(p => [...p, ...Array.from(e.target.files!)])} />
                </label>
                {files.map((f2, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, padding: '6px 10px', backgroundColor: C.surface3, borderRadius: 5 }}>
                    <span style={{ fontSize: 12, color: C.textSub }}>{f2.name}</span>
                    <button type="button" onClick={() => setFiles(p => p.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}><X size={13} /></button>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
              <button onClick={() => setStep(0)} style={btn.secondary}><ArrowLeft size={14} /> Back</button>
              <button onClick={() => form.subject && form.description && setStep(2)} style={{ ...btn.primary, opacity: (form.subject && form.description) ? 1 : 0.4 }}>
                Review <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Review ───────────────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Review & Submit</h1>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 24 }}>Confirm your ticket details before submitting.</p>
            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              {[
                ['Language',    LANGUAGES.find(l => l.code === language) ? `${LANGUAGES.find(l => l.code === language)!.flag} ${LANGUAGES.find(l => l.code === language)!.name}` : '—'],
                ['Category',    CATS.find(c => c.slug === cat)?.title],
                ['Subject',     form.subject],
                ['Priority',    form.priority],
                ...(form.accountId     ? [['Account ID',     form.accountId]]     : []),
                ...(form.transactionId ? [['Transaction ID', form.transactionId]] : []),
              ].filter(([,v]) => v).map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: 12, color: C.textMuted, width: 120, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: k === 'Language' ? C.accentHi : C.text, fontWeight: 500, textTransform: k === 'Priority' ? 'capitalize' : 'none' }}>{v}</span>
                </div>
              ))}
              <div style={{ padding: '12px 16px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 6 }}>Description</div>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{form.description}</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button type="button" onClick={() => setStep(1)} style={btn.secondary}><ArrowLeft size={14} /> Edit</button>
              <button type="submit" disabled={submitting} style={{ ...btn.primary, opacity: submitting ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : '🎫 Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

export default function NewTicketPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    }>
      <NewTicketPageInner />
    </Suspense>
  );
}
