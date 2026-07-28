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

const sequence = [
  'Post 1 introduces the campaign and explains that Tribes Capital is inviting contributors to help build the learning experience.',
  'Post 2 highlights the different ways people can take part, with content creation as the core invitation.',
  'Posts 3 to 6 spotlight the contributor roles over the following weeks so the ask feels practical and clear.',
  'Post 7 adds a human story and explains why the platform is being built with the community.',
  'Post 8 closes with a warm invitation for anyone who wants to contribute, even if they do not fit a formal title.'
];

const posts = [
  'Open with a simple announcement that Tribes Capital is building a stronger learning and community platform with help from contributors.',
  'Make the main call clear: we are looking for people who can create useful content for the Learning Hub and community experience.',
  'Feature content creators as the first priority: writers, editors, video makers, designers and storytellers who can explain energy topics clearly.',
  'Invite keynote speakers who can bring practical insight to Office Hours and live sessions.',
  'Welcome topic experts with experience in governance, market design, infrastructure, policy and finance.',
  'Highlight events collaborators who can help host sessions, share reach and strengthen the wider community.',
  'Add a human-centred story that explains why this campaign matters and why community participation is important.',
  'Close by welcoming general supporters and enthusiasts who want to contribute even without a formal title.'
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
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: P, marginBottom: 8 }}>Announcement • 8-post campaign</div>
            <h2 style={{ fontSize: isMobileLocal ? 22 : 28, fontWeight: 800, color: T1, margin: '0 0 8px' }}>TRIBES CAPITAL</h2>
            <h3 style={{ fontSize: isMobileLocal ? 18 : 22, fontWeight: 700, color: P, margin: '0 0 10px' }}>Call for contributors to help build the Learning Hub</h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: '0 0 10px' }}>
              Tribes Capital is inviting people who can help create useful educational content for the platform. We are especially looking for content creators, writers, video makers, speakers and subject-matter contributors who can turn complex energy topics into practical learning material.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: 0 }}>
              This campaign is meant to bring in people who can support the Learning Hub, Office Hours, community sessions and broader thought leadership on the platform.
            </p>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 10px' }}>Feedback channel</h4>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: '0 0 12px' }}>
              This section is only for feedback on the campaign. Please use it to share comments, suggestions or questions about the announcement, the contributor ask or the rollout plan.
            </p>
            <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', padding: '10px 14px', borderRadius: 999, background: PF, color: P, fontWeight: 700, textDecoration: 'none' }}>
              Share feedback →
            </a>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 10px' }}>What this announcement is about</h4>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: '0 0 10px' }}>
              This is a standalone call for contributors, separate from the broader platform explainer calendar. It is intended to recruit people who can help shape the learning experience and community content in a meaningful way.
            </p>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: T2, margin: 0 }}>
              Before launch, the team should confirm the contributor terms, the application route and the right timing for the rollout so the invitation feels clear and actionable.
            </p>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 12px' }}>Who we are looking for</h4>
            <div style={{ display: 'grid', gridTemplateColumns: isMobileLocal ? '1fr' : 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
              {roles.map((role) => (
                <div key={role.title} style={{ padding: '14px 16px', borderRadius: 16, background: '#F9FAFB', border: '1px solid rgba(124, 58, 237, 0.1)' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: P, marginBottom: 6 }}>{role.title}</div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: T2 }}>{role.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 10px' }}>Suggested sequencing</h4>
            <div style={{ display: 'grid', gap: 8 }}>
              {sequence.map((item, index) => (
                <div key={item} style={{ display: 'flex', gap: 8, fontSize: 14, color: T2, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 700, color: P }}>{index + 1}.</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding: isMobileLocal ? '18px' : '22px', borderRadius: 20, background: '#ffffff', border: '1px solid rgba(124, 58, 237, 0.16)', boxShadow: '0 16px 34px rgba(15, 23, 42, 0.04)' }}>
            <h4 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 12px' }}>Full 8-post breakdown</h4>
            <div style={{ display: 'grid', gap: 10 }}>
              {posts.map((post, index) => (
                <div key={post} style={{ padding: '12px 14px', borderRadius: 14, background: '#F9FAFB', border: '1px solid rgba(124, 58, 237, 0.08)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: P, marginBottom: 4 }}>Post {index + 1}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.6, color: T2 }}>{post}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
