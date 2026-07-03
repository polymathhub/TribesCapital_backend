import React from 'react';
import { COLORS } from '../constants/colors';

const STEPS = [
  { id: 'welcome', target: null, pos: 'center', icon: '👋', title: 'Welcome to Tribes Capital',
    desc: "You're now part of a community of 240+ clean energy investors and professionals across Africa. Let us show you around in 8 quick steps." },
  { id: 'sidebar', target: 'sidebar', pos: 'right', icon: '🧭', title: 'Your main navigation',
    desc: 'Use this sidebar to jump between Learning Hub, Due Diligence Vault, Project Pipeline, Office Hours & Events, and every other community section.' },
  { id: 'banner', target: 'banner', pos: 'bottom', icon: '🏠', title: 'Your personal home base',
    desc: "This banner shows your community at a glance — active deals, upcoming events, course progress, and live pipeline value." },
  { id: 'stats', target: 'stats', pos: 'bottom', icon: '📊', title: 'Track your progress',
    desc: 'Four cards tracking community members, active projects, vault documents, and events this week — all updated in real time.' },
  { id: 'resume', target: 'resume', pos: 'bottom', icon: '📚', title: 'Pick up where you left off',
    desc: 'This card shows your most recent course. Click Continue to jump straight back into your learning right where you stopped.' },
  { id: 'learning', target: 'learning', pos: 'right', icon: '🎓', title: 'Continue your courses',
    desc: 'All your enrolled courses live here. Track progress, access lessons, and earn certificates as you complete each module.' },
  { id: 'events', target: 'events', pos: 'top', icon: '📅', title: 'Join live sessions',
    desc: 'Office Hours, workshops, and Member Circles run weekly. RSVP directly here so you never miss a live community session.' },
  { id: 'done', target: null, pos: 'center', icon: '🎉', title: "You're all set!",
    desc: "Dive into Learning Hub to continue your course, join an upcoming Office Hours, or explore the Project Pipeline. Welcome aboard!", isLast: true },
];

function TutorialOverlay({ step, total, spotlight, tipPos, onNext, onBack, onSkip }) {
  const cur = STEPS[step];

  return (
    <>
      {spotlight ? (
        <div style={{
          position: 'fixed', top: spotlight.top, left: spotlight.left,
          width: spotlight.width, height: spotlight.height,
          borderRadius: 14, zIndex: 1000, pointerEvents: 'none',
          boxShadow: '0 0 0 9999px rgba(17,24,39,0.68)',
          border: '2px solid rgba(255,255,255,0.55)',
          transition: 'all 0.35s cubic-bezier(.4,0,.2,1)',
        }}/>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.68)', zIndex: 999, pointerEvents: 'none' }}/>
      )}

      <div style={{
        position: 'fixed', ...tipPos,
        width: 340, background: COLORS.W, borderRadius: 14,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)',
        zIndex: 1001, overflow: 'hidden',
        animation: 'tipIn 0.25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ height: 4, background: COLORS.PF }}>
          <div style={{ height: 4, background: COLORS.P, width: `${((step + 1) / total) * 100}%`, transition: 'width .35s ease' }}/>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px 8px' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: COLORS.P, letterSpacing: .8, textTransform: 'uppercase' }}>
            Step {step + 1} of {total}
          </span>
          <button onClick={onSkip}
            style={{ width: 24, height: 24, borderRadius: '50%', background: '#F3F4F6', border: 'none', color: COLORS.T2, fontSize: 16, cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ padding: '2px 18px 18px' }}>
          <div style={{ fontSize: 30, marginBottom: 12, lineHeight: 1 }}>{cur.icon}</div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: COLORS.T1, margin: '0 0 8px', letterSpacing: -.3 }}>{cur.title}</h3>
          <p style={{ fontSize: 13, color: COLORS.T2, lineHeight: 1.65, margin: 0 }}>{cur.desc}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 18px', borderTop: `1px solid ${COLORS.BD}`, background: COLORS.BG }}>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{
                height: 6, width: i === step ? 18 : 6, borderRadius: 3,
                background: i === step ? COLORS.P : COLORS.BD, transition: 'all .2s ease',
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button onClick={onBack}
                style={{ border: `1px solid ${COLORS.BD}`, background: COLORS.W, color: COLORS.T2, fontSize: 13, padding: '8px 14px', borderRadius: 8, fontWeight: 500, cursor: 'pointer' }}>
                ← Back
              </button>
            )}
            <button onClick={onNext}
              style={{ border: 'none', background: COLORS.P, color: COLORS.W, fontSize: 13, padding: '8px 20px', borderRadius: 8, fontWeight: 500, cursor: 'pointer' }}>
              {step === total - 1 ? 'Start exploring ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tipIn {
          from { opacity:0; transform: scale(.95) translateY(8px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </>
  );
}

export { STEPS };
export default TutorialOverlay;
