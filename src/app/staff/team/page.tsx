'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Search, Loader2, Users2, Shield, Plus, X, Eye, EyeOff,
  Trash2, Edit2, Check, Mail, Key, UserCheck, AlertTriangle,
  Ticket, ChevronDown,
} from 'lucide-react';
import { C, fmtDate, initials, relativeTime } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';

// ── Types ──────────────────────────────────────────────────────────
interface StaffMember {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
  updated_at: string;
  ticket_count?: number;
  resolved_count?: number;
}

// ── Role config ────────────────────────────────────────────────────
const ROLES = [
  {
    value: 'support_agent',
    label: 'Support Agent',
    color: '#93C5FD',
    bg: 'rgba(147,197,253,0.1)',
    desc: 'Can view and respond to customer tickets',
    permissions: ['View tickets', 'Reply to customers', 'Update ticket status', 'Add internal notes'],
  },
  {
    value: 'finance',
    label: 'Finance Team',
    color: '#4ADE80',
    bg: 'rgba(74,222,128,0.1)',
    desc: 'Handles billing, payments, and payout tickets',
    permissions: ['View all tickets', 'Reply to customers', 'Access financial ticket categories', 'Update ticket status'],
  },
  {
    value: 'partnership_manager',
    label: 'Partnership Manager',
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.1)',
    desc: 'Manages partnership and affiliate tickets',
    permissions: ['View all tickets', 'Reply to customers', 'Manage partnership tickets', 'Update ticket status'],
  },
  {
    value: 'admin',
    label: 'Administrator',
    color: '#A855F7',
    bg: 'rgba(168,85,247,0.1)',
    desc: 'Full access — can manage team, settings, and all tickets',
    permissions: ['Full system access', 'Create/remove staff', 'View analytics', 'Manage all tickets', 'Change any setting'],
  },
];

const getRoleMeta = (role: string) =>
  ROLES.find(r => r.value === role) ?? { label: role, color: C.textMuted, bg: C.surface3, desc: '', permissions: [] };

// ── Password strength ──────────────────────────────────────────────
function pwStrength(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const strColors = ['', '#ef4444', '#f97316', '#eab308', '#10b981'];
const strLabels = ['', 'Weak', 'Fair', 'Good', 'Strong'];

// ── Create modal ───────────────────────────────────────────────────
function CreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (member: StaffMember) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', confirm: '', staff_role: 'support_agent',
  });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));
  const strength = pwStrength(form.password);
  const selectedRole = getRoleMeta(form.staff_role);

  const validateStep1 = () => {
    if (!form.full_name.trim()) return 'Full name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return 'Enter a valid email';
    if (form.password.length < 8) return 'Password must be at least 8 characters';
    if (form.password !== form.confirm) return 'Passwords do not match';
    return '';
  };

  const handleNext = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError('');
    setStep(2);
  };

  const handleCreate = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name:  form.full_name.trim(),
          email:      form.email.trim(),
          password:   form.password,
          staff_role: form.staff_role,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Failed to create staff member'); setLoading(false); return; }
      onCreated(data.member);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 24,
      animation: 'fadeIn 0.15s ease-out',
    }}>
      <div style={{
        backgroundColor: C.surface, border: `1px solid ${C.border}`,
        borderRadius: 12, width: '100%', maxWidth: 500,
        boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        overflow: 'hidden',
        animation: 'slideUp 0.2s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px', borderBottom: `1px solid ${C.border}`,
          background: 'linear-gradient(90deg,rgba(109,40,217,0.08) 0%,transparent 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={16} color={C.accentHi} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Create Staff Member</div>
              <div style={{ fontSize: 11, color: C.textMuted }}>
                Step {step} of 2 — {step === 1 ? 'Account Details' : 'Role & Permissions'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', padding: '12px 24px 0', gap: 8 }}>
          {[1, 2].map(s => (
            <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: step >= s ? C.accent : C.border, transition: 'background 0.3s' }} />
          ))}
        </div>

        <div style={{ padding: '20px 24px' }}>
          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 7, padding: '10px 14px', marginBottom: 16,
            }}>
              <AlertTriangle size={14} color="#ef4444" />
              <span style={{ fontSize: 13, color: '#FCA5A5' }}>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Full name */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input
                  placeholder="e.g. Alex Johnson"
                  value={form.full_name}
                  onChange={e => f('full_name', e.target.value)}
                  style={{ width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = C.accentBorder}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              {/* Email */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 6 }}>
                  <Mail size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Email Address *
                </label>
                <input
                  type="email"
                  placeholder="staff@company.com"
                  value={form.email}
                  onChange={e => f('email', e.target.value)}
                  style={{ width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = C.accentBorder}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 6 }}>
                  <Key size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => f('password', e.target.value)}
                    style={{ width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 40px 9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s' }}
                    onFocus={e => e.currentTarget.style.borderColor = C.accentBorder}
                    onBlur={e => e.currentTarget.style.borderColor = C.border}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}>
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 3, marginBottom: 3 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= strength ? strColors[strength] : C.border, transition: 'all 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: strColors[strength] }}>{strLabels[strength]}</span>
                  </div>
                )}
              </div>

              {/* Confirm */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 6 }}>Confirm Password *</label>
                <input
                  type="password"
                  placeholder="Repeat password"
                  value={form.confirm}
                  onChange={e => f('confirm', e.target.value)}
                  style={{ width: '100%', backgroundColor: C.surface3, border: `1px solid ${form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.5)' : C.border}`, borderRadius: 6, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box', transition: 'border 0.15s' }}
                  onFocus={e => e.currentTarget.style.borderColor = C.accentBorder}
                  onBlur={e => e.currentTarget.style.borderColor = C.border}
                />
                {form.confirm && form.confirm !== form.password && (
                  <div style={{ fontSize: 11, color: '#ef4444', marginTop: 4 }}>Passwords do not match</div>
                )}
              </div>

              <button
                onClick={handleNext}
                style={{ width: '100%', padding: '10px', backgroundColor: C.accent, color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4, transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(124,58,237,0.3)' }}
                onMouseEnter={e => { (e.currentTarget).style.transform = 'translateY(-1px)'; (e.currentTarget).style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)'; }}
                onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; (e.currentTarget).style.boxShadow = '0 2px 8px rgba(124,58,237,0.3)'; }}
              >
                Continue →
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 10 }}>Select Role *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {ROLES.map(role => (
                    <div
                      key={role.value}
                      onClick={() => f('staff_role', role.value)}
                      style={{
                        display: 'flex', alignItems: 'flex-start', gap: 12,
                        padding: '12px 14px', borderRadius: 8, cursor: 'pointer',
                        border: `2px solid ${form.staff_role === role.value ? role.color : C.border}`,
                        backgroundColor: form.staff_role === role.value ? role.bg : 'transparent',
                        transition: 'all 0.15s',
                      }}
                    >
                      {/* Radio */}
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', flexShrink: 0, marginTop: 1,
                        border: `2px solid ${form.staff_role === role.value ? role.color : C.border}`,
                        backgroundColor: form.staff_role === role.value ? role.color : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {form.staff_role === role.value && <Check size={10} color="white" />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{role.label}</span>
                          {role.value === 'admin' && <Shield size={12} color={role.color} />}
                        </div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 6 }}>{role.desc}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {role.permissions.map(p => (
                            <span key={p} style={{ fontSize: 10, padding: '2px 6px', backgroundColor: C.surface3, color: C.textSub, borderRadius: 4, border: `1px solid ${C.border}` }}>
                              ✓ {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary box */}
              <div style={{ backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Account Summary
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { k: 'Name',  v: form.full_name },
                    { k: 'Email', v: form.email },
                    { k: 'Role',  v: selectedRole.label },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: C.textMuted }}>{k}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: k === 'Role' ? selectedRole.color : C.text }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button
                  onClick={() => { setStep(1); setError(''); }}
                  style={{ flex: 1, padding: '10px', backgroundColor: C.surface3, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={e => (e.currentTarget).style.backgroundColor = C.surface2}
                  onMouseLeave={e => (e.currentTarget).style.backgroundColor = C.surface3}
                >
                  ← Back
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  style={{ flex: 2, padding: '10px', backgroundColor: loading ? C.surface3 : C.accent, color: loading ? C.textMuted : 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: loading ? 'none' : '0 2px 8px rgba(124,58,237,0.3)' }}
                  onMouseEnter={e => { if (!loading) { (e.currentTarget).style.transform = 'translateY(-1px)'; (e.currentTarget).style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)'; }}}
                  onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; (e.currentTarget).style.boxShadow = loading ? 'none' : '0 2px 8px rgba(124,58,237,0.3)'; }}
                >
                  {loading ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Creating…</> : <><UserCheck size={14} /> Create Staff Member</>}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ── Edit modal ─────────────────────────────────────────────────────
function EditModal({
  member,
  onClose,
  onUpdated,
}: {
  member: StaffMember;
  onClose: () => void;
  onUpdated: (id: string, updates: Partial<StaffMember>) => void;
}) {
  const [fullName, setFullName] = useState(member.full_name ?? '');
  const [staffRole, setStaffRole] = useState(member.role);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/team', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: member.id, full_name: fullName, staff_role: staffRole }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error ?? 'Failed to update'); setLoading(false); return; }
    onUpdated(member.id, { full_name: fullName, role: staffRole });
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 24, animation: 'fadeIn 0.15s ease-out' }}>
      <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', overflow: 'hidden', animation: 'slideUp 0.2s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Edit Staff Member</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}><X size={16} /></button>
        </div>
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {error && <div style={{ backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 7, padding: '10px 14px', fontSize: 13, color: '#FCA5A5' }}>{error}</div>}
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 6 }}>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} style={{ width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} onFocus={e => e.currentTarget.style.borderColor = C.accentBorder} onBlur={e => e.currentTarget.style.borderColor = C.border} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 6 }}>Email</label>
            <input value={member.email ?? ''} disabled style={{ width: '100%', backgroundColor: C.surface2, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.textMuted, fontSize: 13, boxSizing: 'border-box', cursor: 'not-allowed' }} />
            <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>Email cannot be changed after account creation</div>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.textSub, display: 'block', marginBottom: 6 }}>Role</label>
            <select value={staffRole} onChange={e => setStaffRole(e.target.value)} style={{ width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={onClose} style={{ flex: 1, padding: '9px', backgroundColor: C.surface3, color: C.textSub, border: `1px solid ${C.border}`, borderRadius: 7, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleSave} disabled={loading} style={{ flex: 2, padding: '9px', backgroundColor: C.accent, color: 'white', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: loading ? 0.7 : 1 }}>
              {loading ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes slideUp{from{opacity:0;transform:translateY(16px) scale(0.98)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────
export default function TeamPage() {
  const profile = useProfile();
  const isAdmin = profile?.role === 'admin';

  const [members, setMembers]       = useState<StaffMember[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null); // id to confirm

  const load = async () => {
    setLoading(true);
    const sb = createClient();

    const { data: profiles } = await sb
      .from('profiles')
      .select('*')
      .in('role', ['admin', 'support_agent', 'finance', 'partnership_manager'])
      .order('created_at', { ascending: true });

    if (!profiles) { setLoading(false); return; }

    // Fetch ticket stats per staff member
    const { data: tickets } = await sb
      .from('tickets')
      .select('assigned_to, status');

    const membersWithStats: StaffMember[] = profiles.map(p => {
      const assigned = (tickets ?? []).filter(t => t.assigned_to === p.id);
      return {
        ...p,
        ticket_count:   assigned.length,
        resolved_count: assigned.filter(t => t.status === 'resolved').length,
      };
    });

    setMembers(membersWithStats);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = members.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !search || (m.full_name ?? '').toLowerCase().includes(q) || (m.email ?? '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  const handleCreated = (member: StaffMember) => {
    setMembers(prev => [...prev, { ...member, ticket_count: 0, resolved_count: 0 }]);
    setShowCreate(false);
  };

  const handleUpdated = (id: string, updates: Partial<StaffMember>) => {
    setMembers(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const res = await fetch('/api/team', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setMembers(prev => prev.filter(m => m.id !== id));
    }
    setDeletingId(null);
    setDeleteConfirm(null);
  };

  // Stats summary
  const totalTickets   = members.reduce((s, m) => s + (m.ticket_count ?? 0), 0);
  const totalResolved  = members.reduce((s, m) => s + (m.resolved_count ?? 0), 0);

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 3 }}>Team</h1>
          <p style={{ fontSize: 13, color: C.textSub }}>
            {members.length} staff member{members.length !== 1 ? 's' : ''} · {totalTickets} tickets assigned · {totalResolved} resolved
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', backgroundColor: C.accent,
              color: 'white', border: 'none', borderRadius: 7,
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(124,58,237,0.3)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget).style.transform = 'translateY(-2px)'; (e.currentTarget).style.boxShadow = '0 4px 12px rgba(124,58,237,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget).style.transform = 'translateY(0)'; (e.currentTarget).style.boxShadow = '0 2px 8px rgba(124,58,237,0.3)'; }}
          >
            <Plus size={15} /> Add Staff Member
          </button>
        )}
      </div>

      {/* Role stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {ROLES.map(role => {
          const count = members.filter(m => m.role === role.value).length;
          return (
            <div
              key={role.value}
              onClick={() => setRoleFilter(roleFilter === role.value ? 'all' : role.value)}
              style={{
                backgroundColor: roleFilter === role.value ? role.bg : C.surface,
                border: `1px solid ${roleFilter === role.value ? role.color : C.border}`,
                borderRadius: 8, padding: '14px 16px', cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { if (roleFilter !== role.value) (e.currentTarget as HTMLDivElement).style.borderColor = role.color; }}
              onMouseLeave={e => { if (roleFilter !== role.value) (e.currentTarget as HTMLDivElement).style.borderColor = C.border; }}
            >
              <div style={{ fontSize: 24, fontWeight: 800, color: role.color, lineHeight: 1, marginBottom: 2 }}>{count}</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text }}>{role.label}</div>
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{role.desc.split(' ').slice(0, 4).join(' ')}…</div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 12px' }}>
          <Search size={13} color={C.textMuted} />
          <input
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13 }}
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 0 }}><X size={13} /></button>}
        </div>
        {roleFilter !== 'all' && (
          <button
            onClick={() => setRoleFilter('all')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', backgroundColor: getRoleMeta(roleFilter).bg, border: `1px solid ${getRoleMeta(roleFilter).color}`, borderRadius: 6, fontSize: 12, color: getRoleMeta(roleFilter).color, cursor: 'pointer', fontWeight: 600 }}
          >
            {getRoleMeta(roleFilter).label} <X size={12} />
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '64px', textAlign: 'center' }}>
          <Users2 size={36} color={C.textMuted} style={{ margin: '0 auto 14px', display: 'block', opacity: 0.4 }} />
          <p style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>
            {search || roleFilter !== 'all' ? 'No members match your filters' : 'No staff members yet'}
          </p>
          <p style={{ fontSize: 13, color: C.textMuted }}>
            {isAdmin && !search && roleFilter === 'all' ? 'Click "Add Staff Member" to create the first one.' : 'Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(m => {
            const rm = getRoleMeta(m.role);
            const isMe = m.id === profile?.id;
            const resRate = m.ticket_count ? Math.round(((m.resolved_count ?? 0) / m.ticket_count) * 100) : 0;
            return (
              <div
                key={m.id}
                style={{
                  backgroundColor: C.surface,
                  border: `1px solid ${isMe ? C.accentBorder : C.border}`,
                  borderRadius: 8,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.borderColor = isMe ? C.accent : C.accentBorder}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.borderColor = isMe ? C.accentBorder : C.border}
              >
                {/* Left accent for current user */}
                {isMe && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: `linear-gradient(180deg, ${C.accent}, #a855f7)` }} />}

                {/* Avatar */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                  background: `linear-gradient(135deg, ${rm.color}88, ${rm.color})`,
                  border: `2px solid ${rm.color}44`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15, fontWeight: 700, color: 'white',
                }}>
                  {initials(m.full_name ?? m.email)}
                </div>

                {/* Name + email */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{m.full_name ?? '—'}</span>
                    {isMe && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: C.accentHi, backgroundColor: C.accentDim, border: `1px solid ${C.accentBorder}`, borderRadius: 4, padding: '1px 6px' }}>
                        You
                      </span>
                    )}
                    {/* Role badge */}
                    <span style={{ fontSize: 10, fontWeight: 700, color: rm.color, backgroundColor: rm.bg, border: `1px solid ${rm.color}44`, borderRadius: 4, padding: '1px 7px', display: 'flex', alignItems: 'center', gap: 3 }}>
                      {m.role === 'admin' && <Shield size={9} />}
                      {rm.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{m.email}</div>
                </div>

                {/* Stats */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{m.ticket_count ?? 0}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Assigned</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#4ADE80', lineHeight: 1 }}>{m.resolved_count ?? 0}</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Resolved</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: resRate >= 70 ? '#4ADE80' : resRate >= 40 ? '#FCD34D' : C.textMuted, lineHeight: 1 }}>
                      {resRate}%
                    </div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>Rate</div>
                  </div>
                </div>

                {/* Joined */}
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                  <div style={{ fontSize: 11, color: C.textMuted }}>Joined</div>
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{fmtDate(m.created_at)}</div>
                </div>

                {/* Actions (admin only, not self-delete) */}
                {isAdmin && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button
                      onClick={() => setEditMember(m)}
                      title="Edit"
                      style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer', color: C.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget).style.backgroundColor = C.surface2; (e.currentTarget).style.borderColor = C.accentBorder; (e.currentTarget).style.color = C.accentHi; }}
                      onMouseLeave={e => { (e.currentTarget).style.backgroundColor = 'transparent'; (e.currentTarget).style.borderColor = C.border; (e.currentTarget).style.color = C.textSub; }}
                    >
                      <Edit2 size={13} />
                    </button>
                    {!isMe && (
                      deleteConfirm === m.id ? (
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <span style={{ fontSize: 11, color: '#ef4444', whiteSpace: 'nowrap' }}>Confirm?</span>
                          <button
                            onClick={() => handleDelete(m.id)}
                            disabled={deletingId === m.id}
                            style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #ef4444', backgroundColor: 'rgba(239,68,68,0.1)', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            {deletingId === m.id ? <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(null)}
                            style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer', color: C.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirm(m.id)}
                          title="Remove member"
                          style={{ width: 32, height: 32, borderRadius: 6, border: `1px solid ${C.border}`, backgroundColor: 'transparent', cursor: 'pointer', color: C.textSub, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                          onMouseEnter={e => { (e.currentTarget).style.backgroundColor = 'rgba(239,68,68,0.08)'; (e.currentTarget).style.borderColor = '#ef4444'; (e.currentTarget).style.color = '#ef4444'; }}
                          onMouseLeave={e => { (e.currentTarget).style.backgroundColor = 'transparent'; (e.currentTarget).style.borderColor = C.border; (e.currentTarget).style.color = C.textSub; }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Non-admin notice */}
      {!isAdmin && !loading && (
        <div style={{ marginTop: 20, padding: '12px 16px', backgroundColor: 'rgba(252,211,77,0.06)', border: '1px solid rgba(252,211,77,0.2)', borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={14} color="#FCD34D" />
          <span style={{ fontSize: 12, color: '#FCD34D' }}>Only administrators can add or remove staff members.</span>
        </div>
      )}

      {/* Modals */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {editMember && <EditModal member={editMember} onClose={() => setEditMember(null)} onUpdated={handleUpdated} />}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
