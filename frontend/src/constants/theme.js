/**
 * Theme and Design System Constants
 * Centralized design tokens and theme configuration
 */

export const COLORS = {
  // Primary
  primary: '#5B21B6',
  primaryLight: '#7C3AED',
  primaryDark: '#4C1D95',
  primaryFaint: '#EDE9FE',

  // Success
  success: '#059669',
  successFaint: '#ECFDF5',

  // Warning
  warning: '#D97706',
  warningFaint: '#FFFBEB',

  // Info
  info: '#1D4ED8',
  infoFaint: '#EFF6FF',

  // Teal
  teal: '#0D9488',
  tealFaint: '#F0FDFA',

  // Text
  textPrimary: '#111827',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',

  // UI
  border: '#E5E7EB',
  background: '#F9FAFB',
  white: '#FFFFFF',
};

export const TYPOGRAPHY = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  sizes: {
    xs: 10,
    sm: 11,
    base: 12,
    md: 13,
    lg: 14,
    xl: 15,
    '2xl': 16,
    '3xl': 20,
    '4xl': 26,
    '5xl': 28,
  },
  weights: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
};

export const BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1280,
};

export const ANIMATIONS = {
  duration: {
    fast: 150,
    base: 250,
    slow: 350,
    slower: 500,
  },
  easing: {
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export const SHADOWS = {
  sm: '0 4px 12px rgba(0, 0, 0, 0.08)',
  md: '0 8px 24px rgba(0, 0, 0, 0.12)',
  lg: '0 24px 64px rgba(0, 0, 0, 0.22), 0 4px 16px rgba(0, 0, 0, 0.1)',
  spotlight: '0 0 0 9999px rgba(17, 24, 39, 0.68)',
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  '2xl': 14,
  '3xl': 16,
  full: 9999,
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BREAKPOINTS,
  ANIMATIONS,
  SHADOWS,
  BORDER_RADIUS,
};
