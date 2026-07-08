import React from 'react';

const palette = {
  coral: '#FF6B6B',
  coralLight: '#FFB3B3',
  purple: '#7C3AED',
  purpleLight: '#EDE9FE',
  teal: '#14B8A6',
  green: '#22C55E',
  greenLight: '#DCFCE7',
  blue: '#3B82F6',
  blueLight: '#DBEAFE',
  amber: '#F59E0B',
  brown: '#8B5A3C',
  brownLight: '#D4A574',
  slate: '#111827',
  muted: '#6B7280',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

const CorporateMemphisIllustration = ({ variant = 'data', size = 220, style = {}, className = '' }) => {
  const shared = {
    width: size,
    height: size,
    display: 'block',
    ...style,
  };

  const renderVariant = () => {
    switch (variant) {
      case 'search': // Events/people gathering - video call theme
        return (
          <>
            {/* Radio/broadcast icon - top left */}
            <rect x="24" y="28" width="36" height="36" rx="10" fill={palette.coral} />
            <circle cx="42" cy="46" r="5" fill={palette.white} />
            <path d="M42 38 Q48 35 52 38" stroke={palette.white} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M42 34 Q50 30 58 34" stroke={palette.white} strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Video call frame 1 - left side */}
            <rect x="18" y="78" width="108" height="92" rx="14" fill={palette.white} stroke={palette.border} strokeWidth="2.5" />

            {/* Person 1 - brown skin, waving */}
            {/* Head */}
            <circle cx="56" cy="95" r="16" fill={palette.brownLight} />
            {/* Body */}
            <ellipse cx="56" cy="138" rx="24" ry="22" fill={palette.coralLight} />
            {/* Face details */}
            <circle cx="52" cy="93" r="6" fill={palette.slate} />
            {/* Hat - black */}
            <ellipse cx="56" cy="76" rx="16" ry="12" fill={palette.slate} />
            <path d="M40 76 Q56 68 72 76" stroke={palette.slate} strokeWidth="2" fill="none" />
            {/* Arm raised/waving */}
            <ellipse cx="82" cy="118" rx="10" ry="24" fill={palette.brownLight} transform="rotate(-30 82 118)" />
            {/* Hand */}
            <circle cx="88" cy="102" r="8" fill={palette.brownLight} />

            {/* Indicator dots */}
            <circle cx="32" cy="144" r="2" fill={palette.amber} />
            <circle cx="40" cy="144" r="2" fill={palette.amber} />
            <circle cx="48" cy="144" r="2" fill={palette.amber} />

            {/* Video call frame 2 - right side */}
            <rect x="138" y="93" width="100" height="82" rx="14" fill={palette.white} stroke={palette.border} strokeWidth="2.5" />

            {/* Person 2 - green shirt */}
            {/* Head */}
            <circle cx="173" cy="108" r="14" fill={palette.slate} />
            {/* Hair buns - black circles on sides */}
            <circle cx="156" cy="98" r="9" fill={palette.slate} />
            <circle cx="190" cy="98" r="9" fill={palette.slate} />
            {/* Body - green */}
            <ellipse cx="173" cy="145" rx="22" ry="18" fill={palette.green} />
            {/* Face - smile */}
            <circle cx="176" cy="108" r="3" fill={palette.white} />

            {/* Avatar circles - top right corner */}
            <circle cx="200" cy="48" r="16" fill={palette.blueLight} stroke={palette.border} strokeWidth="1.5" />
            <circle cx="200" cy="48" r="11" fill={palette.blue} />

            <circle cx="220" cy="73" r="17" fill={palette.purpleLight} stroke={palette.border} strokeWidth="1.5" />
            <circle cx="220" cy="73" r="12" fill={palette.purple} />

            {/* Avatar - bottom left */}
            <circle cx="32" cy="188" r="14" fill={palette.blueLight} stroke={palette.border} strokeWidth="1.5" />
            <circle cx="32" cy="188" r="9" fill={palette.blue} />
          </>
        );

      case 'spark': // Recently added - creative/ideas
        return (
          <>
            {/* Main lightbulb/idea circle */}
            <circle cx="68" cy="82" r="28" fill={palette.amber} />
            <circle cx="68" cy="82" r="24" fill={palette.amber} opacity="0.8" />
            {/* Filament */}
            <path d="M68 58 Q72 70 68 82 Q64 94 68 108" stroke={palette.white} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Base */}
            <rect x="64" y="108" width="8" height="12" rx="2" fill={palette.amber} />

            {/* Floating card/book 1 - green */}
            <rect x="110" y="55" width="48" height="42" rx="10" fill={palette.green} transform="rotate(-15 134 76)" />
            <circle cx="130" cy="73" r="5" fill={palette.white} />

            {/* Floating card/book 2 - blue */}
            <rect x="115" y="115" width="44" height="40" rx="10" fill={palette.blue} transform="rotate(12 137 135)" />
            <circle cx="133" cy="133" r="4" fill={palette.white} />

            {/* Decorative sparkle dots */}
            <circle cx="48" cy="45" r="5" fill={palette.coral} />
            <circle cx="165" cy="145" r="6" fill={palette.teal} />
            <circle cx="195" cy="75" r="4" fill={palette.purple} />

            {/* Sparkle effects */}
            <g fill={palette.amber}>
              <path d="M68 32 L71 38 L68 40 L65 38 Z" />
              <path d="M100 65 L104 71 L100 73 L96 71 Z" />
            </g>
          </>
        );

      case 'data':
      default: // Empty/no data - collaboration theme
        return (
          <>
            {/* Background accent circles */}
            <circle cx="62" cy="58" r="22" fill={palette.purpleLight} />
            <circle cx="188" cy="168" r="26" fill={palette.greenLight} opacity="0.7" />

            {/* Document/checklist frame */}
            <rect x="44" y="56" width="72" height="68" rx="12" fill={palette.white} stroke={palette.border} strokeWidth="2" />

            {/* List lines */}
            <line x1="56" y1="72" x2="104" y2="72" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="84" x2="104" y2="84" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="96" x2="96" y2="96" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" />
            <line x1="56" y1="108" x2="104" y2="108" stroke={palette.muted} strokeWidth="2" strokeLinecap="round" />

            {/* Success checkmark circle */}
            <circle cx="158" cy="138" r="28" fill={palette.green} />
            <path d="M148 138 L157 148 L172 128" stroke={palette.white} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />

            {/* Team avatars - stacked on right */}
            <circle cx="176" cy="68" r="13" fill={palette.purpleLight} stroke={palette.border} strokeWidth="1.5" />
            <circle cx="176" cy="68" r="9" fill={palette.purple} />

            <circle cx="186" cy="88" r="13" fill={palette.blueLight} stroke={palette.border} strokeWidth="1.5" />
            <circle cx="186" cy="88" r="9" fill={palette.blue} />

            <circle cx="176" cy="108" r="13" fill={palette.coralLight} stroke={palette.border} strokeWidth="1.5" />
            <circle cx="176" cy="108" r="9" fill={palette.coral} />
          </>
        );
    }
  };

  return (
    <svg
      viewBox="0 0 240 240"
      role="img"
      aria-label="Corporate Memphis illustration"
      className={className}
      style={shared}
    >
      <defs>
        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
        </filter>
      </defs>
      <rect width="240" height="240" fill="#F8FAFC" />
      {renderVariant()}
    </svg>
  );
};

export default CorporateMemphisIllustration;
