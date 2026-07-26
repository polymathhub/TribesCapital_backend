import React from 'react';
import announcementVideo from '../assets/illustrations/Questions.mp4';

const P   = '#5B21B6';
const PF  = '#EDE9FE';
const T1  = '#111827';
const T2  = '#6B7280';
const BG  = '#F9FAFB';
const PAGE_SURFACE = 'radial-gradient(circle at top left, rgba(124,58,237,0.16), transparent 34%), linear-gradient(135deg, #f8f5ff 0%, #f9fafb 100%)';

export default function AnnouncementsPage({ onBack, onToggleSidebar, isMobile, isTablet }) {
  const isMobileLocal = isMobile !== undefined ? isMobile : (typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize: 14, color: T1, background: PAGE_SURFACE }}>
      {/* HEADER */}
      <div style={{ padding: isMobileLocal ? '12px 16px' : '20px 24px', borderBottom: '1px solid rgba(124, 58, 237, 0.16)', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 40px rgba(91,33,182,0.06)' }}>
        <div>
          <h1 style={{ fontSize: isMobileLocal ? 18 : 24, fontWeight: 700, color: T1, margin: '0 0 4px' }}>Announcements & Feedback</h1>
          <p style={{ fontSize: 12, color: T2, margin: 0 }}>Stay updated with community news and important updates</p>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobileLocal ? '16px' : '24px', background: BG }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', paddingTop: isMobileLocal ? 8 : 24 }}>
          <div style={{ maxWidth: 580, margin: '0 auto 20px', padding: 0, background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'hidden', borderRadius: '50%' }}>
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: '100%', display: 'block', margin: '0 auto', background: 'transparent', border: 'none', outline: 'none', padding: 0, objectFit: 'cover' }}
            >
              <source src={announcementVideo} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <h2 style={{ fontSize: isMobileLocal ? 20 : 24, fontWeight: 700, color: T1, margin: '12px 0 8px' }}>Latest announcements</h2>
          <p style={{ fontSize: 14, color: T2, margin: '0 auto', lineHeight: 1.6, maxWidth: 560 }}>
            Community updates, learning reminders, and feedback prompts are now surfaced here in a more useful format.
          </p>
          <div style={{ maxWidth: 640, margin: '20px auto 0', display: 'grid', gap: 12, textAlign: 'left' }}>
            <div style={{ padding: '16px 18px', borderRadius: 16, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 12px 24px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7C3AED', marginBottom: 6 }}>Community update</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T1, marginBottom: 6 }}>Feedback is now being collected in Slack</div>
              <div style={{ fontSize: 13, color: T2, lineHeight: 1.6 }}>Members can share ideas, product feedback, and feature requests through the feedback thread so we can keep improving the experience.</div>
              <a href="https://tribescapital.slack.com/archives/C0A84A02TS7/p1784058949700869" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 10, fontSize: 13, fontWeight: 700, color: '#5B21B6', textDecoration: 'none' }}>Open feedback thread →</a>
            </div>
            <div style={{ padding: '16px 18px', borderRadius: 16, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 12px 24px rgba(15, 23, 42, 0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#0F766E', marginBottom: 6 }}>Learning reminder</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T1, marginBottom: 6 }}>Keep momentum going with live sessions and new resources</div>
              <div style={{ fontSize: 13, color: T2, lineHeight: 1.6 }}>This week’s focus is on staying active in the learning hub, joining office hours, and exploring fresh community content.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
