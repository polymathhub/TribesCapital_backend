import { useState, useCallback } from 'react';

/**
 * Standard authentication error handler
 * Converts error responses into user-friendly messages
 */
export function getErrorMessage(error) {
  if (error.name === 'AbortError') {
    return 'Request timed out. Check your connection and try again.';
  }

  if (!error.response) {
    if (error.message?.includes('Network')) {
      return 'Network error. Check your connection.';
    }
    return 'Connection error. Please try again.';
  }

  const { status, data } = error.response;

  // Backend-specific error messages
  if (data?.message) {
    return data.message;
  }

  // Standard HTTP status codes
  switch (status) {
    case 400:
      return 'Invalid request. Please check your information.';
    case 401:
      return 'Invalid credentials. Please try again.';
    case 409:
      return 'Email is already registered. Please sign in instead.';
    case 422:
      return 'Please check your information and try again.';
    case 500:
      return 'Server error. Please try again in a moment.';
    default:
      return `Error: ${data?.message || 'Something went wrong'}`;
  }
}

/**
 * Reusable hook for form submission with error/loading states
 * Eliminates DRY violations across different auth forms
 */
export function useAuthForm(apiCall, onSuccess) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = useCallback(
    async (formData) => {
      if (loading) return; // Prevent race conditions

      setError('');
      setLoading(true);

      try {
        const result = await apiCall(formData);
        
        // Standard response structure
        if (result.data?.accessToken) {
          localStorage.setItem('token', result.data.accessToken);
          localStorage.setItem('refreshToken', result.data.refreshToken);
          localStorage.setItem('user', JSON.stringify(result.data.user));
          
          onSuccess?.(result.data);
        }

        return result.data;
      } catch (err) {
        const userMessage = getErrorMessage(err);
        setError(userMessage);
        console.error('Auth error:', err.response?.status, err.response?.data);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall, loading, onSuccess]
  );

  const clearError = useCallback(() => setError(''), []);

  return {
    loading,
    error,
    submit,
    clearError,
  };
}

/**
 * Hook for email validation (standard across all auth forms)
 */
export function useEmailValidation() {
  const [emailError, setEmailError] = useState('');

  const validateEmail = useCallback((email) => {
    if (!email) {
      setEmailError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }

    setEmailError('');
    return true;
  }, []);

  return { emailError, validateEmail, clearEmailError: () => setEmailError('') };
}

/**
 * Hook for password validation (standard strength requirements)
 */
export function usePasswordValidation() {
  const [passwordError, setPasswordError] = useState('');
  const [strength, setStrength] = useState(0);

  const validatePassword = useCallback((password) => {
    if (!password) {
      setPasswordError('Password is required');
      setStrength(0);
      return false;
    }

    const requirements = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      symbol: /[!@#$%^&*]/.test(password),
    };

    const passedRequirements = Object.values(requirements).filter(Boolean).length;
    setStrength(passedRequirements);

    if (!Object.values(requirements).every(Boolean)) {
      setPasswordError(
        'Password must have: 12+ chars, uppercase, lowercase, number, and symbol'
      );
      return false;
    }

    setPasswordError('');
    return true;
  }, []);

  return {
    passwordError,
    strength,
    validatePassword,
    clearPasswordError: () => setPasswordError(''),
  };
}

/**
 * Standard form validation for auth forms
 */
export function validateAuthForm(formData, requiredFields = []) {
  const errors = {};

  requiredFields.forEach((field) => {
    if (!formData[field] || (typeof formData[field] === 'string' && !formData[field].trim())) {
      errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
