import React from 'react';

const P = '#5B21B6';
const PF = '#EDE9FE';
const T1 = '#111827';
const T2 = '#6B7280';
const BG = '#F9FAFB';
const PAGE_SURFACE = 'radial-gradient(circle at top left, rgba(124,58,237,0.16), transparent 34%), linear-gradient(135deg, #f8f5ff 0%, #f9fafb 100%)';
const FEEDBACK_URL = 'https://docs.google.com/spreadsheets/d/1s37cO0WHPYuzddpyevxpPEj40hopIUdqR9ciJWDzLgY/edit?usp=sharing';

const roles = [
  {
    title: 'Content creators',
    description: 'Writers, editors, video makers and illustrators who can turn complex energy topics into clear, useful learning content.'
  },
  {
    title: 'Keynote speakers',
    description: 'Practitioners and specialists who can share real insight during Office Hours, webinars and community sessions.'
  },
  {
    title: 'Topic experts',
    description: 'People with strong knowledge across policy, governance, market structure, infrastructure and finance.'
  },
  {
    title: 'Events collaborators',
    description: 'Partners who can help host sessions, widen outreach and bring more community energy into the platform.'
  }
];

const waysToHelp = [
  'Share your perspective by creating content that makes energy topics easier to understand.',
  'Join a live session or office hour to offer practical insight and help others learn.',
  'Support the community by helping us shape discussions, events, and learning experiences.',
  'Bring your voice, experience, or network if you want to help the platform grow.'
];

const invitationPoints = [
  'We are inviting people who care about helping others learn and build a stronger community.',
  'If you enjoy writing, speaking, teaching, designing, or organizing, there is a place for you here.',
  'We are especially interested in people who can share useful knowledge about clean energy, markets, policy, and innovation.',
  'You do not need a formal title to contribute — thoughtful participation matters.'
];

export default function AnnouncementsPage({ onBack, onToggleSidebar, isMobile, isTablet }) {
  const isMobileLocal = isMobile !== undefined ? isMobile : (typeof window !== 'undefined' ? window.innerWidth < 640 : false);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize: 14, color: T1, background: PAGE_SURFACE }}>
      <div style={{ padding: isMobileLocal ? '12px 16px' : '20px 24px', borderBottom: '1px solid rgba(124, 58, 237, 0.16)', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 40px rgba(91,33,182,0.06)' }}>
        <div>
          <h1 style={{ fontSize: isMobileLocal ? 18 : 24, fontWeight: 700, color: T1, margin: '0 0 4px' }}>Announcements & Feedback</h1>
          <p style={{ fontSize: 12, color: T2, margin: 0 }}>A clearer view of the latest community update and the feedback channel</p>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: isMobileLocal ? '16px' : '24px', background: BG }}>
        <div style={{ maxWidth: 960, margin: '0 auto', display: 'grid', gap: 16 }}>
          <div style={{ padding: isMobileLocal ? '20px 18px' : '28px 30px', borderRadius: 24, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 20px 50px rgba(15, 23, 42, 0.06)' }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: P, marginBottom: 8 }}>Community announcement</div>
            <h2 style={{ fontSize: isMobileLocal ? 22 : 28, fontWeight: 800, color: T1, margin: '0 0 8px' }}>We are building with the community</h2>
            <h3 style={{ fontSize: isMobileLocal ? 18 : 22, fontWeight: 700, color: P, margin: '0 0 10px' }}>We are looking for people who want to help shape the Learning Hub</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: '0 0 10px' }}>
              Tribes Capital is opening the door for contributors who want to help create a more useful, welcoming, and knowledge-rich community experience.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: 0 }}>
              Whether you are a writer, speaker, educator, organizer, or simply someone with strong ideas and a willingness to contribute, we would love to hear from you.
            </p>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 10px' }}>Share your voice</h4>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: '0 0 12px' }}>
              If you have feedback, ideas, or questions about how this community effort should feel and function, please share them here.
            </p>
            <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 999, background: PF, color: P, fontWeight: 700, textDecoration: 'none' }}>
              Share feedback →
            </a>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 10px' }}>What we are looking for</h4>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: '0 0 10px' }}>
              We are looking for people who want to contribute in practical and meaningful ways to the Learning Hub and wider community experience.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: 0 }}>
              Your contribution could be sharing knowledge, helping run events, creating helpful content, or simply bringing energy and perspective to the community.
            </p>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 12px' }}>Ways to get involved</h4>
            <div style={{ display: 'grid', gridTemplateColumns: isMobileLocal ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {waysToHelp.map((way) => (
                <div key={way} style={{ padding: '14px 16px', borderRadius: 16, background: '#F9FAFB', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: T2 }}>{way}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 10px' }}>What makes a good contribution</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {invitationPoints.map((item, index) => (
                <div key={item} style={{ display: 'flex', gap: 8, fontSize: 14, color: T2, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: P }}>{index + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 12px' }}>A simple invitation</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              <div style={{ padding: '12px 14px', borderRadius: 14, background: '#F9FAFB', border: '1px solid rgba(124, 58, 237, 0.08)' }}>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: T2 }}>If this feels like your kind of space, we encourage you to join in and contribute in whatever way feels natural and meaningful to you.</div>
              </div>
              <div style={{ padding: '12px 14px', borderRadius: 14, background: '#F9FAFB', border: '1px solid rgba(124, 58, 237, 0.08)' }}>
                <div style={{ fontSize: 14, lineHeight: 1.6, color: T2 }}>We are excited to see the ideas, energy, and support that the community brings forward.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
