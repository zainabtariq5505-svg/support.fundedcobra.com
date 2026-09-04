'use client';
import { useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Loader2, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react';
import { C } from '@/lib/ds';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/browser';

// ── Toggle ──────────────────────────────────────────────────────────
function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ width: 40, height: 22, borderRadius: 11, cursor: 'pointer', backgroundColor: on ? C.accent : C.surface3, border: `1px solid ${on ? C.accent : C.border}`, position: 'relative', transition: 'background 0.2s,border 0.2s', flexShrink: 0, outline: 'none' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 19 : 3, width: 14, height: 14, borderRadius: '50%', backgroundColor: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
    </button>
  );
}

// ── Field ───────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, hint, type = 'text', readOnly }: {
  label: string; value: string; onChange?: (v: string) => void;
  placeholder?: string; hint?: string; type?: string; readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>{label}</label>
      <input type={type} value={value} readOnly={readOnly}
        onChange={e => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{ width: '100%', backgroundColor: readOnly ? C.surface2 : C.surface3, border: `1px solid ${focused ? C.accentBorder : C.border}`, boxShadow: focused ? `0 0 0 3px ${C.accentDim}` : 'none', borderRadius: 6, padding: '9px 12px', color: readOnly ? C.textSub : C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'all 0.15s', cursor: readOnly ? 'default' : 'text' }}
      />
      {hint && <p style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>{hint}</p>}
    </div>
  );
}

function SectionHead({ label }: { label: string }) {
  return <h2 style={{ fontSize: 10, fontWeight: 700, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>{label}</h2>;
}

// ── Main ────────────────────────────────────────────────────────────
export default function StaffSettingsPage() {
  const [webhookUrl,    setWebhookUrl]    = useState('');
  const [clientId,      setClientId]      = useState('');
  const [clientSecret,  setClientSecret]  = useState('');
  const [redirectUri,   setRedirectUri]   = useState(
    typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback/discord` : 'http://localhost:3000/api/auth/callback/discord'
  );
  const [notifs, setNotifs] = useState({
    new_ticket: true, urgent_ticket: true, customer_reply: true,
    assignment: false, status_change: true, staff_reply: true,
  });

  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');
  const [copied,   setCopied]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [testResult, setTestResult] = useState<'ok' | 'fail' | null>(null);

  // ── Load settings from Supabase (with localStorage fallback) ────────
  const loadSettings = useCallback(async () => {
    setLoading(true);

    // Try Supabase first
    if (isSupabaseConfigured()) {
      try {
        const sb = createClient();
        const { data, error: err } = await sb
          .from('portal_settings' as any)
          .select('key,value');

        if (!err && data && data.length > 0) {
          const map: Record<string, string> = {};
          (data as any[]).forEach((r: any) => { map[r.key] = r.value; });

          if (map['discord_webhook_url']   !== undefined) setWebhookUrl(map['discord_webhook_url']);
          if (map['discord_client_id']     !== undefined) setClientId(map['discord_client_id']);
          if (map['discord_client_secret'] !== undefined) setClientSecret(map['discord_client_secret']);
          setNotifs({
            new_ticket:     map['notif_new_ticket']     !== 'false',
            urgent_ticket:  map['notif_urgent_ticket']  !== 'false',
            customer_reply: map['notif_customer_reply'] !== 'false',
            assignment:     map['notif_assignment']     === 'true',
            status_change:  map['notif_status_change']  !== 'false',
            staff_reply:    map['notif_staff_reply']    !== 'false',
          });
          setLoading(false);
          return;
        }
      } catch { /* fall through to localStorage */ }
    }

    // Fallback: localStorage
    try {
      const stored = localStorage.getItem('fc_staff_settings');
      if (stored) {
        const d = JSON.parse(stored);
        if (d.webhookUrl)   setWebhookUrl(d.webhookUrl);
        if (d.clientId)     setClientId(d.clientId);
        if (d.clientSecret) setClientSecret(d.clientSecret);
        if (d.notifs)       setNotifs(d.notifs);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  // ── Save settings ────────────────────────────────────────────────
  const handleSave = async () => {
    setError('');
    if (webhookUrl && !webhookUrl.startsWith('https://discord.com/api/webhooks/')) {
      setError('Webhook URL must start with https://discord.com/api/webhooks/');
      return;
    }
    setSaving(true);

    const rows = [
      { key: 'discord_webhook_url',   value: webhookUrl },
      { key: 'discord_client_id',     value: clientId },
      { key: 'discord_client_secret', value: clientSecret },
      { key: 'notif_new_ticket',      value: String(notifs.new_ticket) },
      { key: 'notif_urgent_ticket',   value: String(notifs.urgent_ticket) },
      { key: 'notif_customer_reply',  value: String(notifs.customer_reply) },
      { key: 'notif_assignment',      value: String(notifs.assignment) },
      { key: 'notif_status_change',   value: String(notifs.status_change) },
      { key: 'notif_staff_reply',     value: String(notifs.staff_reply) },
    ];

    let savedToSupabase = false;

    // Try saving to Supabase
    if (isSupabaseConfigured()) {
      try {
        const sb = createClient();
        for (const row of rows) {
          await sb.from('portal_settings' as any).upsert(
            { key: row.key, value: row.value, updated_at: new Date().toISOString() },
            { onConflict: 'key' }
          );
        }
        savedToSupabase = true;
      } catch { /* fall through to localStorage */ }
    }

    // Always also save to localStorage as backup
    try {
      localStorage.setItem('fc_staff_settings', JSON.stringify({
        webhookUrl, clientId, clientSecret, notifs,
      }));
    } catch {}

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // ── Test webhook ─────────────────────────────────────────────────
  const testWebhook = async () => {
    if (!webhookUrl) { setError('Enter a webhook URL first.'); return; }
    setTesting(true); setTestResult(null);
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          embeds: [{
            title: '✅ Funded Cobra Support — Webhook Test',
            description: 'Your Discord notification webhook is working correctly.',
            color: 0x8B5CF6,
            footer: { text: 'Funded Cobra Support Portal' },
            timestamp: new Date().toISOString(),
          }],
        }),
      });
      setTestResult(res.ok ? 'ok' : 'fail');
    } catch { setTestResult('fail'); }
    finally { setTesting(false); setTimeout(() => setTestResult(null), 5000); }
  };

  const toggleNotif = (k: keyof typeof notifs) => setNotifs(p => ({ ...p, [k]: !p[k] }));

  const notifRows: { k: keyof typeof notifs; label: string; desc: string }[] = [
    { k: 'new_ticket',     label: 'New ticket created',        desc: 'Alert staff when a customer opens a ticket' },
    { k: 'urgent_ticket',  label: 'Urgent ticket created',     desc: 'Immediate alert for urgent priority tickets' },
    { k: 'customer_reply', label: 'Customer replies',          desc: 'Alert staff when a customer sends a message' },
    { k: 'assignment',     label: 'Ticket assigned to me',     desc: 'Alert when a ticket is assigned to you' },
    { k: 'status_change',  label: 'Ticket status changes',     desc: 'Notify customer when their ticket status changes' },
    { k: 'staff_reply',    label: 'Staff replies to customer', desc: 'Notify customer when staff sends a reply' },
  ];

  const cardStyle: React.CSSProperties = {
    backgroundColor: C.surface, border: `1px solid ${C.border}`,
    borderRadius: 8, padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16,
  };

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 3 }}>Settings</h1>
        <p style={{ fontSize: 13, color: C.textSub }}>Manage portal configuration and integrations.</p>
      </div>

      <div style={{ maxWidth: 600 }}>
        {/* Feedback banners */}
        {saved && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#4ADE80' }}>
            <CheckCircle2 size={14} /> Settings saved successfully.
          </div>
        )}
        {error && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#FCA5A5' }}>
            <AlertCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} /> {error}
          </div>
        )}
        {testResult && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: testResult === 'ok' ? 'rgba(74,222,128,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${testResult === 'ok' ? 'rgba(74,222,128,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 7, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: testResult === 'ok' ? '#4ADE80' : '#FCA5A5' }}>
            {testResult === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {testResult === 'ok' ? 'Webhook test message sent to Discord.' : 'Webhook test failed. Check the URL and try again.'}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}>
            <Loader2 size={20} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : (
          <>
            {/* Discord Integration */}
            <SectionHead label="Discord Integration" />
            <div style={cardStyle}>
              <Field
                label="Staff Notification Webhook URL"
                value={webhookUrl}
                onChange={setWebhookUrl}
                placeholder="https://discord.com/api/webhooks/123456/token"
                hint="New tickets will be posted to this Discord channel."
              />

              {webhookUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button onClick={testWebhook} disabled={testing} style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 5, padding: '6px 12px', fontSize: 12, color: C.textSub, cursor: testing ? 'default' : 'pointer', opacity: testing ? 0.6 : 1 }}>
                    {testing ? <><Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> Testing…</> : 'Test Webhook'}
                  </button>
                  <a href="https://support.discord.com/hc/en-us/articles/228383668" target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: C.accentHi, textDecoration: 'none' }}>
                    How to create a webhook <ExternalLink size={10} />
                  </a>
                </div>
              )}

              <Field label="Discord Client ID" value={clientId} onChange={setClientId} placeholder="1234567890123456789" hint="Required for Discord OAuth login." />
              <Field label="Discord Client Secret" value={clientSecret} onChange={setClientSecret} placeholder="••••••••••••••••" type="password" hint="Keep this secret. Never share it publicly." />

              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 6, display: 'block' }}>OAuth Redirect URI</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value={redirectUri} readOnly style={{ flex: 1, backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.textSub, fontSize: 12, outline: 'none', boxSizing: 'border-box', fontFamily: 'monospace' }} />
                  <button onClick={() => { navigator.clipboard.writeText(redirectUri).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 2000); }} style={{ display: 'flex', alignItems: 'center', gap: 5, backgroundColor: copied ? 'rgba(74,222,128,0.1)' : C.surface3, border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : C.border}`, borderRadius: 6, padding: '0 12px', color: copied ? '#4ADE80' : C.textSub, fontSize: 12, cursor: 'pointer', flexShrink: 0 }}>
                    {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                </div>
                <p style={{ fontSize: 11, color: C.textMuted, marginTop: 5 }}>Add this URL to your Discord application's OAuth2 redirect list.</p>
              </div>
            </div>

            {/* Notification Defaults */}
            <SectionHead label="Notification Defaults" />
            <div style={{ ...cardStyle, gap: 0 }}>
              {notifRows.map(({ k, label, desc }, i) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: i < notifRows.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ flex: 1, paddingRight: 20 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{desc}</div>
                  </div>
                  <Toggle on={notifs[k]} onToggle={() => toggleNotif(k)} />
                </div>
              ))}
            </div>

            {/* Portal Settings */}
            <SectionHead label="Portal Settings" />
            <div style={cardStyle}>
              <Field label="Support Portal Name" value="Funded Cobra Support Portal" onChange={() => {}} hint="Displayed in the browser tab and emails." />
              <Field label="Default Ticket Priority" value="normal" readOnly hint="Assigned automatically when a customer creates a ticket." />
            </div>

            {/* Save */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
              <button onClick={handleSave} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 7, backgroundColor: saving ? C.accentDeep : C.accent, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 24px', fontSize: 14, fontWeight: 600, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, transition: 'all 0.15s' }}>
                {saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Save Settings'}
              </button>
              {saved && (
                <span style={{ fontSize: 12, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={13} /> Saved
                </span>
              )}
            </div>
          </>
        )}
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
