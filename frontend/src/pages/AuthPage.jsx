import React, { useState, useEffect, useRef } from 'react';
import { authAPI } from '../api/endpoints';
import { LogoFull } from '../components/Logo';

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

function Btn({ onClick, loading, children, disabled, variant = 'primary' }) {
  const bgColor = variant === 'secondary' ? '#FFFFFF' : disabled || loading ? '#C4B5FD' : C.primary;
  const textColor = variant === 'secondary' ? C.primary : C.white;
  const borderColor = variant === 'secondary' ? C.primaryMid : 'transparent';

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        height: 50,
        background: bgColor,
        color: textColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 8,
        fontFamily: 'inherit',
        fontSize: 15,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'background .15s, color .15s',
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
          maxHeight: isMobile ? 'none' : '100vh',
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* ──────── CUSTOM GOOGLE BUTTON ──────────── */
function CustomGoogleButton({ onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: '100%',
        height: 50,
        background: C.white,
        color: C.text,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        fontFamily: 'inherit',
        fontSize: 15,
        fontWeight: 600,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'background .15s, border-color .15s',
        letterSpacing: 0.2,
        marginTop: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: loading ? 0.6 : 1,
      }}
    >
      <GoogleIcon />
      Continue with Google
    </button>
  );
}

/* ──────── LOGIN PAGE ──────────── */
function LoginPage({ onNavigate, onLoginSuccess }) {
  const [email, setEmail] = useState(() => localStorage.getItem('rememberEmail') || '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('rememberEmail'));
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
        
        // Handle remember me
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email);
        } else {
          localStorage.removeItem('rememberEmail');
        }
        
        onLoginSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google Client ID not configured. Contact support.');
        setLoading(false);
        return;
      }

      if (!window.google?.accounts?.id) {
        setError('Google SDK not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Request ID token directly
      window.google.accounts.id.requestIdToken({
        client_id: clientId,
        callback: async (response) => {
          try {
            if (!response.credential) {
              setError('Failed to get credential from Google');
              setLoading(false);
              return;
            }

            // Call backend to verify token and create/authenticate user
            const result = await authAPI.googleAuth({ idToken: response.credential });
            
            if (result?.data?.accessToken) {
              localStorage.setItem('accessToken', result.data.accessToken);
              if (result.data.refreshToken) {
                localStorage.setItem('refreshToken', result.data.refreshToken);
              }
              localStorage.setItem('userEmail', result.data.user?.email || '');
              localStorage.setItem('userName', result.data.user?.firstName || 'User');
              if (rememberMe) {
                localStorage.setItem('rememberEmail', result.data.user?.email || '');
              }
              onLoginSuccess();
            } else {
              setError('Authentication failed. Please try again.');
              setLoading(false);
            }
          } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Google sign-in failed';
            setError(errorMsg);
            console.error('Google callback error:', err);
            setLoading(false);
          }
        },
        error_callback: () => {
          setError('Google sign-in was cancelled or failed');
          setLoading(false);
        },
      });

      // Show the native Google sign-in prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is not shown, user needs to click the button
          // This is expected behavior - the prompt might not show in certain contexts
        }
      });
    } catch (err) {
      setError('Google sign-in error: ' + (err.message || 'Unknown error'));
      console.error('Google sign-in error:', err);
      setLoading(false);
    }
  };

  return (
    <TwoCol>
      <div style={{ marginBottom: 28 }}>
        <LogoFull size="medium" />
      </div>
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

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            disabled={loading}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="rememberMe" style={{ fontSize: 13, color: C.textGray, cursor: 'pointer' }}>
            Remember me
          </label>
        </div>
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

      <CustomGoogleButton onClick={handleGoogleSignIn} loading={loading} />

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
    const hasUppercase = /[A-Z]/.test(val);
    const hasLowercase = /[a-z]/.test(val);
    const hasNumber = /[0-9]/.test(val);
    const hasSymbol = /[^A-Za-z0-9]/.test(val);
    const isLongEnough = val.length >= 12;

    if (isLongEnough) score++;
    if (hasUppercase) score++;
    if (hasLowercase) score++;
    if (hasNumber) score++;
    if (hasSymbol) score++;

    const levels = [
      { pct: 0, color: C.border, hint: 'Use 12+ characters with uppercase, lowercase, numbers & symbols' },
      { pct: 20, color: C.error, hint: 'Weak — add more character variety' },
      { pct: 40, color: '#F59E0B', hint: 'Fair — make it stronger' },
      { pct: 60, color: '#3B82F6', hint: 'Good — almost there' },
      { pct: 80, color: '#10B981', hint: 'Strong — very good' },
      { pct: 100, color: C.success, hint: 'Excellent password ✓' },
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
    if (password.length < 12) {
      setError('Password must be at least 12 characters');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Password must contain uppercase, lowercase, numbers, and symbols');
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
        passwordConfirmation: password,
        role,
      });
      if (response.data) {
        // Store email for verification page
        localStorage.setItem('verificationEmail', email);
        localStorage.setItem('signupFullName', fullName.split(' ')[0]);
        onNavigate('verify');
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

  const handleGoogleSignUpCustom = async () => {
    try {
      setLoading(true);
      setError('');
      
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError('Google Client ID not configured. Contact support.');
        setLoading(false);
        return;
      }

      if (!window.google?.accounts?.id) {
        setError('Google SDK not loaded. Please refresh the page.');
        setLoading(false);
        return;
      }

      // Request ID token directly
      window.google.accounts.id.requestIdToken({
        client_id: clientId,
        callback: async (response) => {
          try {
            if (!response.credential) {
              setError('Failed to get credential from Google');
              setLoading(false);
              return;
            }

            // Call backend to verify token and create/authenticate user
            const result = await authAPI.googleAuth({ idToken: response.credential });
            
            if (result?.data?.accessToken) {
              localStorage.setItem('accessToken', result.data.accessToken);
              if (result.data.refreshToken) {
                localStorage.setItem('refreshToken', result.data.refreshToken);
              }
              localStorage.setItem('userEmail', result.data.user?.email || '');
              localStorage.setItem('userName', result.data.user?.firstName || 'User');
              onLoginSuccess();
            } else {
              setError('Authentication failed. Please try again.');
              setLoading(false);
            }
          } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Google sign-up failed';
            setError(errorMsg);
            console.error('Google callback error:', err);
            setLoading(false);
          }
        },
        error_callback: () => {
          setError('Google sign-up was cancelled or failed');
          setLoading(false);
        },
      });

      // Show the native Google sign-in prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is not shown, user needs to click the button
          // This is expected behavior - the prompt might not show in certain contexts
        }
      });
    } catch (err) {
      setError('Google sign-up error: ' + (err.message || 'Unknown error'));
      console.error('Google sign-up error:', err);
      setLoading(false);
    }
  };

  return (
    <TwoCol>
      <div style={{ marginBottom: 28 }}>
        <LogoFull size="medium" />
      </div>
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
          style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2, flexShrink: 0 }}
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

      <CustomGoogleButton onClick={handleGoogleSignUpCustom} loading={loading} />

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

/* ──────── EMAIL VERIFICATION PAGE ──────────── */
function VerifyEmailPage({ onNavigate, onLoginSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');
  const email = localStorage.getItem('verificationEmail') || '';
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    // Check if token is in URL
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');
    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    }
  }, []);

  const verifyToken = async (emailToken) => {
    setLoading(true);
    try {
      await authAPI.verifyEmail(emailToken);
      setSuccess(true);
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    try {
      // In production, this would call a resend-verification-email endpoint
      setError('Please check your email for the verification link');
    } catch (err) {
      setError('Failed to resend email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <TwoCol>
        <div style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: 28 }}>
            <LogoFull size="medium" />
          </div>
          <div style={{ width: 80, height: 80, background: '#DCFCE7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={C.success} strokeWidth={2}>
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.text, margin: '0 0 12px', letterSpacing: -0.5 }}>
            Email Verified!
          </h1>
          <p style={{ fontSize: 14, color: C.textGray, marginBottom: 28 }}>
            Your email has been verified. Redirecting to sign in...
          </p>
        </div>
      </TwoCol>
    );
  }

  return (
    <TwoCol>
      <div style={{ marginBottom: 28 }}>
        <LogoFull size="medium" />
      </div>
      <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: C.text, margin: '0 0 6px', letterSpacing: -0.5 }}>
        Verify your email
      </h1>
      <p style={{ fontSize: 14, color: C.textGray, marginBottom: 28, lineHeight: 1.5 }}>
        We've sent a verification link to <span style={{ fontWeight: 600 }}>{email}</span>. Click the link in your email to verify your account.
      </p>

      {error && (
        <div style={{ background: '#FEE2E2', border: `1px solid ${C.error}`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: C.error }}>
          {error}
        </div>
      )}

      {success === false && (
        <div style={{ background: '#FEF3C7', border: `1px solid #FCD34D`, borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13, color: '#B45309' }}>
          If you don't see the email, check your spam folder or click the button below to resend it.
        </div>
      )}

      <div style={{ marginBottom: 18 }}>
        <Btn onClick={handleResendEmail} loading={loading} disabled={loading}>
          {loading ? 'Resending…' : 'Resend Verification Email'}
        </Btn>
      </div>

      <p style={{ textAlign: 'center', fontSize: 13, color: C.textGray }}>
        Already verified?{' '}
        <button
          onClick={() => onNavigate('login')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.primaryMid,
            fontWeight: 600,
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          Sign in here
        </button>
      </p>
    </TwoCol>
  );
}

/* ──────── MAIN AUTH PAGE ──────────── */
export default function AuthPage({ onLogin }) {
  const [page, setPage] = useState('login');

  const handleLoginSuccess = () => {
    localStorage.removeItem('verificationEmail');
    localStorage.removeItem('signupFullName');
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
      {page === 'verify' && <VerifyEmailPage onNavigate={setPage} onLoginSuccess={handleLoginSuccess} />}
    </div>
  );
}
