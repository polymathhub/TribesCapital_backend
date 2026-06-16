import React, { useEffect, useState } from 'react';
import logoPng from '../assets/image.png';

function LogoMark({ size = 28, animate = true, style = {} }) {
  return (
    <img
      src={logoPng}
      alt="Tribes Capital Logo"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
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

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: s.gap,
        flexShrink: 0,
      }}
    >
      <img
        src={logoPng}
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
