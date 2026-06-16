import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usersAPI, coursesAPI, eventsAPI } from '../api/endpoints';
import { LogoMark } from '../components/Logo';
import LearningHub from './LearningHub';
import DueDiligencePage from './DueDiligencePage';
import OfficeHoursEvents from './OfficeHoursEvents';
import '../styles/responsive.css';

/* ─── DESIGN TOKENS ─────────────────────────────────── */
const P   = '#5B21B6';
const PL  = '#7C3AED';
const PD  = '#4C1D95';
const PF  = '#EDE9FE';
const GR  = '#059669';
const GRB = '#ECFDF5';
const AM  = '#D97706';
const AMB = '#FFFBEB';
const BLU = '#1D4ED8';
const BLB = '#EFF6FF';
const TL  = '#0D9488';
const TLB = '#F0FDFA';
const T1  = '#111827';
const T2  = '#6B7280';
const T3  = '#9CA3AF';
const BD  = '#E5E7EB';
const BG  = '#F9FAFB';
const W   = '#FFFFFF';

/* ─── SIDEBAR NAV (Production-only pages) ─────────────────────────────────── */
const SIDEBAR_NAV = [
  { label: 'Home', id: 'home', icon: 'home' },
  { label: 'Learning Hub', id: 'learning', icon: 'book' },
  { label: 'Due Diligence Vault', id: 'due-diligence', icon: 'folder' },
  { label: 'Office Hours & Events', id: 'events', icon: 'calendar' },
  null, // divider
  { label: 'Announcements & Feedback', id: 'announcements', icon: 'bell' },
  { label: 'Help', id: 'help', icon: 'help' },
];

/* ─── ICON SVGs ────────────────────────────────── */
function Icon({ name, size = 15, color = T3 }) {
  const s = { width: size, height: size, flexShrink: 0 };
  const paths = {
    home: <><path d="M3 9.5L9 4l6 5.5V19H6v-5h6v5h3V9.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>,
    book: <><path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /><path d="M4 15h16" stroke={color} strokeWidth="1.5" /></>,
    folder: <><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke={color} strokeWidth="1.5" fill="none" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none" /><line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5" /><line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.5" /><line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /></>,
    help: <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" /><path d="M9 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /><line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    menu: <><line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round" /><line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round" /></>,
    close: <><line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" /><line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" /></>,
    doc: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" fill="none" /><polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="1.5" fill="none" /><line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.5" /><line x1="8" y1="17" x2="12" y2="17" stroke={color} strokeWidth="1.5" /></>,
    clock: <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none" /><polyline points="12,6 12,12 16,14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" /></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name]}</svg>;
}

/* ─── HELPER: Get Time-Based Greeting ────────────────────────────────── */
function getGreeting(username) {
  const hour = new Date().getHours();
  let timeGreet = 'Good morning';
  if (hour >= 12 && hour < 17) timeGreet = 'Good afternoon';
  if (hour >= 17 && hour < 21) timeGreet = 'Good evening';
  if (hour >= 21 || hour < 5) timeGreet = 'Good night';
  return `${timeGreet}, ${username}! 👋`;
}

/* ─── COURSE CARD ────────────────────────────────────── */
function CourseCard({ course, onNavigate }) {
  const categoryColors = {
    'Energy Finance': GR,
    'Solar & Storage': BLU,
    'Risk & FX': AM,
    'Policy & ESG': TL,
  };
  const catColor = categoryColors[course.category] || P;
  const progress = course.progress || 0;

  return (
    <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, marginBottom: 12, overflow: 'hidden', transition: 'all 0.3s ease', cursor: 'pointer' }} onClick={() => onNavigate('learning')}>
      <div style={{ height: 3, background: '#F3F4F6' }}>
        <div style={{ height: 3, width: `${progress}%`, background: catColor, borderRadius: '0 3px 3px 0' }} />
      </div>
      <div style={{ padding: '14px 18px 16px', display: 'flex', gap: 14 }}>
        <div style={{ width: 36, height: 44, background: PF, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: P, fontSize: 16 }}>
          <Icon name="doc" size={18} color={catColor} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: catColor, letterSpacing: 0.6, textTransform: 'uppercase', margin: '0 0 5px' }}>{course.category}</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: T1, margin: '0 0 4px', lineHeight: 1.35 }}>{course.title}</p>
          <p style={{ fontSize: 12, color: T2, margin: '0 0 14px' }}>{course.lessons?.length || 0} lessons</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 160, height: 4, background: '#F3F4F6', borderRadius: 4 }}>
                <div style={{ width: `${progress}%`, height: 4, background: catColor, borderRadius: 4 }} />
              </div>
              <span style={{ fontSize: 12, color: T2 }}>{progress}%</span>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onNavigate('learning'); }} style={{ background: catColor, color: W, border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'opacity 0.2s' }}>
              {progress > 0 ? 'Continue' : 'Start'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── EVENT CARD ────────────────────────────────────── */
function EventCard({ event, onJoin }) {
  const eventTypeColors = {
    'Office Hours': GR,
    'Workshop': BLU,
    'Webinar': AM,
    'Member Circle': TL,
  };
  const eventColor = eventTypeColors[event.type] || P;
  const eventDate = event.date ? new Date(event.date) : new Date();

  return (
    <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, padding: '14px 18px', marginBottom: 12, display: 'flex', gap: 14, alignItems: 'flex-start', transition: 'all 0.3s ease' }}>
      <div style={{ width: 44, height: 44, background: eventColor + '20', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="calendar" size={20} color={eventColor} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: eventColor, letterSpacing: 0.6, textTransform: 'uppercase', margin: '0 0 4px' }}>{event.type}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: T1, margin: '0 0 4px' }}>{event.title}</p>
        <p style={{ fontSize: 12, color: T2, margin: 0 }}>📅 {eventDate.toLocaleDateString()} {event.time && `at ${event.time}`}</p>
      </div>
      <button onClick={() => onJoin(event.id)} style={{ background: eventColor, color: W, border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'opacity 0.2s' }}>
        {event.enrolled ? '✓ Joined' : 'Join'}
      </button>
    </div>
  );
}

/* ─── MAIN HOME PAGE ───────────────────────────────────────── */
export default function HomePage({ user, currentPage, onNavigate, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [winW, setWinW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [userData, setUserData] = useState(user || {});
  const [courses, setCourses] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ members: 240, projects: 12, documents: 48, events: 8 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const h = () => setWinW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const isMobile = winW < 640;
  const isTablet = winW >= 640 && winW < 1024;

  // Load user data and courses on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch user profile
        try {
          const profileRes = await usersAPI.getProfile();
          if (profileRes.data) {
            setUserData(profileRes.data);
            localStorage.setItem('userName', profileRes.data.firstName || profileRes.data.email?.split('@')[0] || 'User');
          }
        } catch (err) {
          console.log('Profile endpoint may not be implemented yet:', err.message);
        }
        // Fetch enrolled courses
        try {
          const coursesRes = await coursesAPI.getEnrolled();
          if (coursesRes.data) {
            setCourses(coursesRes.data);
          }
        } catch (err) {
          console.log('Courses endpoint may not be implemented yet:', err.message);
        }
        // Fetch upcoming events
        try {
          const eventsRes = await eventsAPI.list({ limit: 3 });
          if (eventsRes.data) {
            setEvents(eventsRes.data);
          }
        } catch (err) {
          console.log('Events endpoint may not be implemented yet:', err.message);
        }
      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [user]);

  const username = userData.firstName || userData.name || localStorage.getItem('userName') || 'User';
  const greeting = getGreeting(username);

  const handleNavigation = (page) => {
    setSidebarOpen(false);
    onNavigate(page);
  };

  const handleJoinEvent = async (eventId) => {
    try {
      // Call join endpoint if available
      await eventsAPI.join?.(eventId);
      // Refresh events
      try {
        const res = await eventsAPI.list({ limit: 3 });
        if (res.data) setEvents(res.data);
      } catch (err) {
        console.log('Could not refresh events');
      }
    } catch (err) {
      console.error('Error joining event:', err);
    }
  };

  const handleLogoutClick = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    onLogout();
  };

  // Render other pages
  if (currentPage === 'learning') {
    return <LearningHub onBack={() => handleNavigation('home')} />;
  }
  if (currentPage === 'due-diligence') {
    return <DueDiligencePage onBack={() => handleNavigation('home')} />;
  }
  if (currentPage === 'events') {
    return <OfficeHoursEvents onBack={() => handleNavigation('home')} />;
  }

  // RENDER HOME PAGE
  return (
    <div style={{ display: 'flex', height: '100vh', background: BG, fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize: 14, overflow: 'hidden', color: T1 }}>
      {/* DESKTOP/TABLET SIDEBAR */}
      {!isMobile && (
        <div style={{ width: isTablet ? '240px' : '280px', background: W, borderRight: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', height: '100vh', zIndex: 100 }}>
          {/* Logo */}
          <div style={{ padding: '20px 16px', borderBottom: `1px solid ${BD}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <LogoMark size={32} animate={false} />
              <span style={{ fontSize: 13, fontWeight: 700, color: T1, letterSpacing: 0.5 }}>Tribes Capital</span>
            </div>
          </div>

          {/* Nav Items */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
            {SIDEBAR_NAV.map((item, idx) => {
              if (!item) return <div key={`divider-${idx}`} style={{ height: 1, background: BD, margin: '8px 0' }} />;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    margin: '2px 0',
                    background: isActive ? PF : 'transparent',
                    border: 'none',
                    borderRadius: 8,
                    color: isActive ? P : T2,
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Icon name={item.icon} size={16} color={isActive ? P : T2} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div style={{ padding: '12px 8px', borderTop: `1px solid ${BD}`, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: PF, fontSize: 12 }}>
              <p style={{ margin: '0 0 4px', fontWeight: 600, color: T1 }}>Logged in as</p>
              <p style={{ margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: T2 }}>{userData.email || user?.email}</p>
            </div>
            <button
              onClick={handleLogoutClick}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#FEF2F2',
                color: '#DC2626',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && sidebarOpen && (
        <>
          <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
          <div style={{ position: 'fixed', left: 0, top: 0, width: '240px', height: '100vh', background: W, zIndex: 100, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
            {/* Logo */}
            <div style={{ padding: '20px 16px', borderBottom: `1px solid ${BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <LogoMark size={32} animate={false} />
                <span style={{ fontSize: 13, fontWeight: 700, color: T1 }}>Tribes</span>
              </div>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T2, padding: 0 }}>
                <Icon name="close" size={20} color={T2} />
              </button>
            </div>

            {/* Nav Items */}
            <div style={{ flex: 1, padding: '12px 8px' }}>
              {SIDEBAR_NAV.map((item, idx) => {
                if (!item) return <div key={`divider-${idx}`} style={{ height: 1, background: BD, margin: '8px 0' }} />;
                const isActive = currentPage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.id)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      margin: '2px 0',
                      background: isActive ? PF : 'transparent',
                      border: 'none',
                      borderRadius: 8,
                      color: isActive ? P : T2,
                      fontSize: 13,
                      fontWeight: isActive ? 600 : 500,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <Icon name={item.icon} size={16} color={isActive ? P : T2} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Logout */}
            <div style={{ padding: '12px 8px', borderTop: `1px solid ${BD}` }}>
              <button
                onClick={handleLogoutClick}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: '#FEF2F2',
                  color: '#DC2626',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* HEADER */}
        <div style={{ padding: isMobile ? '12px 16px' : '20px 24px', borderBottom: `1px solid ${BD}`, background: W, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {isMobile && (
            <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T2, padding: 0 }}>
              <Icon name="menu" size={20} color={T2} />
            </button>
          )}
          <div style={{ flex: 1, marginLeft: isMobile ? '12px' : 0 }}>
            <h1 style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: T1, margin: 0 }}>{greeting}</h1>
            <p style={{ fontSize: 12, color: T2, margin: '0' }}>Welcome back to your community</p>
          </div>
          {!isMobile && (
            <button
              onClick={handleLogoutClick}
              style={{
                background: 'none',
                border: 'none',
                color: T2,
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                padding: '8px 12px',
                borderRadius: 6,
                transition: 'all 0.2s ease',
              }}
            >
              Logout
            </button>
          )}
        </div>

        {/* CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: T2 }}>
              <p>Loading your dashboard...</p>
            </div>
          ) : (
            <div>
              {/* Welcome Banner */}
              <div style={{ background: `linear-gradient(135deg, ${P} 0%, ${PL} 100%)`, borderRadius: 16, padding: isMobile ? '20px' : '32px', marginBottom: 24, color: W }}>
                <h2 style={{ fontSize: isMobile ? 20 : 28, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.2 }}>Welcome to Tribes Capital</h2>
                <p style={{ fontSize: isMobile ? 13 : 14, margin: 0, opacity: 0.95 }}>You're part of a community of {stats.members}+ clean energy investors & professionals across Africa</p>
              </div>

              {/* STATS GRID */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'Members', value: stats.members, icon: '👥' },
                  { label: 'Projects', value: stats.projects, icon: '📊' },
                  { label: 'Documents', value: stats.documents, icon: '📄' },
                  { label: 'Events', value: stats.events, icon: '📅' },
                ].map((stat, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: W,
                      border: `1px solid ${BD}`,
                      borderRadius: 12,
                      padding: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
                    <div style={{ fontSize: isMobile ? 18 : 20, fontWeight: 700, color: T1, margin: '0 0 4px' }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: T2, fontWeight: 500 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* TWO COLUMN LAYOUT */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '2fr 1fr', gap: 24 }}>
                {/* LEFT: Courses & Events */}
                <div>
                  {/* Courses */}
                  {courses.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: T1, marginBottom: 12, margin: '0 0 12px 0' }}>Continue Learning</h3>
                      {courses.slice(0, 2).map((course) => (
                        <CourseCard key={course.id} course={course} onNavigate={handleNavigation} />
                      ))}
                      {courses.length > 2 && (
                        <button
                          onClick={() => handleNavigation('learning')}
                          style={{
                            width: '100%',
                            padding: '12px',
                            background: PF,
                            color: P,
                            border: `1px solid ${BD}`,
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          View All {courses.length} Courses
                        </button>
                      )}
                    </div>
                  )}

                  {/* Events */}
                  {events.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 12px 0' }}>Upcoming Events</h3>
                      {events.map((event) => (
                        <EventCard key={event.id} event={event} onJoin={handleJoinEvent} />
                      ))}
                      <button
                        onClick={() => handleNavigation('events')}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: PF,
                          color: P,
                          border: `1px solid ${BD}`,
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                          marginTop: 12,
                        }}
                      >
                        View All Events
                      </button>
                    </div>
                  )}

                  {courses.length === 0 && events.length === 0 && (
                    <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, padding: '24px', textAlign: 'center', color: T2 }}>
                      <p style={{ margin: 0, marginBottom: '16px' }}>No courses or events yet. Start exploring!</p>
                      <button
                        onClick={() => handleNavigation('learning')}
                        style={{
                          padding: '10px 20px',
                          background: P,
                          color: W,
                          border: 'none',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Explore Courses
                      </button>
                    </div>
                  )}
                </div>

                {/* RIGHT: Quick Links */}
                {!isMobile && (
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: T1, margin: '0 0 12px 0' }}>Quick Links</h3>
                    {[
                      { label: 'Learning Hub', icon: 'book', page: 'learning' },
                      { label: 'Due Diligence', icon: 'folder', page: 'due-diligence' },
                      { label: 'Office Hours', icon: 'calendar', page: 'events' },
                    ].map((link) => (
                      <button
                        key={link.page}
                        onClick={() => handleNavigation(link.page)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          marginBottom: 8,
                          background: W,
                          border: `1px solid ${BD}`,
                          borderRadius: 8,
                          textAlign: 'left',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          fontSize: 13,
                          fontWeight: 500,
                          color: T1,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Icon name={link.icon} size={16} color={P} />
                        {link.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
