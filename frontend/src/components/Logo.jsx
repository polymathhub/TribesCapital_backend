import React, { useEffect, useState } from 'react';
import logoSvg from '../assets/logo.svg';

/**
 * Logo component with optional vibration animation on mount
 * @param {number} size - Size in pixels (default: 28)
 * @param {boolean} animate - Whether to trigger vibration on mount (default: true)
 * @param {string} style - Additional CSS classes or inline styles
 */
function LogoMark({ size = 28, animate = true, style = {} }) {
  const [isVibrating, setIsVibrating] = useState(animate);

  useEffect(() => {
    if (animate) {
      setIsVibrating(true);
      const timer = setTimeout(() => setIsVibrating(false), 800);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  return (
    <img
      src={logoSvg}
      alt="Tribes Capital Logo"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        animation: isVibrating ? 'vibrate 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none',
        ...style
      }}
    />
  );
}

function LogoFull({ size = 'medium', variant = 'dark', animate = true }) {
  const sizes = {
    small: { mark: 24, text: 11, gap: 8 },
    medium: { mark: 28, text: 12, gap: 10 },
    large: { mark: 36, text: 16, gap: 12 }
  };
  const s = sizes[size] || sizes.medium;
  const textColor = variant === 'dark' ? '#111827' : '#FFFFFF';
  const [isVibrating, setIsVibrating] = useState(animate);

  useEffect(() => {
    if (animate) {
      setIsVibrating(true);
      const timer = setTimeout(() => setIsVibrating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [animate]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: s.gap,
        flexShrink: 0,
        animation: isVibrating ? 'vibrate 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)' : 'none'
      }}
    >
      <img
        src={logoSvg}
        alt="Tribes Capital Logo"
        style={{
          width: s.mark,
          height: s.mark,
          flexShrink: 0
        }}
      />
      <span
        style={{
          fontWeight: 700,
          fontSize: s.text,
          color: textColor,
          letterSpacing: '0.5px',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap'
        }}
      >
        Tribes Capital
      </span>
    </div>
  );
}

function Logo({ size = 28, animate = true }) {
  return <LogoMark size={size} animate={animate} />;
}

export { LogoMark, LogoFull };
export default Logo;
