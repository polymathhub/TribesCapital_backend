import React, { useState, useEffect, useRef } from 'react';
import { authAPI } from '../api/endpoints';

/* ──────── DESIGN TOKENS ──────────── */
const C = {
  primary: '#8B21B6',
  primaryDark: '#5B21B6',
  primaryMid: '#7C3AED',
  primaryFaint: '#EDE9FE',
  text: '#111827',
  textGray: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  white: '#FFFFFF',
  error: '#DC2626',
  success: '#059669',
};

const baseInput = {
  width: '100%',
  height: 46,
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  fontSize: 14,
  color: C.text,
  padding: '0 14px',
  background: C.white,
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  transition: 'border-color .15s, box-shadow .15s',
};

/* ──────── HOOKS ──────────── */
function useBreakpoint() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024 };
}

/* ──────── COMPONENTS ──────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
      <svg width={36} height={36} viewBox="0 0 36 36" fill="none">
        <circle cx={18} cy={18} r={16} stroke={C.primaryMid} strokeWidth={2} />
        <path d="M10 18h16M18 10v16" stroke={C.primaryMid} strokeWidth={2} strokeLinecap="round" />
        <circle cx={18} cy={18} r={3} fill={C.primaryMid} />
      </svg>
      <span style={{ fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: 2.5, textTransform: 'uppercase' }}>
        Tribes Capital
      </span>
    </div>
  );
}

function EyeOpen() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  );
}

function EyeOff() {
  return (
    <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1={1} y1={1} x2={23} y2={23} />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" />
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" />
    </svg>
  );
}

function Spinner() {
  return (
    <span
      style={{
        display: 'inline-block',
        width: 16,
        height: 16,
        border: '2px solid rgba(255,255,255,0.3)',
        borderTopColor: '#fff',
        borderRadius: '50%',
        marginRight: 8,
        verticalAlign: 'middle',
        animation: 'spin 0.6s linear infinite',
      }}
    />
  );
}

function Btn({ onClick, loading, children, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        height: 50,
        background: disabled || loading ? '#C4B5FD' : C.primary,
        color: C.white,
        border: 'none',
        borderRadius: 8,
        fontFamily: 'inherit',
        fontSize: 15,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background .15s',
        letterSpacing: 0.2,
        marginTop: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0', color: C.textMuted, fontSize: 13 }}>
      <div style={{ flex: 1, height: 1, background: C.border }} />
      Or
      <div style={{ flex: 1, height: 1, background: C.border }} />
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: C.text, marginBottom: 7 }}>
          {label}
          {required && <span style={{ color: C.error }}> *</span>}
        </label>
      )}
      {children}
    </div>
  );
}

function Input({ type = 'text', placeholder, value, onChange, style = {}, ...props }) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
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

function ImagePanel() {
  return (
    <div
      style={{
        flex: '0 0 46%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px 0 0 16px',
        minHeight: 560,
        background: 'linear-gradient(160deg, #0e0120 0%, #1f0546 30%, #3b0f6e 60%, #5B21B6 85%, #7C3AED 100%)',
      }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(91,33,182,0.18)', borderRadius: '16px 0 0 16px' }} />
      <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28 }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12, lineHeight: 1.7, fontWeight: 400, letterSpacing: 0.2 }}>
          Empowering clean energy infrastructure
          <br />
          across African emerging markets
        </p>
      </div>
    </div>
  );
}

function TwoCol({ children }) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const singleCol = !isDesktop;
  return (
    <div
      style={{
        display: 'flex',
        background: C.white,
        borderRadius: isMobile ? 16 : 20,
        overflow: 'hidden',
        width: '100%',
        maxWidth: singleCol ? 460 : 1020,
        boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
      }}
    >
      {isDesktop && <ImagePanel />}
      <div
        style={{
          flex: 1,
          padding: isMobile ? '32px 24px 28px' : isTablet ? '40px 44px' : '48px 52px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          overflowY: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ──────── LOGIN PAGE ──────────── */
function LoginPage({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusPw, setFocusPw] = useState(false);
  const { isMobile } = useBreakpoint();

  const handleLogin = async () => {
    setError('');
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.login({ email, password });
      if (response.data && response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', response.data.user?.firstName || email.split('@')[0]);
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (event) => {
    // Handle Google OAuth response
    try {
      setLoading(true);
      setError('');
      // This will be triggered by the Google Sign-In callback
      // The credential will be available in event
      if (event && event.credential) {
        const response = await authAPI.googleAuth({ idToken: event.credential });
        if (response.data && response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          localStorage.setItem('userEmail', response.data.user?.email || '');
          localStorage.setItem('userName', response.data.user?.firstName || 'User');
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-in failed. Please try again.');
      console.error('Google sign-in error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TwoCol>
      <Logo />
      <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.text, margin: '0 0 6px', letterSpacing: -0.5 }}>
        Welcome back
      </h1>
      <p style={{ fontSize: 14, color: C.textGray, marginBottom: isMobile ? 20 : 28, lineHeight: 1.5 }}>
        Sign in to access your community dashboard
      </p>

      {error && (
        <div style={{ background: '#FEE2E2', border: `1px solid ${C.error}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: C.error }}>
          {error}
        </div>
      )}

      <Field label="Email address">
        <Input
          type="email"
          placeholder="info@tribescapital.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError('');
          }}
          disabled={loading}
        />
      </Field>

      <Field label="Password">
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            onFocus={() => setFocusPw(true)}
            onBlur={() => setFocusPw(false)}
            disabled={loading}
            style={{
              ...baseInput,
              paddingRight: 44,
              borderColor: focusPw ? C.primaryMid : C.border,
              boxShadow: focusPw ? `0 0 0 3px rgba(124,58,237,0.12)` : 'none',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => setShowPw((p) => !p)}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.textGray,
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            type="button"
            disabled={loading}
          >
            {showPw ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
      </Field>

      <div style={{ textAlign: 'right', marginTop: -8, marginBottom: 22 }}>
        <button
          onClick={() => onNavigate('forgot')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 13,
            color: C.primaryMid,
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
          disabled={loading}
        >
          Forgot Password?
        </button>
      </div>

      <Btn onClick={handleLogin} loading={loading} disabled={loading}>
        {loading ? 'Signing in…' : 'Sign In'}
      </Btn>

      <Divider />

      <GoogleSignInButton onSuccess={handleGoogleSignIn} loading={loading} />

      <p style={{ textAlign: 'center', fontSize: 14, color: C.textGray, marginTop: 22 }}>
        Don't have an account?{' '}
        <button
          onClick={() => onNavigate('signup')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: C.primaryMid,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
          disabled={loading}
        >
          Create one
        </button>
      </p>
    </TwoCol>
  );
}

/* ──────── SIGNUP PAGE ──────────── */
function SignupPage({ onNavigate, onLoginSuccess }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusPw, setFocusPw] = useState(false);
  const [strength, setStrength] = useState({
    pct: 0,
    color: C.border,
    hint: 'Use 8+ characters with a mix of letters, numbers & symbols',
    score: 0,
  });
  const { isMobile } = useBreakpoint();

  const checkStrength = (val) => {
    let score = 0;
    if (val.length >= 8) score++;
    if (/[A-Z]/.test(val)) score++;
    if (/[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;
    const levels = [
      { pct: 0, color: C.border, hint: 'Use 8+ characters with a mix of letters, numbers & symbols' },
      { pct: 25, color: C.error, hint: 'Weak — add uppercase letters' },
      { pct: 50, color: '#F59E0B', hint: 'Fair — add numbers for better security' },
      { pct: 75, color: '#3B82F6', hint: 'Good — add symbols to make it strong' },
      { pct: 100, color: C.success, hint: 'Strong password ✓' },
    ];
    setStrength({ ...levels[score], score });
  };

  const handleSignup = async () => {
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }
    if (!role) {
      setError('Please select your account type');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!agreed) {
      setError('Please agree to the Terms of Use to continue');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.register({
        firstName: fullName.split(' ')[0],
        lastName: fullName.includes(' ') ? fullName.split(' ').slice(1).join(' ') : '',
        email,
        password,
        role,
      });
      if (response.data && response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', fullName.split(' ')[0]);
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
      console.error('Signup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async (event) => {
    try {
      setLoading(true);
      setError('');
      if (event && event.credential) {
        const response = await authAPI.googleAuth({ idToken: event.credential });
        if (response.data && response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          localStorage.setItem('userEmail', response.data.user?.email || '');
          localStorage.setItem('userName', response.data.user?.firstName || 'User');
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Google sign-up failed. Please try again.');
      console.error('Google sign-up error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TwoCol>
      <Logo />
      <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.text, margin: '0 0 6px', letterSpacing: -0.5 }}>
        Create your account
      </h1>
      <p style={{ fontSize: 14, color: C.textGray, marginBottom: isMobile ? 20 : 24, lineHeight: 1.5 }}>
        Join the network of energy infrastructure stakeholders
      </p>

      {error && (
        <div style={{ background: '#FEE2E2', border: `1px solid ${C.error}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: C.error }}>
          {error}
        </div>
      )}

      <Field label="Full name" required>
        <Input placeholder="Ali Hassan" value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={loading} />
      </Field>

      <Field label="Email address" required>
        <Input type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} />
      </Field>

      <Field label="Account type" required>
        <div style={{ position: 'relative' }}>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            disabled={loading}
            style={{
              ...baseInput,
              appearance: 'none',
              cursor: 'pointer',
              color: role ? C.text : C.textMuted,
              paddingRight: 36,
              opacity: loading ? 0.6 : 1,
            }}
          >
            <option value="" disabled>
              Select your role
            </option>
            <option>Facility Operator</option>
            <option>Ecosystem Partner</option>
            <option>Community Member</option>
          </select>
          <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <svg width={12} height={8} viewBox="0 0 12 8" fill="none">
              <path d="M1 1L6 6L11 1" stroke={C.textGray} strokeWidth={1.5} strokeLinecap="round" />
            </svg>
          </span>
        </div>
      </Field>

      <Field label="Password" required>
        <div style={{ position: 'relative' }}>
          <input
            type={showPw ? 'text' : 'password'}
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              checkStrength(e.target.value);
            }}
            onFocus={() => setFocusPw(true)}
            onBlur={() => setFocusPw(false)}
            disabled={loading}
            style={{
              ...baseInput,
              paddingRight: 44,
              borderColor: focusPw ? C.primaryMid : C.border,
              boxShadow: focusPw ? `0 0 0 3px rgba(124,58,237,0.12)` : 'none',
              opacity: loading ? 0.6 : 1,
            }}
          />
          <button
            onClick={() => setShowPw((p) => !p)}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: C.textGray,
              display: 'flex',
              alignItems: 'center',
              padding: 0,
            }}
            type="button"
            disabled={loading}
          >
            {showPw ? <EyeOff /> : <EyeOpen />}
          </button>
        </div>
        <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${strength.pct}%`, background: strength.color, borderRadius: 2, transition: 'width .3s, background .3s' }} />
        </div>
        <p style={{ fontSize: 12, color: strength.score === 0 ? C.textMuted : strength.color, marginTop: 5 }}>
          {strength.hint}
        </p>
      </Field>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 18 }}>
        <input
          type="checkbox"
          id="terms"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          disabled={loading}
          style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2 }}
        />
        <label htmlFor="terms" style={{ fontSize: 13, color: C.textGray, lineHeight: 1.5, cursor: 'pointer' }}>
          I agree to the <span style={{ fontWeight: 600, color: C.primaryMid }}>Terms of Use</span> and{' '}
          <span style={{ fontWeight: 600, color: C.primaryMid }}>Privacy Policy</span>
        </label>
      </div>

      <Btn onClick={handleSignup} loading={loading} disabled={loading || !agreed}>
        {loading ? 'Creating account…' : 'Create Account'}
      </Btn>

      <Divider />

      <GoogleSignInButton onSuccess={handleGoogleSignUp} loading={loading} />

      <p style={{ textAlign: 'center', fontSize: 14, color: C.textGray, marginTop: 22 }}>
        Already have an account?{' '}
        <button
          onClick={() => onNavigate('login')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            color: C.primaryMid,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
          disabled={loading}
        >
          Sign in
        </button>
      </p>
    </TwoCol>
  );
}

/* ──────── GOOGLE SIGN-IN BUTTON ──────────── */
function GoogleSignInButton({ onSuccess, loading }) {
  const buttonRef = useRef(null);

  useEffect(() => {
    const initializeGoogleButton = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        console.warn('VITE_GOOGLE_CLIENT_ID not set');
        return;
      }

      if (window.google && buttonRef.current) {
        try {
          // Clear any existing button
          buttonRef.current.innerHTML = '';

          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: onSuccess,
            auto_select: false,
          });

          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%',
          });
        } catch (err) {
          console.error('Failed to render Google button:', err);
        }
      }
    };

    // Wait for Google SDK to load
    if (window.google) {
      initializeGoogleButton();
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          clearInterval(checkGoogle);
          initializeGoogleButton();
        }
      }, 100);

      return () => clearInterval(checkGoogle);
    }
  }, [onSuccess]);

  return <div ref={buttonRef} style={{ width: '100%' }} />;
}

/* ──────── MAIN AUTH PAGE ──────────── */
export default function AuthPage({ onLogin }) {
  const [page, setPage] = useState('login');

  const handleLoginSuccess = () => {
    if (onLogin) {
      onLogin();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#F9FAFB',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        body { margin: 0; padding: 0; }
      `}</style>

      {page === 'login' && <LoginPage onNavigate={setPage} onLoginSuccess={handleLoginSuccess} />}
      {page === 'signup' && <SignupPage onNavigate={setPage} onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
}
