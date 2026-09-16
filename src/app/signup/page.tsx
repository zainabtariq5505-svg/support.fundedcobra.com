'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/browser';

function PwStrength({ pw }: { pw: string }) {
  const score = [pw.length >= 8, /[A-Z]/.test(pw), /[0-9]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
  const cols  = ['#ef4444','#f97316','#eab308','#10b981'];
  const labs  = ['Weak','Fair','Good','Strong'];
  if (!pw) return null;
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display:'flex', gap:4, marginBottom:4 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, backgroundColor: i < score ? cols[score-1] : '#1A1A2E', transition:'background .2s' }} />
        ))}
      </div>
      <span style={{ fontSize:11, color: cols[score-1] ?? '#404060', fontWeight:600 }}>{labs[score-1] ?? ''}</span>
    </div>
  );
}

export default function SignupPage() {
  const [form, setForm]     = useState({ name:'', email:'', password:'', confirm:'' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState<Record<string,string>>({});
  const [success, setSuccess] = useState('');
  const f = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e: Record<string,string> = {};
    if (!form.name.trim())                                  e.name     = 'Full name required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))   e.email    = 'Valid email required';
    if (form.password.length < 8)                           e.password = 'Min 8 characters';
    if (form.password !== form.confirm)                     e.confirm  = "Passwords don't match";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({}); setLoading(true);
    try {
      const sb = createClient();
      const { data, error } = await sb.auth.signUp({
        email: form.email.trim(), password: form.password,
        options: { data: { full_name: form.name.trim() } },
      });
      if (error) { setErrors({ form: error.message }); setLoading(false); return; }
      if (data.user && !data.session) {
        setSuccess(form.email);
        setLoading(false);
        return;
      }
      window.location.href = '/';
    } catch {
      setErrors({ form: 'Connection error. Please try again.' });
      setLoading(false);
    }
  };

  const iStyle = (k: string): React.CSSProperties => ({
    width:'100%', padding:'13px 16px',
    backgroundColor:'#0E0E1C', border:`1px solid ${errors[k] ? 'rgba(239,68,68,0.4)' : '#1A1A2E'}`,
    borderRadius:10, color:'#F0F0FF', fontSize:14, outline:'none',
    boxSizing:'border-box', transition:'border-color .2s, box-shadow .2s', fontFamily:'inherit',
  });

  if (success) return (
    <div style={{ minHeight:'100vh', background:'#08080F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'ui-sans-serif,system-ui,sans-serif' }}>
      <div style={{ textAlign:'center', maxWidth:420, padding:'0 24px' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(74,222,128,0.1)', border:'1px solid rgba(74,222,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px' }}>
          <span style={{ fontSize:32 }}>📬</span>
        </div>
        <h1 style={{ fontSize:26, fontWeight:800, color:'#F0F0FF', marginBottom:12, letterSpacing:'-0.02em' }}>Check your inbox</h1>
        <p style={{ fontSize:14, color:'#50506A', lineHeight:1.7, marginBottom:28 }}>
          We sent a confirmation link to <strong style={{ color:'#A855F7' }}>{success}</strong>.<br />
          Click it to activate your account, then sign in.
        </p>
        <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'12px 28px', background:'linear-gradient(135deg,#6D28D9,#A855F7)', color:'#fff', borderRadius:10, fontSize:14, fontWeight:700, textDecoration:'none', boxShadow:'0 4px 16px rgba(109,40,217,0.4)' }}>
          Go to Sign In <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'ui-sans-serif,system-ui,sans-serif', backgroundColor:'#08080F' }}>

      {/* ── Left decorative panel ── */}
      <div style={{ width:'42%', maxWidth:520, background:'linear-gradient(145deg,#0D0B1E 0%,#110D2A 40%,#0A0818 100%)', display:'flex', flexDirection:'column', padding:'52px 52px', position:'relative', overflow:'hidden', borderRight:'1px solid rgba(139,92,246,0.08)' }}>
        <div style={{ position:'absolute', inset:0, opacity:0.04, backgroundImage:'linear-gradient(rgba(139,92,246,1) 1px,transparent 1px),linear-gradient(90deg,rgba(139,92,246,1) 1px,transparent 1px)', backgroundSize:'40px 40px', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:-100, left:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle,rgba(109,40,217,0.18) 0%,transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-60, right:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle,rgba(168,85,247,0.1) 0%,transparent 65%)', pointerEvents:'none' }} />

        {/* Logo */}
        <div style={{ position:'relative', zIndex:1, display:'flex', alignItems:'center', gap:12, marginBottom:60 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#6D28D9,#A855F7)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 20px rgba(109,40,217,0.4)' }}>
            <svg width="22" height="22" viewBox="0 0 40 40" fill="none">
              <path d="M6 29 C5 18 12 8 20 6 C20 6 17 14 14 19 C11 24 8 27 6 29Z" fill="rgba(255,255,255,0.9)" />
              <path d="M34 29 C35 18 28 8 20 6 C20 6 23 14 26 19 C29 24 32 27 34 29Z" fill="rgba(255,255,255,0.9)" />
              <ellipse cx="20" cy="26" rx="10" ry="11" fill="white" />
              <ellipse cx="16.5" cy="23" rx="2.2" ry="2.5" fill="#6D28D9" />
              <ellipse cx="23.5" cy="23" rx="2.2" ry="2.5" fill="#6D28D9" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#F0F0FF' }}>Funded Cobra</div>
            <div style={{ fontSize:11, color:'rgba(168,85,247,0.8)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase' }}>Support Portal</div>
          </div>
        </div>

        {/* Hero text */}
        <div style={{ position:'relative', zIndex:1, flex:1 }}>
          <h1 style={{ fontSize:34, fontWeight:900, color:'#F0F0FF', lineHeight:1.1, letterSpacing:'-0.04em', marginBottom:16 }}>
            Join thousands<br />of funded<br />
            <span style={{ background:'linear-gradient(135deg,#A855F7 0%,#C084FC 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>traders</span>.
          </h1>
          <p style={{ fontSize:14, color:'rgba(180,180,210,0.55)', lineHeight:1.7, marginBottom:36, maxWidth:300 }}>
            Create your free account and get access to expert support, real-time ticket tracking, and instant responses.
          </p>

          {/* Benefits */}
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {[
              'Instant ticket submission & tracking',
              'Real-time chat with support agents',
              'File attachment & screenshot sharing',
              'Priority queue for urgent issues',
              'Multi-language support available',
            ].map(item => (
              <div key={item} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:'rgba(74,222,128,0.12)', border:'1px solid rgba(74,222,128,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={11} color="#4ADE80" />
                </div>
                <span style={{ fontSize:13, color:'rgba(180,180,210,0.55)' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{ position:'relative', zIndex:1, marginTop:40, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', backgroundColor:'#4ADE80', boxShadow:'0 0 6px #4ADE80' }} />
          <span style={{ fontSize:11, color:'#303050' }}>Funded Cobra Support Portal v2.0</span>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'52px 40px', background:'#08080F', overflowY:'auto' }}>
        <div style={{ width:'100%', maxWidth:420 }}>

          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:26, fontWeight:800, color:'#F0F0FF', letterSpacing:'-0.03em', marginBottom:10 }}>Create account</h2>
            <p style={{ fontSize:14, color:'#50506A' }}>
              Already have one?{' '}
              <Link href="/login" style={{ color:'#A855F7', fontWeight:600, textDecoration:'none' }}>Sign in →</Link>
            </p>
          </div>

          {errors.form && (
            <div style={{ backgroundColor:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.18)', borderLeft:'3px solid #ef4444', borderRadius:8, padding:'12px 16px', marginBottom:22, fontSize:13, color:'#FCA5A5', lineHeight:1.5 }}>
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:15 }}>

            {/* Name */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#6060A0', marginBottom:7, display:'block', letterSpacing:'0.04em', textTransform:'uppercase' }}>Full Name</label>
              <input placeholder="Your name" value={form.name} onChange={e => f('name',e.target.value)}
                style={iStyle('name')}
                onFocus={e => { e.target.style.borderColor='rgba(168,85,247,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(168,85,247,0.07)'; }}
                onBlur={e => { e.target.style.borderColor=errors.name?'rgba(239,68,68,0.4)':'#1A1A2E'; e.target.style.boxShadow='none'; }}
              />
              {errors.name && <div style={{ fontSize:11, color:'#ef4444', marginTop:5 }}>{errors.name}</div>}
            </div>

            {/* Email */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#6060A0', marginBottom:7, display:'block', letterSpacing:'0.04em', textTransform:'uppercase' }}>Email Address</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => f('email',e.target.value)}
                style={iStyle('email')}
                onFocus={e => { e.target.style.borderColor='rgba(168,85,247,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(168,85,247,0.07)'; }}
                onBlur={e => { e.target.style.borderColor=errors.email?'rgba(239,68,68,0.4)':'#1A1A2E'; e.target.style.boxShadow='none'; }}
              />
              {errors.email && <div style={{ fontSize:11, color:'#ef4444', marginTop:5 }}>{errors.email}</div>}
            </div>

            {/* Password */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#6060A0', marginBottom:7, display:'block', letterSpacing:'0.04em', textTransform:'uppercase' }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={showPw?'text':'password'} placeholder="Min. 8 characters" value={form.password} onChange={e => f('password',e.target.value)}
                  style={{ ...iStyle('password'), paddingRight:44 }}
                  onFocus={e => { e.target.style.borderColor='rgba(168,85,247,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(168,85,247,0.07)'; }}
                  onBlur={e => { e.target.style.borderColor=errors.password?'rgba(239,68,68,0.4)':'#1A1A2E'; e.target.style.boxShadow='none'; }}
                />
                <button type="button" onClick={() => setShowPw(p=>!p)} style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#404060', display:'flex', padding:0 }}>
                  {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
                </button>
              </div>
              <PwStrength pw={form.password} />
              {errors.password && <div style={{ fontSize:11, color:'#ef4444', marginTop:5 }}>{errors.password}</div>}
            </div>

            {/* Confirm */}
            <div>
              <label style={{ fontSize:12, fontWeight:600, color:'#6060A0', marginBottom:7, display:'block', letterSpacing:'0.04em', textTransform:'uppercase' }}>Confirm Password</label>
              <div style={{ position:'relative' }}>
                <input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => f('confirm',e.target.value)}
                  style={{ ...iStyle('confirm'), paddingRight:44 }}
                  onFocus={e => { e.target.style.borderColor='rgba(168,85,247,0.5)'; e.target.style.boxShadow='0 0 0 3px rgba(168,85,247,0.07)'; }}
                  onBlur={e => { e.target.style.borderColor=errors.confirm?'rgba(239,68,68,0.4)':'#1A1A2E'; e.target.style.boxShadow='none'; }}
                />
                {form.confirm && form.confirm === form.password && (
                  <div style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', width:18, height:18, borderRadius:'50%', background:'rgba(74,222,128,0.15)', border:'1px solid rgba(74,222,128,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <Check size={10} color="#4ADE80" />
                  </div>
                )}
              </div>
              {errors.confirm && <div style={{ fontSize:11, color:'#ef4444', marginTop:5 }}>{errors.confirm}</div>}
            </div>

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{ width:'100%', padding:'14px', background: loading ? '#1A1A2A' : 'linear-gradient(135deg,#6D28D9 0%,#9333EA 50%,#A855F7 100%)', color: loading ? '#404060' : '#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all .2s', marginTop:4, boxShadow: loading?'none':'0 4px 20px rgba(109,40,217,0.4)', letterSpacing:'0.01em' }}
              onMouseEnter={e => { if(!loading){ (e.currentTarget).style.transform='translateY(-2px)'; (e.currentTarget).style.boxShadow='0 8px 28px rgba(109,40,217,0.5)'; } }}
              onMouseLeave={e => { (e.currentTarget).style.transform='translateY(0)'; (e.currentTarget).style.boxShadow=loading?'none':'0 4px 20px rgba(109,40,217,0.4)'; }}
            >
              {loading ? (
                <><div style={{ width:16, height:16, border:'2px solid #404060', borderTopColor:'#9333EA', borderRadius:'50%', animation:'spin .7s linear infinite' }} /> Creating account…</>
              ) : (
                <>Create Free Account <ArrowRight size={15}/></>
              )}
            </button>
          </form>

          <div style={{ marginTop:24, textAlign:'center' }}>
            <span style={{ fontSize:11, color:'#282840' }}>
              By signing up you agree to our{' '}
              <Link href="/terms" style={{ color:'#303050' }}>Terms</Link>{' · '}
              <Link href="/privacy" style={{ color:'#303050' }}>Privacy</Link>
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input::placeholder { color: #252535; }
      `}</style>
    </div>
  );
}
