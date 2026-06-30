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
        background: 'linear-gradient(135deg, #f8f7ff 0%, #f5f7ff 42%, #f9fbff 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: fadeOut ? 'fadeOutLoader 0.5s ease-out forwards' : 'fadeInLoader 0.6s ease-out',
        padding: 24,
      }}
    >
      <div
        style={{
          background: 'rgba(255,255,255,0.8)',
          border: '1px solid rgba(91, 33, 182, 0.14)',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: '0 20px 50px rgba(17,24,39,0.08)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: 360,
          width: '100%',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          animation: 'softRise 0.7s ease-out',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LogoMark size={64} animate={false} />
        </div>

        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: '#111827',
              margin: 0,
              letterSpacing: '-0.3px',
            }}
          >
            Unlocking clean energy opportunities
          </p>
          <p
            style={{
              fontSize: 12,
              color: '#6B7280',
              margin: 0,
              letterSpacing: '0.6px',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            Welcome to Tribes Capital
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'rgba(91, 33, 182, 0.72)',
                animation: `pulse 1s ease-in-out infinite`,
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeInLoader {
          from { opacity: 1; }
          to { opacity: 1; }
        }

        @keyframes fadeOutLoader {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes softRise {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(0.9); opacity: 0.65; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default LoadingScreen;
