import React, { useState, useEffect } from 'react';

const P   = '#5B21B6';
const PL  = '#7C3AED';
const T1  = '#111827';
const T2  = '#6B7280';
const T3  = '#9CA3AF';
const BD  = '#E5E7EB';
const BG  = '#F9FAFB';
const W   = '#FFFFFF';
const GR  = '#059669';
const GRB = '#ECFDF5';
const AM  = '#D97706';
const AMB = '#FFFBEB';
const PAGE_SURFACE = 'radial-gradient(circle at top left, rgba(124,58,237,0.16), transparent 34%), linear-gradient(135deg, #f8f5ff 0%, #f9fafb 100%)';

function Icon({ name, size = 15, color = T3 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const paths = {
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /></>,
    info: <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" /><line x1="12" y1="16" x2="12" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="12" y1="8" x2="12.01" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    check: <polyline points="20,6 9,17 4,12" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
    menu: <><line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name]}</svg>;
}

export default function AnnouncementsPage({ onBack, onToggleSidebar, isMobile, isTablet }) {
  const isMobileLocal = isMobile !== undefined ? isMobile : (typeof window !== 'undefined' ? window.innerWidth < 640 : false);
  const isTabletLocal = isTablet !== undefined ? isTablet : (typeof window !== 'undefined' ? window.innerWidth >= 640 && window.innerWidth < 1024 : false);

  const announcements = [
    {
      id: 1,
      title: 'New Course Released: Advanced Solar Finance',
      content: 'We\'re excited to announce the launch of our new advanced course on solar project finance. Enroll today to learn from industry experts.',
      type: 'course',
      date: '2 hours ago',
      icon: 'check',
      color: GR,
      bgColor: GRB,
    },
    {
      id: 2,
      title: 'System Maintenance Scheduled',
      content: 'Scheduled maintenance on Saturday 10 PM - 2 AM EST. The platform will be temporarily unavailable during this period.',
      type: 'maintenance',
      date: '1 day ago',
      icon: 'info',
      color: AM,
      bgColor: AMB,
    },
    {
      id: 3,
      title: 'Community Feedback Results',
      content: 'Thank you for your feedback! We\'ve compiled the results and are implementing your top requested features.',
      type: 'feedback',
      date: '3 days ago',
      icon: 'bell',
      color: P,
      bgColor: '#EDE9FE',
    },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize: 14, color: T1, background: PAGE_SURFACE }}>
      {/* HEADER */}
      <div style={{ padding: isMobileLocal ? '12px 16px' : '20px 24px', borderBottom: '1px solid rgba(124, 58, 237, 0.16)', background: 'rgba(255,255,255,0.78)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 12px 40px rgba(91,33,182,0.06)' }}>
        {(isMobileLocal || isTabletLocal) && (
          <button onClick={onToggleSidebar} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T2, padding: 0, flexShrink: 0 }}>
            <Icon name="menu" size={20} color={T2} />
          </button>
        )}
        <div>
          <h1 style={{ fontSize: isMobileLocal ? 18 : 24, fontWeight: 700, color: T1, margin: '0 0 4px' }}>Announcements & Feedback</h1>
          <p style={{ fontSize: 12, color: T2, margin: 0 }}>Stay updated with community news and important updates</p>
        </div>
      </div>

      {/* CONTENT */}
      <div style={{ flex: 1, overflowY: 'auto', padding: isMobileLocal ? '16px' : '24px', background: BG }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              style={{
                background: 'rgba(255,255,255,0.82)',
                border: '1px solid rgba(124, 58, 237, 0.14)',
                borderRadius: 16,
                padding: isMobileLocal ? '16px' : '20px',
                marginBottom: 16,
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                backdropFilter: 'blur(18px)',
                boxShadow: '0 12px 36px rgba(15, 23, 42, 0.05)',
              }}
              onMouseEnter={(e) => {
                if (!isMobileLocal) e.currentTarget.style.boxShadow = '0 16px 40px rgba(91, 33, 182, 0.12)';
              }}
              onMouseLeave={(e) => {
                if (!isMobileLocal) e.currentTarget.style.boxShadow = '0 12px 36px rgba(15, 23, 42, 0.05)';
              }}
            >
              <div style={{ display: 'flex', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 10,
                    background: announcement.bgColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon name={announcement.icon} size={20} color={announcement.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: T1, margin: 0 }}>{announcement.title}</h3>
                    <span style={{ fontSize: 12, color: T3, whiteSpace: 'nowrap', flexShrink: 0 }}>{announcement.date}</span>
                  </div>
                  <p style={{ fontSize: 14, color: T2, margin: 0, lineHeight: 1.5 }}>{announcement.content}</p>
                  <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                    <button
                      style={{
                        background: 'none',
                        border: 'none',
                        color: P,
                        cursor: 'pointer',
                        fontSize: 13,
                        fontWeight: 500,
                        padding: 0,
                        transition: 'opacity 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.target.style.opacity = '1'}
                    >
                      Read More
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
