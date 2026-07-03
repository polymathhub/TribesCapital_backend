import React, { useEffect, useState } from 'react';
import LogoMark from './Logo';

/**
 * Loading screen with vibrating logo and fade-in animation
 * Shows during app initialization and fades out when complete
 */
function LoadingScreen({ isVisible = true, onLoadComplete = () => {} }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      setFadeOut(false);
      return;
    }

    const timer = setTimeout(() => {
      setFadeOut(true);
      window.setTimeout(() => {
        onLoadComplete();
      }, 500);
    }, 2000);

    return () => clearTimeout(timer);
  }, [isVisible, onLoadComplete]);

  if (!isVisible && !fadeOut) return null;
  if (fadeOut) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: fadeOut ? 'fadeOutLoader 0.5s ease-out forwards' : 'fadeInLoader 0.6s ease-out',
        gap: 32,
      }}
    >
      {/* Vibrating Logo */}
      <div
        style={{
          animation: 'vibrate 0.8s ease-in-out infinite',
          filter: 'drop-shadow(0 0 20px rgba(124, 58, 237, 0.3))',
        }}
      >
        <LogoMark size={80} animate={false} />
      </div>

      {/* Loading text */}
      <div style={{ textAlign: 'center', gap: 12, display: 'flex', flexDirection: 'column' }}>
        <p
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: '#111827',
            margin: 0,
            letterSpacing: '-0.5px',
            animation: 'fadeInUp 0.8s ease-out 0.2s both',
          }}
        >
          Unlocking clean energy opportunities
        </p>
        <p
          style={{
            fontSize: 13,
            color: '#6B7280',
            margin: 0,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            fontWeight: 500,
            animation: 'fadeInUp 0.8s ease-out 0.4s both',
          }}
        >
          Welcome to Tribes Capital
        </p>
      </div>

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: 8, animation: 'fadeInUp 0.8s ease-out 0.6s both' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'rgba(91, 33, 182, 0.6)',
              animation: `bounce 1s ease-in-out infinite`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes fadeInLoader {
          from {
            opacity: 1;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes fadeOutLoader {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes vibrate {
          0%, 10%, 20%, 30%, 40%, 50%, 60%, 70%, 80%, 90%, 100% {
            transform: translate(0, 0);
          }
          5%, 15%, 25%, 35%, 45%, 55%, 65%, 75%, 85%, 95% {
            transform: translate(-3px, 0);
          }
          25%, 75% {
            transform: translate(3px, 0);
          }
        }

        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
            opacity: 0.6;
          }
          50% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
