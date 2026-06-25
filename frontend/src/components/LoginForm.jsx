import React, { useState } from 'react';
import { authAPI } from '../api/endpoints';
import { useAuthForm, useEmailValidation, validateAuthForm } from '../hooks/useAuthForm';
import { COLORS } from '../constants/theme';

/**
 * Reusable error alert component
 */
export function ErrorAlert({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      style={{
        backgroundColor: '#FEE2E2',
        color: '#DC2626',
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '14px',
      }}
    >
      <span>⚠️ {message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px' }}
        >
          ✕
        </button>
      )}
    </div>
  );
}

/**
 * Reusable success message component
 */
export function SuccessAlert({ message }) {
  if (!message) return null;
  return (
    <div
      style={{
        backgroundColor: COLORS.successFaint,
        color: COLORS.success,
        padding: '12px 16px',
        borderRadius: '8px',
        marginBottom: '16px',
        fontSize: '14px',
      }}
    >
      ✓ {message}
    </div>
  );
}

/**
 * Standard login form component
 * Uses custom hooks to eliminate code duplication
 */
export function LoginForm({ onSuccess, onNavigate, isDemoMode = false }) {
  const [email, setEmail] = useState(isDemoMode ? 'demo@tribes.capital' : '');
  const [password, setPassword] = useState(isDemoMode ? 'DemoPass123!' : '');
  const [showPassword, setShowPassword] = useState(false);

  const { emailError, validateEmail } = useEmailValidation();
  const { loading, error, submit, clearError } = useAuthForm(
    (data) => authAPI.login(data),
    onSuccess
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validate inputs
    if (!validateEmail(email)) return;
    if (!password) {
      return;
    }

    try {
      await submit({ email: email.toLowerCase(), password });
    } catch (err) {
      // Error is already handled by useAuthForm hook
    }
  };

  const handleDemoLogin = async () => {
    clearError();
    
    if (!validateEmail('demo@tribes.capital')) return;

    try {
      await submit({
        email: 'demo@tribes.capital',
        password: 'DemoPass123!',
      });
    } catch (err) {
      // Error is already handled
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      <ErrorAlert message={error} onDismiss={clearError} />

      <div style={{ marginBottom: '16px' }}>
        <label htmlFor="login-email" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Email Address
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          placeholder="you@example.com"
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${emailError ? '#DC2626' : COLORS.border}`,
            borderRadius: '8px',
            fontSize: '14px',
            boxSizing: 'border-box',
            backgroundColor: COLORS.white,
          }}
        />
        {emailError && (
          <p style={{ color: '#DC2626', fontSize: '12px', marginTop: '4px' }}>
            {emailError}
          </p>
        )}
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label htmlFor="login-password" style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
          Password
        </label>
        <div style={{ position: 'relative' }}>
          <input
            id="login-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '12px 40px 12px 12px',
              border: `1px solid ${COLORS.border}`,
              borderRadius: '8px',
              fontSize: '14px',
              boxSizing: 'border-box',
              backgroundColor: COLORS.white,
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: loading ? COLORS.textTertiary : COLORS.primary,
          color: COLORS.white,
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '12px',
          transition: 'background 0.2s',
        }}
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>

      {/* Demo login button for development */}
      {!loading && (
        <button
          type="button"
          onClick={handleDemoLogin}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: 'transparent',
            color: COLORS.primary,
            border: `2px solid ${COLORS.primary}`,
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '12px',
          }}
        >
          🎭 Demo Login
        </button>
      )}

      <button
        type="button"
        onClick={() => onNavigate('forgot')}
        disabled={loading}
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: 'transparent',
          color: COLORS.primary,
          border: 'none',
          fontSize: '13px',
          cursor: loading ? 'not-allowed' : 'pointer',
          textDecoration: 'none',
        }}
      >
        Forgot your password?
      </button>
    </form>
  );
}
