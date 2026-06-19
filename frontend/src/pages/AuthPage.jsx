import React, { useState, useEffect, useCallback } from 'react';
import { authAPI } from '../api/endpoints';
import { LogoFull } from '../components/Logo';

/* ─── DESIGN TOKENS ─────────────────────────────────── */
const COLORS = {
  primary: '#5B21B6',
  primaryLight: '#7C3AED',
  primaryFaint: '#EDE9FE',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  background: '#F9FAFB',
  surface: '#FFFFFF',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  success: '#059669',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
};

/* ─── UTILITIES ─────────────────────────────────────── */
function useBreakpoint() {
  const [width, setWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return {
    isMobile: width < 640,
    isTablet: width >= 640 && width < 1024,
    isDesktop: width >= 1024,
  };
}

/* ─── PROFESSIONAL GOOGLE OAUTH SERVICE ─────────────────── */
class GoogleOAuthService {
  constructor() {
    this.isInitialized = false;
    this.isReady = false;
    this.initPromise = null;
  }

  async waitForSDK(maxAttempts = 50) {
    let attempts = 0;
    while (!window.google?.accounts?.id && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }
    return !!window.google?.accounts?.id;
  }

  async initialize() {
    if (this.isInitialized) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!clientId) {
          throw new Error('Google Client ID not configured');
        }

        const isReady = await this.waitForSDK();
        if (!isReady) {
          throw new Error('Google SDK failed to load');
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        this.isInitialized = true;
        this.isReady = true;
      } catch (error) {
        this.isInitialized = false;
        this.isReady = false;
        throw error;
      }
    })();

    return this.initPromise;
  }

  async authenticate() {
    if (!this.isReady) {
      await this.initialize();
    }

    return new Promise((resolve, reject) => {
      const handleCredentialResponse = async (response) => {
        try {
          if (!response?.credential) {
            reject(new Error('No credential received from Google'));
            return;
          }

          const authResult = await authAPI.googleAuth({ idToken: response.credential });
          
          if (!authResult?.data?.accessToken) {
            reject(new Error('No authentication token in response'));
            return;
          }

          // Store auth data
          localStorage.setItem('accessToken', authResult.data.accessToken);
          if (authResult.data.refreshToken) {
            localStorage.setItem('refreshToken', authResult.data.refreshToken);
          }
          if (authResult.data.user?.email) {
            localStorage.setItem('userEmail', authResult.data.user.email);
          }
          if (authResult.data.user?.firstName) {
            localStorage.setItem('userName', authResult.data.user.firstName);
          }

          resolve({
            success: true,
            user: authResult.data.user,
            accessToken: authResult.data.accessToken,
          });
        } catch (error) {
          reject(error);
        }
      };

      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
      });

      // Trigger the One Tap UI
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // One Tap not displayed, user can still click button
        }
        if (notification.isSkippedMoment()) {
          // User dismissed the One Tap UI
        }
      });
    });
  }

  renderButton(element, customOptions = {}) {
    if (!this.isReady) return;

    const defaultOptions = {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      width: '100%',
    };

    window.google.accounts.id.renderButton(element, { ...defaultOptions, ...customOptions });
  }
}

// Single instance
const googleOAuthService = new GoogleOAuthService();

// Hook for using Google OAuth
function useGoogleAuth(onSuccess, onError) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleAuth = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await googleOAuthService.authenticate();
      onSuccess(result);
    } catch (error) {
      console.error('Google authentication error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Google authentication failed';
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess, onError]);

  // Initialize on mount
  useEffect(() => {
    googleOAuthService.initialize().catch((error) => {
      console.error('Failed to initialize Google OAuth:', error);
    });
  }, []);

  return { handleGoogleAuth, isLoading };
}

function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validatePassword(password) {
  return {
    minLength: password.length >= 12,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSymbol: /[^A-Za-z0-9]/.test(password),
  };
}

function getPasswordStrength(password) {
  const validation = validatePassword(password);
  const score = Object.values(validation).filter(Boolean).length;
  const strengths = [
    { level: 0, label: 'Very Weak', color: COLORS.error, percentage: 0 },
    { level: 1, label: 'Weak', color: COLORS.error, percentage: 20 },
    { level: 2, label: 'Fair', color: COLORS.warning, percentage: 40 },
    { level: 3, label: 'Good', color: '#3B82F6', percentage: 60 },
    { level: 4, label: 'Strong', color: COLORS.success, percentage: 80 },
    { level: 5, label: 'Very Strong', color: COLORS.success, percentage: 100 },
  ];
  return strengths[score];
}

/* ─── ICON COMPONENTS ──────────────────────────────── */
function EyeIcon({ open = false }) {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
      {open ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx={12} cy={12} r={3} />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <line x1={1} y1={1} x2={23} y2={23} />
        </>
      )}
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

function CheckIcon() {
  return (
    <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx={12} cy={12} r={10} />
      <line x1={12} y1={8} x2={12} y2={12} />
      <line x1={12} y1={16} x2={12.01} y2={16} />
    </svg>
  );
}

function Spinner({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx={12} cy={12} r={10} opacity={0.25} />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth={2} strokeDasharray="15.7" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }} />
    </svg>
  );
}

/* ─── UI COMPONENTS ────────────────────────────────── */
function Alert({ type = 'error', message }) {
  const colors = {
    error: { bg: COLORS.errorLight, border: '#FCA5A5', text: COLORS.error, icon: <AlertIcon /> },
    success: { bg: COLORS.successLight, border: '#86EFAC', text: COLORS.success, icon: <CheckIcon /> },
    warning: { bg: COLORS.warningLight, border: '#FDE68A', text: COLORS.warning, icon: <AlertIcon /> },
  };
  const color = colors[type] || colors.error;
  return (
    <div
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 8,
        padding: '12px 14px',
        marginBottom: 16,
        fontSize: 13,
        color: color.text,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{color.icon}</div>
      <div style={{ flex: 1 }}>{message}</div>
    </div>
  );
}

function FormField({ label, required = false, error = null, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {label && (
        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: COLORS.text, marginBottom: 8 }}>
          {label}
          {required && <span style={{ color: COLORS.error }}> *</span>}
        </label>
      )}
      {children}
      {error && <p style={{ fontSize: 12, color: COLORS.error, margin: '6px 0 0' }}>{error}</p>}
    </div>
  );
}

function TextInput({ type = 'text', placeholder, value, onChange, disabled = false, icon: IconComponent = null, onIconClick = null }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          height: 46,
          paddingLeft: 14,
          paddingRight: IconComponent ? 44 : 14,
          border: `1px solid ${focused ? COLORS.primaryLight : COLORS.border}`,
          borderRadius: 8,
          fontSize: 14,
          color: COLORS.text,
          background: disabled ? '#F3F4F6' : COLORS.surface,
          outline: 'none',
          boxShadow: focused ? `0 0 0 3px rgba(124,58,237,0.12)` : 'none',
          transition: 'all 0.15s ease',
          fontFamily: 'inherit',
          opacity: disabled ? 0.6 : 1,
        }}
      />
      {IconComponent && (
        <button
          type="button"
          onClick={onIconClick}
          disabled={disabled}
          style={{
            position: 'absolute',
            right: 14,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: COLORS.textMuted,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {IconComponent}
        </button>
      )}
    </div>
  );
}

function SelectInput({ options, value, onChange, disabled = false, placeholder = 'Select an option' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: '100%',
          height: 46,
          paddingLeft: 14,
          paddingRight: 36,
          border: `1px solid ${focused ? COLORS.primaryLight : COLORS.border}`,
          borderRadius: 8,
          fontSize: 14,
          color: value ? COLORS.text : COLORS.textMuted,
          background: disabled ? '#F3F4F6' : COLORS.surface,
          outline: 'none',
          boxShadow: focused ? `0 0 0 3px rgba(124,58,237,0.12)` : 'none',
          transition: 'all 0.15s ease',
          fontFamily: 'inherit',
          appearance: 'none',
          cursor: 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <svg width={12} height={8} viewBox="0 0 12 8" fill="none">
          <path d="M1 1L6 6L11 1" stroke={COLORS.textMuted} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

function CheckboxInput({ id, label, checked, onChange, disabled = false }) {
  // Accessible custom checkbox with larger hit target and modern style
  return (
    <label htmlFor={id} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: disabled ? 'not-allowed' : 'pointer' }}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-checked={checked}
        style={{
          position: 'absolute',
          opacity: 0,
          pointerEvents: 'none',
        }}
      />
      <span
        aria-hidden
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: `1.5px solid ${checked ? COLORS.primary : COLORS.border}`,
          background: checked ? COLORS.primary : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: checked ? '0 4px 10px rgba(91,33,182,0.14)' : 'none',
          transition: 'all 150ms ease',
          flexShrink: 0,
        }}
      >
        {checked && (
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" style={{ color: '#fff' }}>
            <polyline points="20 6 9 17 4 12" stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: 14, color: disabled ? '#9CA3AF' : COLORS.textSecondary, lineHeight: 1.4 }}>
        {label}
      </span>
    </label>
  );
}

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password);
  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ height: 3, background: COLORS.border, borderRadius: 2, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${strength.percentage}%`,
            background: strength.color,
            borderRadius: 2,
            transition: 'all 0.3s ease',
          }}
        />
      </div>
      <p style={{ fontSize: 12, color: strength.color, margin: '6px 0 0' }}>
        {strength.label}
      </p>
    </div>
  );
}

function Button({ onClick, loading = false, disabled = false, variant = 'primary', children, fullWidth = true }) {
  const isDisabled = disabled || loading;
  const styles = {
    primary: {
      bg: isDisabled ? '#C4B5FD' : COLORS.primary,
      color: COLORS.surface,
      border: 'none',
    },
    secondary: {
      bg: COLORS.surface,
      color: COLORS.primary,
      border: `1px solid ${COLORS.primaryLight}`,
    },
  };
  const style = styles[variant];
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width: fullWidth ? '100%' : 'auto',
        height: 48,
        background: style.bg,
        color: style.color,
        border: style.border,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        letterSpacing: 0.2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        opacity: loading ? 0.8 : 1,
      }}
    >
      {loading && <Spinner size={16} />}
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0', color: COLORS.textMuted, fontSize: 13 }}>
      <div style={{ flex: 1, height: 1, background: COLORS.border }} />
      Or continue with
      <div style={{ flex: 1, height: 1, background: COLORS.border }} />
    </div>
  );
}

function GoogleButton({ onClick, loading = false, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        width: '100%',
        height: 48,
        background: COLORS.surface,
        color: COLORS.text,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        opacity: disabled || loading ? 0.6 : 1,
      }}
    >
      <GoogleIcon />
      {loading ? 'Signing in...' : 'Continue with Google'}
    </button>
  );
}

function FormContainer({ children, isMobile }) {
  return (
    <div
      style={{
        background: COLORS.surface,
        borderRadius: isMobile ? 12 : 16,
        padding: isMobile ? '20px 16px 28px' : '40px 48px',
        maxWidth: 460,
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
        // On small screens, allow the form to scroll while keeping CTAs reachable
        maxHeight: isMobile ? 'calc(100vh - 64px)' : 'none',
        overflowY: isMobile ? 'auto' : 'visible',
        WebkitOverflowScrolling: isMobile ? 'touch' : 'auto',
      }}
    >
      {children}
    </div>
  );
}

/*PAGES */
function LoginPage({ onNavigate, onSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isMobile } = useBreakpoint();
  
  const { handleGoogleAuth, isLoading: googleLoading } = useGoogleAuth(
    (result) => {
      console.log('Google auth successful:', result.user);
      onSuccess();
    },
    setError
  );

  const handleLogin = async () => {
    setError('');
    
    if (!validateEmail(email)) {
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
      if (response.data?.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userName', response.data.user?.firstName || email.split('@')[0]);
        if (rememberMe) {
          localStorage.setItem('rememberEmail', email);
        }
          onSuccess();
          // Ensure navigation to homepage after successful login
          try { window.location.href = '/'; } catch (e) { /* noop */ }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !googleLoading) {
      handleLogin();
    }
  };

  return (
    <FormContainer isMobile={isMobile}>
      <div style={{ marginBottom: 28 }}>
        <LogoFull size="medium" />
      </div>
      <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: COLORS.text, margin: '0 0 8px', letterSpacing: -0.5 }}>
        Welcome back
      </h1>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
        Sign in to access your community
      </p>

      {error && <Alert type="error" message={error} />}

      <FormField label="Email address" required>
        <TextInput
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          onKeyPress={handleKeyPress}
        />
      </FormField>

      <FormField label="Password" required>
        <TextInput
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          icon={<EyeIcon open={showPassword} />}
          onIconClick={() => setShowPassword(!showPassword)}
          onKeyPress={handleKeyPress}
        />
      </FormField>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <CheckboxInput
          id="rememberMe"
          label="Remember me"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={loading}
        />
        <button
          onClick={() => onNavigate('forgot')}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: COLORS.primaryLight,
            fontWeight: 500,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Forgot password?
        </button>
      </div>

      <Button onClick={handleLogin} loading={loading} disabled={loading}>
        Sign in
      </Button>

      <Divider />

      <GoogleButton onClick={handleGoogleAuth} loading={googleLoading} disabled={googleLoading || loading} />

      <p style={{ textAlign: 'center', fontSize: 14, color: COLORS.textSecondary, marginTop: 24 }}>
        Don't have an account?{' '}
        <button
          onClick={() => onNavigate('signup')}
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14,
            color: COLORS.primaryLight,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Create one
        </button>
      </p>
    </FormContainer>
  );
}

function SignupPage({ onNavigate, onSuccess }) {
  const [formData, setFormData] = useState({ fullName: '', email: '', role: '', password: '', agreedToTerms: false });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [attempt, setAttempt] = useState(0);
  const { isMobile } = useBreakpoint();
  
  const { handleGoogleAuth, isLoading: googleLoading } = useGoogleAuth(
    (result) => {
      console.log('Google auth successful for signup:', result.user);
        onSuccess();
        // Ensure navigation to homepage after successful signup
        try { window.location.href = '/'; } catch (e) { /* noop */ }
    },
    setError
  );

  // Validation with better messaging
  const validateForm = () => {
    const errors = {};
    
    if (!formData.fullName?.trim()) {
      errors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().split(' ').length < 2) {
      errors.fullName = 'Please enter your first and last name';
    }
    
    if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.role) {
      errors.role = 'Please select an account type';
    }
    
    const pwValidation = validatePassword(formData.password);
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!pwValidation.minLength) {
      errors.password = 'Password must be at least 12 characters';
    } else if (!pwValidation.hasUppercase) {
      errors.password = 'Password must contain at least one uppercase letter';
    } else if (!pwValidation.hasLowercase) {
      errors.password = 'Password must contain at least one lowercase letter';
    } else if (!pwValidation.hasNumber) {
      errors.password = 'Password must contain at least one number';
    } else if (!pwValidation.hasSymbol) {
      errors.password = 'Password must contain at least one symbol (!@#$%^&*)';
    }
    
    if (!formData.agreedToTerms) {
      errors.agreedToTerms = 'You must agree to the terms and conditions';
    }
    
    return errors;
  };

  // Enterprise-grade signup handler
  const handleSignup = async () => {
    // Reset error state
    setError('');
    setFieldErrors({});
    
    // Validate form
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      // Set the first error to display
      const firstError = Object.values(errors)[0];
      setError(firstError);
      console.warn('Validation failed:', errors);
      return;
    }

    // Prevent duplicate submissions
    if (loading) {
      console.warn('Signup already in progress');
      return;
    }

    setLoading(true);
    setAttempt(prev => prev + 1);

    try {
      // Parse name
      const nameParts = formData.fullName.trim().split(/\s+/);
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || 'User';

      // Prepare payload
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        passwordConfirmation: formData.password,
        role: formData.role,
      };

      console.log('📝 Signup attempt #' + attempt, { 
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        role: payload.role,
      });

      // Send request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

      let response;
      try {
        response = await authAPI.register(payload);
      } finally {
        clearTimeout(timeoutId);
      }

      console.log('✅ Signup response received:', {
        status: response.status,
        hasData: !!response.data,
        hasAccessToken: !!response.data?.accessToken,
      });

      // Validate response
      if (!response.data) {
        throw new Error('No data in response from server');
      }

      // Success - if server returned tokens, sign the user in immediately
      localStorage.setItem('verificationEmail', formData.email.trim().toLowerCase());

      // If backend returned an access token, persist session and navigate to app
      if (response.data?.accessToken) {
        try {
          localStorage.setItem('accessToken', response.data.accessToken);
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          if (response.data.user?.email) {
            localStorage.setItem('userEmail', response.data.user.email);
          }
          if (response.data.user?.firstName) {
            localStorage.setItem('userName', response.data.user.firstName);
          }
        } catch (storageErr) {
          console.warn('Failed to persist session to localStorage', storageErr);
        }

        // Trigger success flow (which redirects to the app/home)
        onSuccess();
        try { window.location.href = '/'; } catch (e) { /* noop */ }
        return;
      }

      // Otherwise, navigate to verification step (production flow)
      console.log('🎉 Signup successful, navigating to verification page');
      setTimeout(() => {
        onNavigate('verify');
      }, 300);

    } catch (err) {
      console.error('❌ Signup error:', {
        name: err.name,
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        isAbortError: err.name === 'AbortError',
      });

      // Determine user-friendly error message
      let userMessage = 'Signup failed. Please try again.';

      if (err.name === 'AbortError') {
        userMessage = 'Request timed out. Please check your connection and try again.';
      } else if (err.response?.status === 409) {
        userMessage = 'This email is already registered. Please sign in or use a different email.';
      } else if (err.response?.status === 400) {
        userMessage = err.response.data?.message || 'Invalid signup data. Please check your information.';
      } else if (err.response?.status === 500) {
        userMessage = 'Server error. Our team has been notified. Please try again in a moment.';
      } else if (err.message?.includes('Network')) {
        userMessage = 'Network error. Please check your connection and try again.';
      } else if (err.response?.data?.message) {
        userMessage = err.response.data.message;
      } else if (err.message) {
        userMessage = err.message;
      }

      setError(userMessage);
      console.warn('User message set:', userMessage);
      
    } finally {
      setLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !googleLoading) {
      handleSignup();
    }
  };

  return (
    <FormContainer isMobile={isMobile}>
      <div style={{ marginBottom: 28 }}>
        <LogoFull size="medium" />
      </div>
      <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: COLORS.text, margin: '0 0 8px', letterSpacing: -0.5 }}>
        Create account
      </h1>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
        Join the community of clean energy leaders
      </p>

      {error && <Alert type="error" message={error} />}

      <FormField label="Full name" required error={fieldErrors.fullName}>
        <TextInput
          placeholder="Ali Hassan"
          value={formData.fullName}
          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
          disabled={loading || googleLoading}
          onKeyPress={handleKeyPress}
        />
      </FormField>

      <FormField label="Email address" required error={fieldErrors.email}>
        <TextInput
          type="email"
          placeholder="letsgo@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={loading || googleLoading}
          onKeyPress={handleKeyPress}
        />
      </FormField>

      <FormField label="Account type" required error={fieldErrors.role}>
        <SelectInput
          options={['Facility Operator', 'Investor', 'Community Member']}
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          disabled={loading || googleLoading}
          placeholder="Select your role"
        />
      </FormField>

      <FormField label="Password" required error={fieldErrors.password}>
        <TextInput
          type={showPassword ? 'text' : 'password'}
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={loading || googleLoading}
          icon={<EyeIcon open={showPassword} />}
          onIconClick={() => setShowPassword(!showPassword)}
          onKeyPress={handleKeyPress}
        />
        {formData.password && <PasswordStrengthBar password={formData.password} />}
      </FormField>

      <div style={{ marginBottom: 24 }}>
        <CheckboxInput
          id="terms"
          label={
            <>
              I agree to the <span style={{ fontWeight: 600, color: COLORS.primaryLight }}>Terms of Use</span> and{' '}
              <span style={{ fontWeight: 600, color: COLORS.primaryLight }}>Privacy Policy</span>
            </>
          }
          checked={formData.agreedToTerms}
          onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
          disabled={loading || googleLoading}
        />
        {fieldErrors.agreedToTerms && <p style={{ fontSize: 12, color: COLORS.error, margin: '8px 0 0 28px' }}>{fieldErrors.agreedToTerms}</p>}
      </div>

      <Button onClick={handleSignup} loading={loading} disabled={loading || googleLoading}>
        Create account
      </Button>

      <Divider />

      <GoogleButton onClick={handleGoogleAuth} loading={googleLoading} disabled={googleLoading || loading} />

      <p style={{ textAlign: 'center', fontSize: 14, color: COLORS.textSecondary, marginTop: 24 }}>
        Already have an account?{' '}
        <button
          onClick={() => onNavigate('login')}
          disabled={loading || googleLoading}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 14,
            color: COLORS.primaryLight,
            fontWeight: 600,
            cursor: loading || googleLoading ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: loading || googleLoading ? 0.6 : 1,
          }}
        >
          Sign in
        </button>
      </p>
    </FormContainer>
  );
}

function VerifyPage({ onNavigate, onSuccess }) {
  const email = localStorage.getItem('verificationEmail') || '';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const { isMobile } = useBreakpoint();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      verifyEmail(token);
    }
  }, []);

  const verifyEmail = async (token) => {
    setLoading(true);
    try {
      await authAPI.verifyEmail(token);
      setSuccess(true);
      setMessage('Email verified successfully!');
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setLoading(true);
    try {
      await authAPI.resendVerification(email);
      setMessage('Verification email sent!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <FormContainer isMobile={isMobile}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: COLORS.successLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <div style={{ color: COLORS.success, display: 'flex', alignItems: 'center' }}>
              <CheckIcon />
            </div>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: COLORS.text, margin: '0 0 12px' }}>
            Email verified!
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textSecondary }}>
            Your account is ready. Redirecting to sign in...
          </p>
        </div>
      </FormContainer>
    );
  }

  return (
    <FormContainer isMobile={isMobile}>
      <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
        Verify your email
      </h1>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
        We sent a verification link to <span style={{ fontWeight: 600 }}>{email}</span>
      </p>

      {error && <Alert type="error" message={error} />}
      {message && <Alert type="success" message={message} />}

      <Button onClick={handleResendEmail} loading={loading} disabled={loading} style={{ marginBottom: 16 }}>
        Resend verification email
      </Button>

      <p style={{ textAlign: 'center', fontSize: 13, color: COLORS.textSecondary }}>
        <button
          onClick={() => onNavigate('login')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: COLORS.primaryLight,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Back to sign in
        </button>
      </p>
    </FormContainer>
  );
}

function ForgotPasswordPage({ onNavigate, onSuccess }) {
  const [step, setStep] = useState('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { isMobile } = useBreakpoint();

  const handleSendCode = async () => {
    setError('');
    if (!validateEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError('');
    if (!code) {
      setError('Please enter the code from your email');
      return;
    }
    if (!validatePassword(password).minLength) {
      setError('Password must be at least 12 characters with mixed types');
      return;
    }
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, code, password, passwordConfirmation: password });
      setStep('success');
      setTimeout(() => onNavigate('login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'success') {
    return (
      <FormContainer isMobile={isMobile}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, background: COLORS.successLight, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <div style={{ color: COLORS.success }}>✓</div>
          </div>
          <h1 style={{ fontSize: isMobile ? 22 : 28, fontWeight: 700, color: COLORS.text, margin: '0 0 12px' }}>
            Password reset!
          </h1>
          <p style={{ fontSize: 14, color: COLORS.textSecondary }}>
            Your password has been reset. Redirecting to sign in...
          </p>
        </div>
      </FormContainer>
    );
  }

  if (step === 'code') {
    return (
      <FormContainer isMobile={isMobile}>
        <button
          onClick={() => setStep('email')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: 13,
            color: COLORS.primaryLight,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            marginBottom: 20,
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
          Reset your password
        </h1>
        <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
          Enter the code from your email and create a new password
        </p>

        {error && <Alert type="error" message={error} />}

        <FormField label="Reset code" required>
          <TextInput
            placeholder="Enter 6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={loading}
          />
        </FormField>

        <FormField label="New password" required>
          <TextInput
            type={showPassword ? 'text' : 'password'}
            placeholder="Create strong password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            icon={<EyeIcon open={showPassword} />}
            onIconClick={() => setShowPassword(!showPassword)}
          />
          {password && <PasswordStrengthBar password={password} />}
        </FormField>

        <Button onClick={handleResetPassword} loading={loading} disabled={loading}>
          Reset password
        </Button>
      </FormContainer>
    );
  }

  return (
    <FormContainer isMobile={isMobile}>
      <button
        onClick={() => onNavigate('login')}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 13,
          color: COLORS.primaryLight,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginBottom: 20,
        }}
      >
        ← Back to sign in
      </button>
      <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: COLORS.text, margin: '0 0 8px' }}>
        Forgot password?
      </h1>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, margin: '0 0 24px', lineHeight: 1.6 }}>
        Enter your email and we'll send you a code to reset your password
      </p>

      {error && <Alert type="error" message={error} />}

      <FormField label="Email address" required>
        <TextInput
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </FormField>

      <Button onClick={handleSendCode} loading={loading} disabled={loading}>
        Send reset code
      </Button>
    </FormContainer>
  );
}

/* ─── MAIN COMPONENT ───────────────────────────────── */
export default function AuthPage({ onLogin }) {
  const [page, setPage] = useState('login');
  const { isMobile } = useBreakpoint();

  const handleSuccess = () => {
    localStorage.removeItem('verificationEmail');
    if (onLogin) onLogin();
    // Ensure SPA navigates to home after successful auth
    try {
      window.location.href = '/';
    } catch (e) {
      // fallback: do nothing
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: COLORS.background,
        padding: isMobile ? '20px 16px 40px' : '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        overflowX: 'hidden',
      }}
    >
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        body { margin: 0; padding: 0; }
      `}</style>

      {page === 'login' && <LoginPage onNavigate={setPage} onSuccess={handleSuccess} />}
      {page === 'signup' && <SignupPage onNavigate={setPage} onSuccess={handleSuccess} />}
      {page === 'verify' && <VerifyPage onNavigate={setPage} onSuccess={handleSuccess} />}
      {page === 'forgot' && <ForgotPasswordPage onNavigate={setPage} onSuccess={handleSuccess} />}
    </div>
  );
}
