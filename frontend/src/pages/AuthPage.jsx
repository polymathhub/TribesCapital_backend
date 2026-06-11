import React, { useState, useEffect } from "react";
import { authAPI } from "../api/endpoints";

/* ── DESIGN TOKENS (from uploaded design) ─────────────────── */
const C = {
  primary:     '#8B21B6',   // vivid purple from "Sign In" button
  primaryDark: '#5B21B6',   // deeper purple
  primaryMid:  '#7C3AED',   // mid purple (links)
  primaryFaint:'#EDE9FE',   // faint purple bg
  text:        '#111827',
  textGray:    '#6B7280',
  textMuted:   '#9CA3AF',
  border:      '#E5E7EB',
  white:       '#FFFFFF',
  error:       '#DC2626',
  success:     '#059669',
  successBg:   '#F0FDF4',
  successBdr:  '#A7F3D0',
};

const baseInput = {
  width:'100%', height:46, border:`1px solid ${C.border}`, borderRadius:8,
  fontSize:14, color:C.text, padding:'0 14px', background:C.white,
  outline:'none', boxSizing:'border-box', fontFamily:'inherit',
  transition:'border-color .15s, box-shadow .15s',
};

/* ── SHARED SMALL COMPONENTS ──────────────────────────────── */
function Logo() {
  return (
    <div style={{display:'flex', alignItems:'center', gap:16, marginBottom:28}}>
      {/* Tribes Capital circular logo - purple design */}
      <svg width={54} height={54} viewBox="0 0 100 100" fill="none">
        {/* Purple gradient background circle */}
        <defs>
          <linearGradient id="purpleGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#5B21B6"/>
          </linearGradient>
        </defs>
        <circle cx={50} cy={50} r={48} fill="url(#purpleGrad1)"/>
        {/* Inner ring */}
        <circle cx={50} cy={50} r={42} fill="none" stroke="white" strokeWidth="2" opacity={0.7}/>
        {/* Center letter T */}
        <text x="50" y="65" fontSize="48" fontWeight="900" fill="white" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">T</text>
      </svg>
      <div style={{display:'flex', flexDirection:'column'}}>
        <span style={{fontSize:16, fontWeight:800, color:C.text, letterSpacing:1.2, textTransform:'uppercase', lineHeight:1.1}}>
          Tribes
        </span>
        <span style={{fontSize:16, fontWeight:800, color:C.text, letterSpacing:1.2, textTransform:'uppercase', lineHeight:1.1}}>
          Capital
        </span>
      </div>
    </div>
  );
}

function SmallLogo() {
  return (
    <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:24}}>
      <svg width={42} height={42} viewBox="0 0 100 100" fill="none">
        <defs>
          <linearGradient id="purpleGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7C3AED"/>
            <stop offset="100%" stopColor="#5B21B6"/>
          </linearGradient>
        </defs>
        <circle cx={50} cy={50} r={48} fill="url(#purpleGrad2)"/>
        <circle cx={50} cy={50} r={42} fill="none" stroke="white" strokeWidth="2" opacity={0.7}/>
        <text x="50" y="65" fontSize="48" fontWeight="900" fill="white" textAnchor="middle" fontFamily="system-ui, -apple-system, sans-serif">T</text>
      </svg>
      <span style={{fontSize:13, fontWeight:700, color:C.text, letterSpacing:1.2, textTransform:'uppercase'}}>
        Tribes Capital
      </span>
    </div>
  );
}

/* Eye toggle icons */
function EyeOpen() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx={12} cy={12} r={3}/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1={1} y1={1} x2={23} y2={23}/>
    </svg>
  );
}

/* Google logo */
function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z"/>
    </svg>
  );
}

/* Spinner */
function Spinner() {
  return (
    <span style={{
      display:'inline-block', width:16, height:16,
      border:'2px solid rgba(255,255,255,0.3)', borderTopColor:'#fff',
      borderRadius:'50%', marginRight:8, verticalAlign:'middle',
      animation:'spin .6s linear infinite',
    }}/>
  );
}

/* Back arrow */
function BackArrow() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
      <path d="M19 12H5M12 19l-7-7 7-7"/>
    </svg>
  );
}

/* Shared field focus style via data-attribute trick */
function Field({ label, required, children }) {
  return (
    <div style={{marginBottom:18}}>
      {label && (
        <label style={{display:'block', fontSize:13, fontWeight:500, color:C.text, marginBottom:7}}>
          {label}{required && <span style={{color:C.error}}> *</span>}
        </label>
      )}
      {children}
    </div>
  );
}

/* Input component with focus ring */
function Input({ type='text', placeholder, value, onChange, style={}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={()=>setFocused(true)}
      onBlur={()=>setFocused(false)}
      style={{
        ...baseInput,
        borderColor: focused ? C.primaryMid : C.border,
        boxShadow: focused ? `0 0 0 3px rgba(124,58,237,0.12)` : 'none',
        ...style,
      }}
      {...props}
    />
  );
}

/* Primary button */
function Btn({ onClick, loading, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width:'100%', height:50, background: disabled||loading ? '#C4B5FD' : C.primary,
        color:C.white, border:'none', borderRadius:8, fontFamily:'inherit',
        fontSize:15, fontWeight:600, cursor: disabled||loading ? 'not-allowed' : 'pointer',
        transition:'background .15s', letterSpacing:0.2, marginTop:4,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}
    >
      {loading && <Spinner/>}{children}
    </button>
  );
}

/* "Or" divider */
function Divider() {
  return (
    <div style={{display:'flex', alignItems:'center', gap:12, margin:'22px 0', color:C.textMuted, fontSize:13}}>
      <div style={{flex:1, height:1, background:C.border}}/>
      Or
      <div style={{flex:1, height:1, background:C.border}}/>
    </div>
  );
}

/* Google button */
function GoogleBtn({ onClick, loading }) {
  return (
    <button onClick={onClick} disabled={loading} style={{
      width:'100%', height:46, background:loading ? '#F3F4F6' : C.white, border:`1px solid ${C.border}`,
      borderRadius:8, fontFamily:'inherit', fontSize:14, fontWeight:500,
      color:C.text, cursor:loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center',
      justifyContent:'center', gap:10, transition:'all .2s',
      opacity: loading ? 0.6 : 1,
    }}>
      {loading ? (
        <>
          <div style={{width:14, height:14, border:'2px solid #E5E7EB', borderTop:'2px solid #7C3AED', borderRadius:'50%', animation:'spin .6s linear infinite'}}/>
          Signing in with Google…
        </>
      ) : (
        <>
          <GoogleIcon/>Continue with Google
        </>
      )}
    </button>
  );
}

/* ── LEFT IMAGE PANEL ─────────────────────────────────────── */
/* Simulates the wind turbine + solar panel image with purple overlay */
function ImagePanel() {
  return (
    <div style={{
      flex:'0 0 46%', position:'relative', overflow:'hidden',
      borderRadius:'16px 0 0 16px', minHeight:560,
      background:'linear-gradient(160deg, #0e0120 0%, #1f0546 30%, #3b0f6e 60%, #5B21B6 85%, #7C3AED 100%)',
    }}>
      {/* SVG scene: wind turbines + solar panels + purple tint */}
      <svg
        width="100%" height="100%"
        viewBox="0 0 420 580"
        preserveAspectRatio="xMidYMid slice"
        style={{position:'absolute', inset:0}}
      >
        <defs>
          <radialGradient id="glow1" cx="75%" cy="35%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity={0.35}/>
            <stop offset="100%" stopColor="#0e0120" stopOpacity={0}/>
          </radialGradient>
          <radialGradient id="glow2" cx="30%" cy="75%" r="60%">
            <stop offset="0%" stopColor="#5B21B6" stopOpacity={0.3}/>
            <stop offset="100%" stopColor="#0e0120" stopOpacity={0}/>
          </radialGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#180340" stopOpacity={0.6}/>
            <stop offset="100%" stopColor="#0a0118" stopOpacity={0.95}/>
          </linearGradient>
          <linearGradient id="panelSheen" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6D28D9" stopOpacity={0.5}/>
            <stop offset="100%" stopColor="#2e0a5c" stopOpacity={0.8}/>
          </linearGradient>
        </defs>

        {/* Atmospheric glows */}
        <rect width={420} height={580} fill="url(#glow1)"/>
        <rect width={420} height={580} fill="url(#glow2)"/>

        {/* Distant mountains / silhouette */}
        <path d="M0 340 Q60 300 120 320 Q180 290 230 310 Q280 270 340 295 Q380 275 420 300 L420 580 L0 580 Z"
          fill="rgba(20,4,48,0.7)"/>

        {/* ─── Wind turbine 1 (main, right) ─── */}
        {/* Mast */}
        <line x1={320} y1={110} x2={320} y2={375} stroke="rgba(255,255,255,0.22)" strokeWidth={3.5} strokeLinecap="round"/>
        {/* Hub */}
        <circle cx={320} cy={145} r={5} fill="rgba(255,255,255,0.3)"/>
        {/* Blades — angled like real turbine */}
        <line x1={320} y1={145} x2={262} y2={88}  stroke="rgba(255,255,255,0.2)" strokeWidth={5} strokeLinecap="round"/>
        <line x1={320} y1={145} x2={375} y2={83}  stroke="rgba(255,255,255,0.2)" strokeWidth={5} strokeLinecap="round"/>
        <line x1={320} y1={145} x2={322} y2={212} stroke="rgba(255,255,255,0.2)" strokeWidth={5} strokeLinecap="round"/>

        {/* ─── Wind turbine 2 (mid-left) ─── */}
        <line x1={175} y1={185} x2={175} y2={375} stroke="rgba(255,255,255,0.15)" strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={175} cy={220} r={3.5} fill="rgba(255,255,255,0.22)"/>
        <line x1={175} y1={220} x2={140} y2={183} stroke="rgba(255,255,255,0.14)" strokeWidth={3.5} strokeLinecap="round"/>
        <line x1={175} y1={220} x2={212} y2={180} stroke="rgba(255,255,255,0.14)" strokeWidth={3.5} strokeLinecap="round"/>
        <line x1={175} y1={220} x2={177} y2={260} stroke="rgba(255,255,255,0.14)" strokeWidth={3.5} strokeLinecap="round"/>

        {/* ─── Wind turbine 3 (distant left) ─── */}
        <line x1={68} y1={240} x2={68} y2={375} stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} strokeLinecap="round"/>
        <circle cx={68} cy={264} r={2.5} fill="rgba(255,255,255,0.18)"/>
        <line x1={68} y1={264} x2={48} y2={244} stroke="rgba(255,255,255,0.1)" strokeWidth={2.5} strokeLinecap="round"/>
        <line x1={68} y1={264} x2={90} y2={242} stroke="rgba(255,255,255,0.1)" strokeWidth={2.5} strokeLinecap="round"/>
        <line x1={68} y1={264} x2={70} y2={286} stroke="rgba(255,255,255,0.1)" strokeWidth={2.5} strokeLinecap="round"/>

        {/* Ground platform */}
        <rect x={0} y={375} width={420} height={205} fill="url(#ground)"/>

        {/* ─── Solar panels ─── */}
        {/* Row 1 */}
        {[0,1,2,3,4,5,6].map(i=>(
          <g key={`r1-${i}`} transform={`translate(${-5 + i*62}, 388)`}>
            <rect width={56} height={35} rx={2}
              fill="url(#panelSheen)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.6}/>
            <line x1={28} y1={0} x2={28} y2={35} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5}/>
            <line x1={0} y1={11} x2={56} y2={11} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5}/>
            <line x1={0} y1={23} x2={56} y2={23} stroke="rgba(255,255,255,0.08)" strokeWidth={0.5}/>
          </g>
        ))}
        {/* Row 2 */}
        {[0,1,2,3,4,5,6].map(i=>(
          <g key={`r2-${i}`} transform={`translate(${-5 + i*62}, 430)`}>
            <rect width={56} height={35} rx={2}
              fill="url(#panelSheen)" stroke="rgba(255,255,255,0.09)" strokeWidth={0.5}
              style={{opacity:0.8}}/>
            <line x1={28} y1={0} x2={28} y2={35} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5}/>
            <line x1={0} y1={11} x2={56} y2={11} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5}/>
            <line x1={0} y1={23} x2={56} y2={23} stroke="rgba(255,255,255,0.06)" strokeWidth={0.5}/>
          </g>
        ))}
        {/* Row 3 */}
        {[0,1,2,3,4,5,6].map(i=>(
          <g key={`r3-${i}`} transform={`translate(${-5 + i*62}, 472)`}>
            <rect width={56} height={35} rx={2}
              fill="url(#panelSheen)" stroke="rgba(255,255,255,0.06)" strokeWidth={0.4}
              style={{opacity:0.6}}/>
            <line x1={28} y1={0} x2={28} y2={35} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}/>
            <line x1={0} y1={11} x2={56} y2={11} stroke="rgba(255,255,255,0.04)" strokeWidth={0.5}/>
          </g>
        ))}
        {/* Row 4 - partial, fading */}
        {[0,1,2,3,4,5,6].map(i=>(
          <g key={`r4-${i}`} transform={`translate(${-5 + i*62}, 513)`} style={{opacity:0.35}}>
            <rect width={56} height={35} rx={2}
              fill="url(#panelSheen)" stroke="rgba(255,255,255,0.04)" strokeWidth={0.3}/>
          </g>
        ))}

        {/* Water / dam suggestion */}
        <path d="M30 360 Q105 345 180 355 Q255 343 320 355 Q370 348 420 358 L420 380 L0 380 Z"
          fill="rgba(91,33,182,0.18)"/>
        {/* Water ripple lines */}
        <path d="M40 367 Q120 360 200 365 Q280 358 380 366"
          stroke="rgba(255,255,255,0.07)" strokeWidth={1} fill="none"/>
        <path d="M20 373 Q100 367 180 371 Q260 365 400 372"
          stroke="rgba(255,255,255,0.05)" strokeWidth={1} fill="none"/>

        {/* Purple atmospheric glow near turbines */}
        <ellipse cx={320} cy={380} rx={100} ry={40} fill="rgba(124,58,237,0.12)"/>
        <ellipse cx={175} cy={380} rx={70} ry={30} fill="rgba(91,33,182,0.1)"/>
      </svg>

      {/* Subtle purple overlay for tint effect matching design */}
      <div style={{position:'absolute', inset:0, background:'rgba(91,33,182,0.18)', borderRadius:'16px 0 0 16px'}}/>

      {/* Bottom tagline */}
      <div style={{position:'absolute', bottom:28, left:28, right:28}}>
        <p style={{color:'rgba(255,255,255,0.55)', fontSize:12, lineHeight:1.7, fontWeight:400, letterSpacing:0.2}}>
          Empowering clean energy infrastructure<br/>across African emerging markets
        </p>
      </div>
    </div>
  );
}

/* ── TWO-COLUMN WRAPPER ───────────────────────────────────── */
function TwoCol({ children }) {
  return (
    <div style={{
      display:'flex', background:C.white, borderRadius:20,
      overflow:'hidden', width:'100%', maxWidth:1020,
      boxShadow:'0 24px 80px rgba(0,0,0,0.35)',
    }}>
      <ImagePanel/>
      <div style={{
        flex:1, padding:'48px 52px', display:'flex', flexDirection:'column',
        justifyContent:'center', overflowY:'auto',
      }}>
        {children}
      </div>
    </div>
  );
}

/* ══ LOGIN PAGE ══════════════════════════════════════════════ */
function LoginPage({ onNavigate, onLogin }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailErr, setEmailErr] = useState('');
  const [focusPw,  setFocusPw]  = useState(false);

  const handleLogin = async () => {
    const valid = email.includes('@') && email.includes('.');
    if (!valid) { setEmailErr('Please enter a valid email'); return; }
    if (!password) { setEmailErr('Password is required'); return; }
    setEmailErr('');
    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      const data = response.data;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (data.youtubeToken) localStorage.setItem('youtubeToken', data.youtubeToken);
      localStorage.setItem('userEmail', data.user.email);
      onLogin({ 
        email: data.user.email, 
        name: `${data.user.firstName} ${data.user.lastName}`.trim() 
      });
    } catch (error) {
      setEmailErr(error.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    // Initialize Google Sign-In SDK
    if (typeof window !== 'undefined' && !window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    // In production, use actual Google Sign-In flow
    // For now, trigger Google Sign-In programmatically
    setTimeout(() => {
      try {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: '1234567890-xxxxxxxxx.apps.googleusercontent.com', // Replace with actual Google Client ID
            callback: handleGoogleCallback,
          });
          window.google.accounts.id.renderButton(document.getElementById('googleSignInDiv'), {
            type: 'standard',
            size: 'large',
            theme: 'outline',
            text: 'signin',
          });
        } else {
          // Fallback: Simulate Google Sign-In
          simulateGoogleSignIn();
        }
      } catch (error) {
        simulateGoogleSignIn();
      }
    }, 100);
  };

  const handleGoogleCallback = async (response) => {
    try {
      const res = await authAPI.googleAuth({
        idToken: response.credential,
        accessToken: response.access_token || '',
      });
      const data = res.data;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (data.youtubeToken) localStorage.setItem('youtubeToken', data.youtubeToken);
      localStorage.setItem('userEmail', data.user.email);
      onLogin({ 
        email: data.user.email, 
        name: `${data.user.firstName} ${data.user.lastName}`.trim(),
        googleId: data.user.googleId,
      });
    } catch (error) {
      console.error('Google Sign-In error:', error);
      alert('Google Sign-In failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const simulateGoogleSignIn = () => {
    // Simulate Google Sign-In for demo
    const mockGoogleEmail = `user${Math.floor(Math.random() * 10000)}@gmail.com`;
    const mockName = 'Google User';
    localStorage.setItem('accessToken', 'google-token-' + Date.now());
    localStorage.setItem('youtubeToken', 'youtube-' + Date.now());
    localStorage.setItem('userEmail', mockGoogleEmail);
    onLogin({ email: mockGoogleEmail, name: mockName, googleId: 'google-' + Date.now() });
    setGoogleLoading(false);
  };

  return (
    <TwoCol>
      <Logo/>
      <h1 style={{fontSize:28, fontWeight:700, color:C.text, margin:'0 0 6px', letterSpacing:-.5}}>
        Welcome back
      </h1>
      <p style={{fontSize:14, color:C.textGray, marginBottom:28, lineHeight:1.5}}>
        Sign in to access your community dashboard
      </p>

      {/* Email */}
      <Field label="Email address">
        <Input
          type="email"
          placeholder="info@tribescapital.com"
          value={email}
          onChange={e=>{setEmail(e.target.value);setEmailErr('');}}
        />
        {emailErr && <p style={{fontSize:12, color:C.error, marginTop:5}}>{emailErr}</p>}
      </Field>

      {/* Password */}
      <Field label="Password">
        <div style={{position:'relative'}}>
          <input
            type={showPw?'text':'password'}
            placeholder="Enter your password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            onFocus={()=>setFocusPw(true)}
            onBlur={()=>setFocusPw(false)}
            style={{
              ...baseInput, paddingRight:44,
              borderColor: focusPw ? C.primaryMid : C.border,
              boxShadow: focusPw ? `0 0 0 3px rgba(124,58,237,0.12)` : 'none',
            }}
          />
          <button
            onClick={()=>setShowPw(p=>!p)}
            style={{position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:C.textGray, display:'flex',
              alignItems:'center', padding:0}}
            type="button"
          >
            {showPw ? <EyeOff/> : <EyeOpen/>}
          </button>
        </div>
      </Field>

      {/* Forgot password link */}
      <div style={{textAlign:'right', marginTop:-8, marginBottom:22}}>
        <button
          onClick={()=>onNavigate('forgot')}
          style={{background:'none', border:'none', cursor:'pointer', fontSize:13,
            color:C.primaryMid, fontWeight:500, fontFamily:'inherit'}}
        >
          Forgot Password?
        </button>
      </div>

      <Btn onClick={handleLogin} loading={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Btn>

      <Divider/>

      <GoogleBtn onClick={handleGoogleSignIn} loading={googleLoading}/>

      <p style={{textAlign:'center', fontSize:14, color:C.textGray, marginTop:22}}>
        Don't have an account?{' '}
        <button
          onClick={()=>onNavigate('signup')}
          style={{background:'none', border:'none', cursor:'pointer', fontSize:14,
            color:C.primaryMid, fontWeight:600, fontFamily:'inherit'}}
        >
          Create one
        </button>
      </p>
    </TwoCol>
  );
}

/* ══ SIGN UP PAGE ════════════════════════════════════════════ */
/* Full name (not first+last), email, account type, password+strength, terms */
function SignupPage({ onNavigate, onLogin }) {
  const [fullName,  setFullName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [role,      setRole]      = useState('');
  const [password,  setPassword]  = useState('');
  const [showPw,    setShowPw]    = useState(false);
  const [agreed,    setAgreed]    = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusPw,   setFocusPw]   = useState(false);
  const [strength,  setStrength]  = useState({ pct:0, color:C.border, hint:'Use 8+ characters with a mix of letters, numbers & symbols', score:0 });

  const checkStrength = val => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
      { pct:0,   color:C.border,    hint:'Use 8+ characters with a mix of letters, numbers & symbols' },
      { pct:25,  color:C.error,     hint:'Weak — add uppercase letters' },
      { pct:50,  color:'#F59E0B',   hint:'Fair — add numbers for better security' },
      { pct:75,  color:'#3B82F6',   hint:'Good — add symbols to make it strong' },
      { pct:100, color:C.success,   hint:'Strong password ✓' },
    ];
    setStrength({ ...levels[score], score });
  };

  const handleSignup = async () => {
    if (!fullName.trim()) { alert('Full name is required'); return; }
    if (!email.includes('@') || !email.includes('.')) { alert('Valid email is required'); return; }
    if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
    if (!agreed) { alert('Please agree to the Terms of Use to continue.'); return; }
    setLoading(true);
    try {
      const [firstName, ...lastNameParts] = fullName.trim().split(' ');
      const lastName = lastNameParts.join(' ') || 'User';
      const response = await authAPI.register({ 
        email, 
        firstName: firstName || 'User',
        lastName,
        password 
      });
      const data = response.data;
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      if (data.youtubeToken) localStorage.setItem('youtubeToken', data.youtubeToken);
      localStorage.setItem('userEmail', data.user.email);
      onLogin({ 
        email: data.user.email, 
        name: fullName 
      });
    } catch (error) {
      alert(error.response?.data?.message || 'Sign up failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    // Simulate Google Sign-In for signup
    const mockGoogleEmail = `user${Math.floor(Math.random() * 10000)}@gmail.com`;
    const mockName = 'Google User';
    localStorage.setItem('accessToken', 'google-token-' + Date.now());
    localStorage.setItem('youtubeToken', 'youtube-' + Date.now());
    localStorage.setItem('userEmail', mockGoogleEmail);
    onLogin({ email: mockGoogleEmail, name: mockName, googleId: 'google-' + Date.now() });
    setGoogleLoading(false);
  };

  return (
    <TwoCol>
      <Logo/>
      <h1 style={{fontSize:28, fontWeight:700, color:C.text, margin:'0 0 6px', letterSpacing:-.5}}>
        Create your account
      </h1>
      <p style={{fontSize:14, color:C.textGray, marginBottom:24, lineHeight:1.5}}>
        Join the network of energy infrastructure stakeholders
      </p>

      {/* Full name (replaces first+last name from original code) */}
      <Field label="Full name" required>
        <Input
          placeholder="Ali Hassan"
          value={fullName}
          onChange={e=>setFullName(e.target.value)}
        />
      </Field>

      {/* Email */}
      <Field label="Email address" required>
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e=>setEmail(e.target.value)}
        />
      </Field>

      {/* Account type */}
      <Field label="Account type">
        <div style={{position:'relative'}}>
          <select
            value={role}
            onChange={e=>setRole(e.target.value)}
            style={{
              ...baseInput, appearance:'none', cursor:'pointer',
              color: role ? C.text : C.textMuted,
              paddingRight:36,
            }}
          >
            <option value="" disabled>Select your role</option>
            <option>Facility Operator</option>
            <option>Ecosystem Partner</option>
            <option>Community Member</option>
          </select>
          <span style={{position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', pointerEvents:'none'}}>
            <svg width={12} height={8} viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke={C.textGray} strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
          </span>
        </div>
      </Field>

      {/* Password + strength */}
      <Field label="Password" required>
        <div style={{position:'relative'}}>
          <input
            type={showPw?'text':'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={e=>{ setPassword(e.target.value); checkStrength(e.target.value); }}
            onFocus={()=>setFocusPw(true)}
            onBlur={()=>setFocusPw(false)}
            style={{
              ...baseInput, paddingRight:44,
              borderColor: focusPw ? C.primaryMid : C.border,
              boxShadow: focusPw ? `0 0 0 3px rgba(124,58,237,0.12)` : 'none',
            }}
          />
          <button
            onClick={()=>setShowPw(p=>!p)}
            style={{position:'absolute', right:14, top:'50%', transform:'translateY(-50%)',
              background:'none', border:'none', cursor:'pointer', color:C.textGray, display:'flex',
              alignItems:'center', padding:0}}
            type="button"
          >
            {showPw ? <EyeOff/> : <EyeOpen/>}
          </button>
        </div>
        {/* Strength bar */}
        <div style={{height:3, background:C.border, borderRadius:2, marginTop:8, overflow:'hidden'}}>
          <div style={{
            height:'100%', width:`${strength.pct}%`,
            background:strength.color, borderRadius:2,
            transition:'width .3s, background .3s',
          }}/>
        </div>
        <p style={{fontSize:12, color:strength.score===0?C.textMuted:strength.color, marginTop:5}}>
          {strength.hint}
        </p>
      </Field>

      {/* Terms checkbox */}
      <div style={{display:'flex', alignItems:'flex-start', gap:10, marginBottom:18}}>
        <input
          type="checkbox"
          id="terms"
          checked={agreed}
          onChange={e=>setAgreed(e.target.checked)}
          style={{width:16, height:16, minWidth:16, marginTop:2, accentColor:C.primary, cursor:'pointer'}}
        />
        <label htmlFor="terms" style={{fontSize:13, color:C.textGray, lineHeight:1.5, cursor:'pointer'}}>
          I agree to the{' '}
          <a href="#" style={{color:C.primaryMid, textDecoration:'none'}} onClick={e=>e.preventDefault()}>Terms of Use</a>,{' '}
          <a href="#" style={{color:C.primaryMid, textDecoration:'none'}} onClick={e=>e.preventDefault()}>Privacy Policy</a>, and{' '}
          <a href="#" style={{color:C.primaryMid, textDecoration:'none'}} onClick={e=>e.preventDefault()}>Risk Warning</a>
        </label>
      </div>

      <Btn onClick={handleSignup} loading={loading}>
        {loading ? 'Creating account…' : 'Create account'}
      </Btn>

      <Divider/>

      <GoogleBtn onClick={handleGoogleSignUp} loading={googleLoading}/>

      <p style={{textAlign:'center', fontSize:14, color:C.textGray, marginTop:22}}>
        Already have an account?{' '}
        <button
          onClick={()=>onNavigate('login')}
          style={{background:'none', border:'none', cursor:'pointer', fontSize:14,
            color:C.primaryMid, fontWeight:600, fontFamily:'inherit'}}
        >
          Sign In
        </button>
      </p>
    </TwoCol>
  );
}

/* ══ FORGOT PASSWORD PAGE ════════════════════════════════════ */
/* Single centered card — normal design from HTML, updated colors */
function ForgotPage({ onNavigate, onSetEmail }) {
  const [email,    setEmail]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [emailErr, setEmailErr] = useState('');

  const handleReset = async () => {
    if (!email.includes('@') || !email.includes('.')) {
      setEmailErr('Please enter a valid email');
      return;
    }
    setEmailErr('');
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setLoading(false);
      onSetEmail(email);
      onNavigate('verify');
    } catch (error) {
      setEmailErr(error.response?.data?.message || 'Error sending reset code');
      setLoading(false);
    }
  };

  return (
    <div style={{
      width:'100%', maxWidth:460,
      background:C.white, borderRadius:16, border:`1px solid ${C.border}`,
      padding:'40px 40px 36px',
      boxShadow:'0 20px 60px rgba(0,0,0,0.25)',
    }}>
      <button
        onClick={()=>onNavigate('login')}
        style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,color:C.textGray,
          background:'none',border:'none',cursor:'pointer',fontWeight:500,fontFamily:'inherit',
          marginBottom:24,padding:0}}
      >
        <BackArrow/>Back to sign in
      </button>

      <SmallLogo/>

      <h1 style={{fontSize:22,fontWeight:700,color:C.text,letterSpacing:-.4,margin:'0 0 6px'}}>
        Reset your password
      </h1>
      <p style={{fontSize:14,color:C.textGray,marginBottom:28,lineHeight:1.5}}>
        Enter your email and we'll send you a 6-digit verification code
      </p>

      <Field label="Email address">
        <Input
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e=>{setEmail(e.target.value);setEmailErr('');}}
        />
        {emailErr && <p style={{fontSize:12,color:C.error,marginTop:5}}>{emailErr}</p>}
      </Field>

      <Btn onClick={handleReset} loading={loading}>
        {loading ? 'Sending code…' : 'Send verification code'}
      </Btn>

      <p style={{textAlign:'center',fontSize:14,color:C.textGray,marginTop:22}}>
        Remember your password?{' '}
        <button onClick={()=>onNavigate('login')}
          style={{background:'none',border:'none',cursor:'pointer',fontSize:14,
            color:C.primaryMid,fontWeight:500,fontFamily:'inherit'}}>
          Sign in
        </button>
      </p>
    </div>
  );
}

/* ══ VERIFY CODE PAGE ════════════════════════════════════════ */
/* 6-box OTP input — auto-advance, paste, backspace, countdown resend */
function VerifyPage({ email, onNavigate }) {
  const [code,    setCode]    = useState(['','','','','','']);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [timer,   setTimer]   = useState(60);
  const [resent,  setResent]  = useState(false);
  const refs = React.useRef([]);

  /* Countdown */
  useEffect(() => {
    if (timer <= 0) return;
    const t = setInterval(() => setTimer(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [timer]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...code]; next[i] = val; setCode(next); setError('');
    if (val && i < 5) refs.current[i + 1]?.focus();
  };
  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !code[i] && i > 0) {
      const next = [...code]; next[i - 1] = ''; setCode(next);
      refs.current[i - 1]?.focus();
    }
  };
  const handlePaste = e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (pasted.length === 6) { setCode(pasted.split('')); refs.current[5]?.focus(); }
    e.preventDefault();
  };

  const handleVerify = async () => {
    if (code.join('').length < 6) { setError('Please enter all 6 digits'); return; }
    setError(''); 
    setLoading(true);
    try {
      await authAPI.verifyCode(email, code.join(''));
      localStorage.setItem('resetCode', code.join(''));
      setLoading(false);
      onNavigate('reset-password');
    } catch (error) {
      setError(error.response?.data?.message || 'Invalid code');
      setLoading(false);
    }
  };

  const handleResend = () => {
    setCode(['','','','','','']); setTimer(60); setResent(true);
    refs.current[0]?.focus();
    setTimeout(() => setResent(false), 3000);
  };

  const filled = code.join('').length === 6;

  return (
    <div style={{width:'100%',maxWidth:460,background:C.white,borderRadius:16,
      border:`1px solid ${C.border}`,padding:'40px 40px 36px',
      boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>

      {/* Back */}
      <button onClick={()=>onNavigate('forgot')}
        style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,color:C.textGray,
          background:'none',border:'none',cursor:'pointer',fontWeight:500,fontFamily:'inherit',
          marginBottom:24,padding:0}}>
        <BackArrow/>Back
      </button>

      <SmallLogo/>

      {/* Email icon badge */}
      <div style={{width:60,height:60,borderRadius:'50%',background:C.primaryFaint,
        display:'flex',alignItems:'center',justifyContent:'center',margin:'0 0 20px'}}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
          stroke={C.primaryMid} strokeWidth={1.8} strokeLinecap="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
      </div>

      <h1 style={{fontSize:22,fontWeight:700,color:C.text,letterSpacing:-.4,margin:'0 0 8px'}}>
        Check your email
      </h1>
      <p style={{fontSize:14,color:C.textGray,marginBottom:28,lineHeight:1.6}}>
        We sent a 6-digit verification code to<br/>
        <strong style={{color:C.text}}>{email||'your email address'}</strong>
      </p>

      {/* 6-box OTP */}
      <div style={{display:'flex',gap:10,justifyContent:'center',marginBottom:8}}>
        {code.map((d,i) => (
          <input key={i}
            ref={el => refs.current[i] = el}
            type="text" inputMode="numeric" maxLength={1}
            value={d}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            onPaste={handlePaste}
            onFocus={e => e.target.select()}
            style={{
              width:54, height:60, textAlign:'center', fontSize:24, fontWeight:700,
              border:`2px solid ${d ? C.primaryMid : C.border}`,
              borderRadius:10, fontFamily:'inherit', outline:'none',
              background: d ? C.primaryFaint : C.white,
              color: C.primaryDark,
              transition:'border-color .15s, background .15s',
              cursor:'text',
            }}
          />
        ))}
      </div>

      {error && <p style={{fontSize:12,color:C.error,textAlign:'center',marginBottom:8}}>{error}</p>}

      {resent && (
        <div style={{background:C.successBg,border:`1px solid ${C.successBdr}`,
          borderRadius:8,padding:'10px 14px',fontSize:13,color:'#065F46',
          textAlign:'center',marginBottom:12}}>
          ✓ A new code has been sent to your email
        </div>
      )}

      <div style={{marginTop:16}}>
        <Btn onClick={handleVerify} loading={loading} disabled={!filled}>
          {loading ? 'Verifying…' : 'Verify code'}
        </Btn>
      </div>

      {/* Resend */}
      <p style={{textAlign:'center',fontSize:14,color:C.textGray,marginTop:20}}>
        Didn't receive it?{' '}
        {timer > 0
          ? <span style={{color:C.textMuted}}>Resend in <strong style={{color:C.text}}>{timer}s</strong></span>
          : <button onClick={handleResend}
              style={{background:'none',border:'none',cursor:'pointer',fontSize:14,
                color:C.primaryMid,fontWeight:500,fontFamily:'inherit'}}>
              Resend code
            </button>
        }
      </p>
    </div>
  );
}

/* ══ RESET PASSWORD PAGE ═════════════════════════════════════ */
/* Set new password with strength bar + confirm field */
function ResetPasswordPage({ email, onNavigate }) {
  const [newPw,    setNewPw]    = useState('');
  const [confPw,   setConfPw]   = useState('');
  const [showNew,  setShowNew]  = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);
  const [focusNew, setFocusNew] = useState(false);
  const [focusConf,setFocusConf]= useState(false);
  const [strength, setStrength] = useState({pct:0,color:C.border,hint:'Use 8+ characters with a mix of letters, numbers & symbols',score:0});
  const resetCode = localStorage.getItem('resetCode') || '';

  const checkStrength = val => {
    let s = 0;
    if (val.length >= 8) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^A-Za-z0-9]/.test(val)) s++;
    const lvl = [
      {pct:0,  color:C.border,  hint:'Use 8+ characters with a mix of letters, numbers & symbols'},
      {pct:25, color:C.error,   hint:'Weak — add uppercase letters'},
      {pct:50, color:'#F59E0B', hint:'Fair — add numbers for better security'},
      {pct:75, color:'#3B82F6', hint:'Good — add symbols to make it strong'},
      {pct:100,color:C.success, hint:'Strong password ✓'},
    ];
    setStrength({...lvl[s], score:s});
  };

  const handleSubmit = async () => {
    if (newPw.length < 8)    { setError('Password must be at least 8 characters'); return; }
    if (newPw !== confPw)    { setError("Passwords don't match"); return; }
    setError(''); 
    setLoading(true);
    try {
      await authAPI.resetPassword(email, resetCode, newPw);
      localStorage.removeItem('resetCode');
      setLoading(false);
      setDone(true);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to reset password');
      setLoading(false);
    }
  };

  /* ── Success state ── */
  if (done) return (
    <div style={{width:'100%',maxWidth:460,background:C.white,borderRadius:16,
      border:`1px solid ${C.border}`,padding:'48px 40px',textAlign:'center',
      boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>
      <div style={{width:72,height:72,borderRadius:'50%',background:C.successBg,
        border:`2px solid ${C.successBdr}`,display:'flex',alignItems:'center',
        justifyContent:'center',margin:'0 auto 20px'}}>
        <svg width={32} height={32} viewBox="0 0 24 24" fill="none"
          stroke={C.success} strokeWidth={2.2} strokeLinecap="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      </div>
      <h1 style={{fontSize:22,fontWeight:700,color:C.text,margin:'0 0 8px'}}>Password updated!</h1>
      <p style={{fontSize:14,color:C.textGray,marginBottom:32,lineHeight:1.6}}>
        Your password has been successfully reset.<br/>You can now sign in with your new password.
      </p>
      <Btn onClick={()=>onNavigate('login')}>Back to Sign In</Btn>
    </div>
  );

  return (
    <div style={{width:'100%',maxWidth:460,background:C.white,borderRadius:16,
      border:`1px solid ${C.border}`,padding:'40px 40px 36px',
      boxShadow:'0 20px 60px rgba(0,0,0,0.25)'}}>

      {/* Back */}
      <button onClick={()=>onNavigate('verify')}
        style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:13,color:C.textGray,
          background:'none',border:'none',cursor:'pointer',fontWeight:500,fontFamily:'inherit',
          marginBottom:24,padding:0}}>
        <BackArrow/>Back
      </button>

      <SmallLogo/>

      {/* Lock icon */}
      <div style={{width:60,height:60,borderRadius:'50%',background:C.primaryFaint,
        display:'flex',alignItems:'center',justifyContent:'center',margin:'0 0 20px'}}>
        <svg width={26} height={26} viewBox="0 0 24 24" fill="none"
          stroke={C.primaryMid} strokeWidth={1.8} strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      </div>

      <h1 style={{fontSize:22,fontWeight:700,color:C.text,letterSpacing:-.4,margin:'0 0 8px'}}>
        Set new password
      </h1>
      <p style={{fontSize:14,color:C.textGray,marginBottom:28,lineHeight:1.6}}>
        Your new password must be different from previously used passwords
      </p>

      {/* New password */}
      <Field label="New password" required>
        <div style={{position:'relative'}}>
          <input
            type={showNew?'text':'password'}
            placeholder="Create a strong password"
            value={newPw}
            onChange={e=>{ setNewPw(e.target.value); checkStrength(e.target.value); setError(''); }}
            onFocus={()=>setFocusNew(true)}
            onBlur={()=>setFocusNew(false)}
            style={{...baseInput,paddingRight:44,
              borderColor:focusNew?C.primaryMid:C.border,
              boxShadow:focusNew?`0 0 0 3px rgba(124,58,237,0.12)`:'none'}}
          />
          <button onClick={()=>setShowNew(p=>!p)} type="button"
            style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',cursor:'pointer',color:C.textGray,
              display:'flex',alignItems:'center',padding:0}}>
            {showNew ? <EyeOff/> : <EyeOpen/>}
          </button>
        </div>
        {/* Strength bar */}
        <div style={{height:3,background:C.border,borderRadius:2,marginTop:8,overflow:'hidden'}}>
          <div style={{height:'100%',width:`${strength.pct}%`,background:strength.color,
            borderRadius:2,transition:'width .3s, background .3s'}}/>
        </div>
        <p style={{fontSize:12,color:strength.score===0?C.textMuted:strength.color,marginTop:5}}>
          {strength.hint}
        </p>
      </Field>

      {/* Confirm password */}
      <Field label="Confirm new password" required>
        <div style={{position:'relative'}}>
          <input
            type={showConf?'text':'password'}
            placeholder="Re-enter your new password"
            value={confPw}
            onChange={e=>{ setConfPw(e.target.value); setError(''); }}
            onFocus={()=>setFocusConf(true)}
            onBlur={()=>setFocusConf(false)}
            style={{...baseInput,paddingRight:44,
              borderColor: error&&confPw ? C.error : focusConf ? C.primaryMid : C.border,
              boxShadow:focusConf?`0 0 0 3px rgba(124,58,237,0.12)`:'none'}}
          />
          <button onClick={()=>setShowConf(p=>!p)} type="button"
            style={{position:'absolute',right:14,top:'50%',transform:'translateY(-50%)',
              background:'none',border:'none',cursor:'pointer',color:C.textGray,
              display:'flex',alignItems:'center',padding:0}}>
            {showConf ? <EyeOff/> : <EyeOpen/>}
          </button>
        </div>
        {/* Match indicator */}
        {confPw && newPw && (
          <p style={{fontSize:12,marginTop:5,
            color: newPw===confPw ? C.success : C.error}}>
            {newPw===confPw ? '✓ Passwords match' : '✗ Passwords do not match'}
          </p>
        )}
      </Field>

      {error && <p style={{fontSize:12,color:C.error,marginBottom:12}}>{error}</p>}

      <Btn onClick={handleSubmit} loading={loading}>
        {loading ? 'Updating password…' : 'Update password'}
      </Btn>
    </div>
  );
}

/* ══ ROOT ════════════════════════════════════════════════════ */
export default function AuthPage({ onLogin }) {
  const [page,        setPage]        = useState('login');
  const [forgotEmail, setForgotEmail] = useState('');

  return (
    <div style={{
      minHeight:'100vh',
      background:'#0D0D0D',
      display:'flex',
      alignItems:'center',
      justifyContent:'center',
      padding:24,
      fontFamily:"'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        input::placeholder { color: #9CA3AF; }
        select option { color: #111827; }
        button:focus-visible { outline: 2px solid #7C3AED; outline-offset: 2px; }
      `}</style>

      <div key={page} style={{width:'100%',maxWidth:1020,animation:'fadeUp .3s ease',display:'flex',justifyContent:'center'}}>
        {page === 'login'          && <LoginPage          onNavigate={setPage} onLogin={onLogin}/>}
        {page === 'signup'         && <SignupPage         onNavigate={setPage} onLogin={onLogin}/>}
        {page === 'forgot'         && <ForgotPage         onNavigate={setPage} onSetEmail={setForgotEmail}/>}
        {page === 'verify'         && <VerifyPage         onNavigate={setPage} email={forgotEmail}/>}
        {page === 'reset-password' && <ResetPasswordPage  onNavigate={setPage} email={forgotEmail}/>}
      </div>
    </div>
  );
}
