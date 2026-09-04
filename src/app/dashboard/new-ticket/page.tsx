'use client';
import { useState } from 'react';
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

export default function NewTicketPage() {
  const router = useRouter();
  const params = useSearchParams();
  const profile = useProfile();

  const [step, setStep]   = useState(0);
  const [cat, setCat]     = useState(params.get('cat') ?? '');
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [createdId, setCreatedId]   = useState<string | null>(null);
  const [error, setError] = useState('');
  const [form, setForm]   = useState({ subject: '', accountId: '', orderId: '', transactionId: '', priority: 'normal', description: '' });
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
      account_id:     form.accountId || null,
      order_id:       form.orderId   || null,
      transaction_id: form.transactionId || null,
      status:         'open',
    }).select().single();

    if (err || !ticket) {
      setError(err?.message ?? 'Failed to create ticket. Please try again.');
      setSubmitting(false);
      return;
    }

    // Insert opening message
    await sb.from('ticket_messages').insert({
      ticket_id:   ticket.id,
      sender_id:   profile.id,
      message:     form.description,
      is_internal: false,
    });

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

    // ── Discord webhook notification ──────────────────────────────
    // Read webhook URL saved in localStorage by the settings page
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
                { name: 'Ticket',    value: `\`${ticket.ticket_number}\``,                      inline: true  },
                { name: 'Category',  value: categoryTitle,                                       inline: true  },
                { name: 'Priority',  value: `${priorityEmoji[form.priority] ?? '🔵'} ${form.priority.charAt(0).toUpperCase() + form.priority.slice(1)}`, inline: true },
                { name: 'Customer',  value: profile.full_name ?? profile.email ?? 'Unknown',    inline: true  },
                { name: 'Subject',   value: form.subject,                                        inline: false },
              ],
              footer: { text: 'Funded Cobra Support Portal' },
              timestamp: new Date().toISOString(),
            }],
          }),
        });
      }
    } catch {
      // Don't block the ticket creation if webhook fails
    }

    setSubmitting(false);
    setStep(3);
  };

  // Success state
  if (step === 3 && createdId) return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ maxWidth: 480, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <CheckCircle size={48} color={C.accentHi} style={{ marginBottom: 20, display: 'block', margin: '0 auto 20px' }} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: C.text, marginBottom: 8 }}>Ticket Submitted</h1>
        <p style={{ color: C.textSub, fontSize: 14, marginBottom: 24 }}>Your ticket has been received. Our team will respond shortly.</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <Link href={`/dashboard/tickets/${createdId}`} style={{ ...btn.primary, textDecoration: 'none' }}>View Ticket</Link>
          <Link href="/dashboard/tickets" style={{ ...btn.secondary, textDecoration: 'none' }}>All Tickets</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar />
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 24px' }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.textMuted, fontSize: 12, marginBottom: 28, textDecoration: 'none' }}>
          <ArrowLeft size={13} /> Back
        </Link>

        {/* Steps */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 36 }}>
          {['Choose category', 'Details', 'Review'].map((s, i) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, backgroundColor: i <= step ? C.accent : C.surface3, color: i <= step ? '#fff' : C.textMuted, border: `1px solid ${i <= step ? C.accent : C.border}` }}>{i + 1}</div>
                <span style={{ fontSize: 12, color: i === step ? C.text : C.textMuted, fontWeight: i === step ? 500 : 400 }}>{s}</span>
              </div>
              {i < 2 && <div style={{ width: 24, height: 1, backgroundColor: i < step ? C.accent : C.border }} />}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(229,62,62,0.08)', border: '1px solid rgba(229,62,62,0.25)', borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>{error}</div>
        )}

        {/* Step 0 — Category */}
        {step === 0 && (
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>What do you need help with?</h1>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 24 }}>Select the category that best matches your issue.</p>
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
                  <ArrowRight size={14} color={cat === slug ? C.accent : C.border2} />
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => cat && setStep(1)} style={{ ...btn.primary, opacity: cat ? 1 : 0.4 }}>
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Ticket Details</h1>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 24 }}>Fill in as much detail as possible.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Subject <span style={{ color: '#f87171' }}>*</span></label>
                <input style={input} placeholder="Brief summary of the issue" value={form.subject} onChange={e => f('subject', e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
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

        {/* Step 2 — Review */}
        {step === 2 && (
          <form onSubmit={handleSubmit}>
            <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 4 }}>Review & Submit</h1>
            <p style={{ color: C.textSub, fontSize: 13, marginBottom: 24 }}>Confirm your ticket details before submitting.</p>
            <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden', marginBottom: 24 }}>
              {[
                ['Category',    CATS.find(c => c.slug === cat)?.title],
                ['Subject',     form.subject],
                ['Priority',    form.priority],
                ...(form.accountId     ? [['Account ID',     form.accountId]]     : []),
                ...(form.transactionId ? [['Transaction ID', form.transactionId]] : []),
              ].filter(([,v]) => v).map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', gap: 16, padding: '12px 16px', borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <span style={{ fontSize: 12, color: C.textMuted, width: 120, flexShrink: 0 }}>{k}</span>
                  <span style={{ fontSize: 13, color: C.text, fontWeight: 500, textTransform: k === 'Priority' ? 'capitalize' : 'none' }}>{v}</span>
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
                {submitting ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Submitting…</> : 'Submit Ticket'}
              </button>
            </div>
          </form>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
