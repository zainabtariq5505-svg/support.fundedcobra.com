'use client';
import { useState, useEffect } from 'react';
import { Search, Plus, Copy, Edit2, Trash2, Check, Loader2, BookOpen, X } from 'lucide-react';
import { C, btn } from '@/lib/ds';
import { createClient } from '@/lib/supabase/browser';
import { useProfile } from '@/lib/supabase/hooks';
import type { SavedReply } from '@/types/database';

export default function SavedRepliesPage() {
  const profile = useProfile();
  const [replies, setReplies]   = useState<SavedReply[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showNew, setShowNew]   = useState(false);
  const [editTarget, setEditTarget] = useState<SavedReply | null>(null);
  const [form, setForm]         = useState({ title: '', content: '', category: '' });
  const [saving, setSaving]     = useState(false);

  const sb = createClient();

  const load = async () => {
    const { data } = await sb.from('saved_replies').select('*').order('created_at', { ascending: false });
    setReplies(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = replies.filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) || r.content.toLowerCase().includes(search.toLowerCase())
  );

  const copy = (r: SavedReply) => {
    navigator.clipboard.writeText(r.content).catch(() => {});
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openEdit = (r: SavedReply) => {
    setEditTarget(r);
    setForm({ title: r.title, content: r.content, category: r.category ?? '' });
    setShowNew(true);
  };

  const save = async () => {
    if (!profile || !form.title || !form.content) return;
    setSaving(true);
    if (editTarget) {
      await sb.from('saved_replies').update({ title: form.title, content: form.content, category: form.category || null }).eq('id', editTarget.id);
    } else {
      await sb.from('saved_replies').insert({ staff_id: profile.id, title: form.title, content: form.content, category: form.category || null });
    }
    setSaving(false);
    setShowNew(false);
    setEditTarget(null);
    setForm({ title: '', content: '', category: '' });
    load();
  };

  const remove = async (id: string) => {
    await sb.from('saved_replies').delete().eq('id', id);
    setReplies(p => p.filter(r => r.id !== id));
  };

  const IS: React.CSSProperties = { width: '100%', backgroundColor: C.surface3, border: `1px solid ${C.border}`, borderRadius: 6, padding: '9px 12px', color: C.text, fontSize: 13, outline: 'none', boxSizing: 'border-box' };

  return (
    <div style={{ padding: '28px 32px', backgroundColor: C.bg, minHeight: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 2 }}>Saved Replies</h1>
          {!loading && <p style={{ fontSize: 13, color: C.textSub }}>{filtered.length} repl{filtered.length !== 1 ? 'ies' : 'y'}</p>}
        </div>
        <button onClick={() => { setEditTarget(null); setForm({ title:'',content:'',category:'' }); setShowNew(true); }} style={btn.primary}>
          <Plus size={14} /> New Reply
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 12px', marginBottom: 20, maxWidth: 400 }}>
        <Search size={13} color={C.textMuted} />
        <input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text, fontSize: 13 }}
          placeholder="Search saved replies…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Modal */}
      {showNew && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 10, width: '100%', maxWidth: 560, padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{editTarget ? 'Edit Reply' : 'New Saved Reply'}</h2>
              <button onClick={() => setShowNew(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Title</label>
                <input style={IS} placeholder="E.g. Payout Verification" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Category (optional)</label>
                <input style={IS} placeholder="E.g. Payout Support" value={form.category} onChange={e => setForm(p => ({...p, category: e.target.value}))} />
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 500, color: C.textSub, marginBottom: 5, display: 'block' }}>Reply Content</label>
                <textarea rows={6} style={{ ...IS, resize: 'vertical', lineHeight: 1.6 }} placeholder="Type your saved reply…" value={form.content} onChange={e => setForm(p => ({...p, content: e.target.value}))} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setShowNew(false)} style={btn.secondary}>Cancel</button>
                <button onClick={save} disabled={saving || !form.title || !form.content}
                  style={{ ...btn.primary, flex: 1, opacity: saving || !form.title || !form.content ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 7 }}>
                  {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : editTarget ? 'Save Changes' : 'Create Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
          <Loader2 size={24} color={C.accentHi} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, padding: '64px', textAlign: 'center' }}>
          <BookOpen size={36} color={C.textMuted} style={{ margin: '0 auto 14px', display: 'block' }} />
          <p style={{ fontSize: 14, color: C.text, marginBottom: 6 }}>No saved replies yet</p>
          <p style={{ fontSize: 13, color: C.textMuted }}>Create reusable responses to speed up your support workflow.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(r => (
            <div key={r.id} style={{ backgroundColor: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{r.title}</span>
                  {r.category && <span style={{ fontSize: 11, color: C.textMuted, backgroundColor: C.surface3, padding: '1px 8px', borderRadius: 3 }}>{r.category}</span>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => copy(r)} style={{ ...btn.ghost, padding: '4px 8px', fontSize: 11 }}>
                    {copiedId === r.id ? <><Check size={12} color={C.accentHi} /> Copied</> : <><Copy size={12} /> Copy</>}
                  </button>
                  <button onClick={() => openEdit(r)} style={{ ...btn.ghost, padding: '4px 8px' }}><Edit2 size={12} /></button>
                  <button onClick={() => remove(r.id)} style={{ ...btn.ghost, padding: '4px 8px', color: '#F87171' }}><Trash2 size={12} /></button>
                </div>
              </div>
              <div style={{ padding: '12px 16px' }}>
                <pre style={{ fontSize: 12, color: C.textSub, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>{r.content}</pre>
              </div>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
