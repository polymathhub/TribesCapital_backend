import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../api/endpoints';

/**
 * GoogleSignIn Component
 *
 * Handles Google OAuth Sign-In with the following features:
 * - Automatic button rendering
 * - ID token extraction from Google
 * - Backend authentication
 * - Error handling with user feedback
 * - Loading state management
 * - Automatic redirect on success
 *
 * Usage:
 * <GoogleSignIn 
 *   onSuccess={(user) => console.log('Signed in:', user)}
 *   onError={(error) => console.error('Sign in failed:', error)}
 * />
 *
 * Environment Setup:
 * 1. Add VITE_GOOGLE_CLIENT_ID to .env:
 *    VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
 *
 * 2. Add Google Sign-In library to index.html:
 *    <script src="https://accounts.google.com/gsi/client" async defer></script>
 */

interface GoogleSignInProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  autoRedirect?: boolean;
  redirectPath?: string;
  text?: 'signin_with' | 'signin' | 'signup_with' | 'signup';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  width?: string;
}

export function GoogleSignIn({
  onSuccess,
  onError,
  autoRedirect = true,
  redirectPath = '/dashboard',
  text = 'signin_with',
  theme = 'outline',
  size = 'large',
  width = '100%',
}: GoogleSignInProps) {
  const navigate = useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initialize Google Sign-In on mount
  useEffect(() => {
    const script = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (!script) {
      console.error(
        'Google Sign-In library not loaded. Add <script src="https://accounts.google.com/gsi/client" async defer></script> to index.html',
      );
      setError(
        'Google Sign-In is not available. Please reload the page.',
      );
      return;
    }

    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      console.error(
        'VITE_GOOGLE_CLIENT_ID not set in environment. Add to .env file.',
      );
      setError('Google Sign-In configuration error. Please contact support.');
      return;
    }

    // Wait for google to be available
    const initializeGoogle = () => {
      if (window.google && googleButtonRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            ux_mode: 'popup',
          });

          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme,
            size,
            text,
            width,
          });
        } catch (err) {
          console.error('Failed to initialize Google Sign-In:', err);
          setError('Failed to initialize Google Sign-In');
        }
      } else {
        // Retry in 100ms if google not ready
        setTimeout(initializeGoogle, 100);
      }
    };

    initializeGoogle();

    // Cleanup
    return () => {
      try {
        window.google?.accounts.id.cancel();
      } catch (err) {
        console.error('Error canceling Google Sign-In:', err);
      }
    };
  }, []);

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      const errorMsg = 'No credential received from Google';
      console.error(errorMsg);
      setError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Send ID token to backend
      const authResponse = await authAPI.post('/google', {
        idToken: response.credential,
        accessToken: response.credential, // Google's library may not provide separate accessToken
      });

      // Store tokens
      const { accessToken, refreshToken, user } = authResponse.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      console.log('Google Sign-In successful:', user);

      if (onSuccess) onSuccess(user);

      // Auto-redirect on success
      if (autoRedirect) {
        navigate(redirectPath);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Google Sign-In failed';

      console.error('Google Sign-In error:', errorMsg);

      // Specific error handling
      if (
        errorMsg.includes('email') ||
        errorMsg.includes('already linked')
      ) {
        setError(
          'This email is already linked to a different account. Please use that account instead.',
        );
      } else if (errorMsg.includes('not verified')) {
        setError(
          'Please verify your email with Google before signing in.',
        );
      } else if (errorMsg.includes('inactive')) {
        setError('Your account has been deactivated. Contact support.');
      } else {
        setError(errorMsg);
      }

      if (onError) onError(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Error message display */}
      {error && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: '#FEE2E2',
            border: '1px solid #FCA5A5',
            borderRadius: '8px',
            color: '#991B1B',
            fontSize: '14px',
            lineHeight: '1.5',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
          role="alert"
        >
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#991B1B',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0',
              flexShrink: 0,
            }}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Google Sign-In button container */}
      <div
        ref={googleButtonRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          opacity: isLoading ? 0.6 : 1,
          pointerEvents: isLoading ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: '#6B7280',
          }}
        >
          Signing in...
        </div>
      )}

      {/* Help text */}
      <p
        style={{
          fontSize: '12px',
          color: '#9CA3AF',
          marginTop: '12px',
          textAlign: 'center',
        }}
      >
        We'll never share your Google account information
      </p>
    </div>
  );
}

export default GoogleSignIn;
