'use client';
import { useState } from 'react';
import { Bell, Lock, Shield, CheckCircle2 } from 'lucide-react';
import TopBar from '@/components/layout/TopBar';
import { C } from '@/lib/ds';

const demoUser = { full_name: 'TradingPro', email: 'tradingpro@example.com', role: 'customer' };

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{
      width: 38, height: 22, borderRadius: 11, cursor: 'pointer',
      backgroundColor: on ? C.accent : C.surface3,
      border: `1px solid ${on ? C.accent : C.border}`,
      position: 'relative', transition: 'all 0.2s', flexShrink: 0,
    }}>
      <span style={{
        position: 'absolute', top: 3, left: on ? 18 : 3,
        width: 14, height: 14, borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left 0.2s',
      }} />
    </button>
  );
}

export default function SettingsPage() {
  const [prefs, setPrefs] = useState({
    notif_reply: true, notif_status: true, notif_assigned: false,
    notif_resolved: true, notif_email: false,
  });
  const [saved, setSaved] = useState(false);
  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  const Section = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: C.accentHi }}>{icon}</span>
      <h2 style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{title}</h2>
    </div>
  );

  const Row = ({ label, desc, k }: { label: string; desc: string; k: keyof typeof prefs }) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ flex: 1, paddingRight: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 11, color: C.textMuted }}>{desc}</div>
      </div>
      <Toggle on={prefs[k]} onToggle={() => toggle(k)} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.bg }}>
      <TopBar user={demoUser} />
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '36px 24px' }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: C.text, letterSpacing: '-0.02em', marginBottom: 28 }}>Account Settings</h1>

        {saved && (
          <div style={{
            backgroundColor: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: 7, padding: '10px 14px', marginBottom: 20,
            fontSize: 13, color: '#4ADE80', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <CheckCircle2 size={14} /> Settings saved.
          </div>
        )}

        {/* Notification preferences */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', marginBottom: 16 }}>
          <Section title="Notification Preferences" icon={<Bell size={15} />} />
          <Row label="Staff replies"        desc="Notify me when staff replies to my ticket"        k="notif_reply" />
          <Row label="Status changes"       desc="Notify me when my ticket status changes"          k="notif_status" />
          <Row label="Ticket assigned"      desc="Notify me when my ticket is assigned to a member" k="notif_assigned" />
          <Row label="Ticket resolved"      desc="Notify me when my ticket is resolved or closed"   k="notif_resolved" />
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 0',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>Email notifications</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Receive notifications via email as well</div>
            </div>
            <Toggle on={prefs.notif_email} onToggle={() => toggle('notif_email')} />
          </div>
        </div>

        {/* Password */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', marginBottom: 16 }}>
          <Section title="Password" icon={<Lock size={15} />} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {['Current Password', 'New Password', 'Confirm New Password'].map(l => (
              <div key={l}>
                <label style={{ fontSize: 11, fontWeight: 500, color: C.textMuted, marginBottom: 5, display: 'block' }}>{l}</label>
                <input type="password" placeholder="••••••••" style={{
                  width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`,
                  borderRadius: 6, padding: '8px 12px', color: C.text,
                  fontSize: 14, outline: 'none', boxSizing: 'border-box',
                }} />
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, padding: '20px 22px', marginBottom: 24 }}>
          <Section title="Security" icon={<Shield size={15} />} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 2 }}>Two-factor authentication</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>Add an extra layer of security to your account</div>
            </div>
            <button style={{
              backgroundColor: C.accentDim, color: C.accentHi,
              border: `1px solid ${C.accentBorder}`,
              borderRadius: 5, padding: '6px 12px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>Set up</button>
          </div>
        </div>

        <button onClick={save} style={{
          backgroundColor: C.accent, color: '#fff', border: 'none',
          borderRadius: 6, padding: '10px 22px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
        }}>Save Settings</button>
      </div>
    </div>
  );
}
