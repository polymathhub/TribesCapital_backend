import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import LearningHub from './LearningHub';
import DueDiligencePage from './DueDiligencePage';
import OfficeHoursEvents from './OfficeHoursEvents';
import AnnouncementsPage from './AnnouncementsPage';
import HelpPage from './HelpPage';
import { usersAPI, coursesAPI, eventsAPI, notificationsAPI } from '../api/endpoints';

/* ─── DESIGN TOKENS ─── */
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

/* ─── TUTORIAL STEPS ──────*/
const STEPS = [
  { id:'welcome',  target:null,       pos:'center', icon:'👋', title:'Welcome to Tribes Capital',
    desc:"You're now part of a community of 240+ clean energy investors and professionals across Africa. Let us show you around in 8 quick steps." },
  { id:'sidebar',  target:'sidebar',  pos:'right',  icon:'🧭', title:'Your main navigation',
    desc:'Use this sidebar to jump between Learning Hub, Due Diligence Vault, Project Pipeline, Office Hours & Events, and every other community section.' },
  { id:'banner',   target:'banner',   pos:'bottom', icon:'🏠', title:'Your personal home base',
    desc:"This banner shows your community at a glance — active deals, upcoming events, course progress, and live pipeline value." },
  { id:'stats',    target:'stats',    pos:'bottom', icon:'📊', title:'Track your progress',
    desc:'Four cards tracking community members, active projects, vault documents, and events this week — all updated in real time.' },
  { id:'resume',   target:'resume',   pos:'bottom', icon:'📚', title:'Pick up where you left off',
    desc:'This card shows your most recent course. Click Continue to jump straight back into your learning right where you stopped.' },
  { id:'learning', target:'learning', pos:'right',  icon:'🎓', title:'Continue your courses',
    desc:'All your enrolled courses live here. Track progress, access lessons, and earn certificates as you complete each module.' },
  { id:'events',   target:'events',   pos:'top',    icon:'📅', title:'Join live sessions',
    desc:'Office Hours, workshops, and Member Circles run weekly. RSVP directly here so you never miss a live community session.' },
  { id:'done',     target:null,       pos:'center', icon:'🎉', title:"You're all set!",
    desc:"Dive into Learning Hub to continue your course, join an upcoming Office Hours, or explore the Project Pipeline. Welcome aboard!", isLast:true },
];

/* ─── SMALL ICON SVGs ────────────────────────────────── */
const TOUR_VISITS_KEY = 'tribescapital_welcome_tour_visits';

const getTourVisitCount = () => {
  if (typeof window === 'undefined') return 0;
  const storedValue = window.localStorage.getItem(TOUR_VISITS_KEY);
  const parsedValue = Number(storedValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

function Icon({ name, size=15, color=T3 }) {
  const s = { width:size, height:size, flexShrink:0 };
  const paths = {
    home:    <><path d="M3 9.5L9 4l6 5.5V19H6v-5h6v5h3V9.5" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    book:    <><path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M4 15h16" stroke={color} strokeWidth="1.5"/></>,
    folder:  <><path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke={color} strokeWidth="1.5" fill="none"/></>,
    chart:   <><polyline points="22,12 18,12 15,21 9,3 6,12 2,12" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    file:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="1.5" fill="none"/></>,
    calendar:<><rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="1.5" fill="none"/><line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth="1.5"/><line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth="1.5"/><line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth="1.5"/></>,
    users:   <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.5" fill="none"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    monitor: <><rect x="2" y="3" width="20" height="14" rx="2" stroke={color} strokeWidth="1.5" fill="none"/><line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="1.5"/><line x1="12" y1="17" x2="12" y2="21" stroke={color} strokeWidth="1.5"/></>,
    globe:   <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none"/><line x1="2" y1="12" x2="22" y2="12" stroke={color} strokeWidth="1.5"/><path d="M12 2a15 15 0 010 20M12 2a15 15 0 000 20" stroke={color} strokeWidth="1.5" fill="none"/></>,
    bell:    <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    help:    <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none"/><path d="M9 9a3 3 0 015.83 1c0 2-3 3-3 3" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><line x1="12" y1="17" x2="12.01" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/></>,
    search:  <><circle cx="11" cy="11" r="8" stroke={color} strokeWidth="1.5" fill="none"/><path d="M21 21l-4.35-4.35" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
    bell2:   <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M13.73 21a2 2 0 01-3.46 0" stroke={color} strokeWidth="1.5" fill="none"/></>,
    doc:     <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="14,2 14,8 20,8" stroke={color} strokeWidth="1.5" fill="none"/><line x1="8" y1="13" x2="16" y2="13" stroke={color} strokeWidth="1.5"/><line x1="8" y1="17" x2="12" y2="17" stroke={color} strokeWidth="1.5"/></>,
    arrow:   <><line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><polyline points="12,5 19,12 12,19" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    time:    <><circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.5" fill="none"/><polyline points="12,6 12,12 16,14" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round"/></>,
    grid:    <><rect x="3" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/><rect x="14" y="3" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/><rect x="3" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/><rect x="14" y="14" width="7" height="7" rx="1" stroke={color} strokeWidth="1.5" fill="none"/></>,
    list:    <><line x1="3" y1="6" x2="21" y2="6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="12" x2="21" y2="12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><line x1="3" y1="18" x2="21" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
  };
  const NAV_ICONS = {
    'Home':'home','Learning Hub':'book','Due Diligence Vault':'folder',
    'Project Pipeline':'chart','Reporting Library':'file','Office Hours & Events':'calendar',
    'Member Circles':'users','Toolkits & Templates':'monitor','Partner Marketplace':'globe',
    'Announcements & Feedback':'bell','Help':'help',
  };
  const iconName = NAV_ICONS[name] || name;
  return <svg viewBox="0 0 24 24" style={s}>{paths[iconName]}</svg>;
}

/* ─── TUTORIAL OVERLAY ───────────────────────────────── */
function TutorialOverlay({ step, total, spotlight, tipPos, onNext, onBack, onSkip, isMobile }) {
  const cur = STEPS[step];
  const tipW = isMobile ? Math.min(320, (typeof window !== 'undefined' ? window.innerWidth : 340) - 24) : 340;

  return (
    <>
      {/* Spotlight or solid overlay */}
      {spotlight ? (
        <div style={{
          position:'fixed', top:spotlight.top, left:spotlight.left,
          width:spotlight.width, height:spotlight.height,
          borderRadius:14, zIndex:1000, pointerEvents:'none',
          boxShadow:'0 0 0 9999px rgba(17,24,39,0.68)',
          border:'2px solid rgba(255,255,255,0.55)',
          transition:'all 0.35s cubic-bezier(.4,0,.2,1)',
        }}/>
      ) : (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.68)', zIndex:999, pointerEvents:'none' }}/>
      )}

      {/* Tooltip card */}
      <div style={{
        position:'fixed', ...tipPos,
        width:tipW, background:W, borderRadius:14,
        boxShadow:'0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1)',
        zIndex:1001, overflow:'hidden',
        animation:'tipIn 0.25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* Purple progress bar */}
        <div style={{ height:4, background:'#EDE9FE' }}>
          <div style={{ height:4, background:P, width:`${((step+1)/total)*100}%`, transition:'width .35s ease', borderRadius:'0 2px 2px 0' }}/>
        </div>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px 8px' }}>
          <span style={{ fontSize:10, fontWeight:700, color:P, letterSpacing:.8, textTransform:'uppercase' }}>
            Step {step+1} of {total}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button onClick={onSkip} style={btnStyle('none', 'none', T3, 12)}>Skip tour</button>
            <button onClick={onSkip}
              style={{ ...circleBtn, background:'#F3F4F6', border:'none', color:T2, fontSize:16, lineHeight:1 }}>×</button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'2px 18px 18px' }}>
          <div style={{ fontSize:30, marginBottom:12, lineHeight:1 }}>{cur.icon}</div>
          <h3 style={{ fontSize:16, fontWeight:700, color:T1, margin:'0 0 8px', letterSpacing:-.3 }}>{cur.title}</h3>
          <p style={{ fontSize:13, color:T2, lineHeight:1.65, margin:0 }}>{cur.desc}</p>
        </div>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'12px 18px', borderTop:`1px solid ${BD}`, background:BG }}>
          {/* Dot indicators */}
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            {STEPS.map((_,i) => (
              <div key={i} style={{
                height:6, width:i===step?18:6, borderRadius:3,
                background:i===step?P:BD, transition:'all .2s ease',
              }}/>
            ))}
          </div>
          {/* Buttons */}
          <div style={{ display:'flex', gap:8, flexShrink:0 }}>
            {step > 0 && (
              <button onClick={onBack}
                style={{ ...btnStyle(`1px solid ${BD}`, W, T2, 13), padding:'8px 14px', borderRadius:8, fontWeight:500, whiteSpace:'nowrap' }}>
                ← Back
              </button>
            )}
            <button onClick={onNext}
              style={{ ...btnStyle('none', P, W, 13), padding:'8px 20px', borderRadius:8, fontWeight:500, whiteSpace:'nowrap' }}>
              {step === total-1 ? 'Start exploring ✓' : 'Next →'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes tipIn {
          from { opacity:0; transform: scale(.95) translateY(8px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          20% { transform: rotate(-10deg); }
          40% { transform: rotate(14deg); }
          60% { transform: rotate(-8deg); }
          80% { transform: rotate(10deg); }
        }
      `}</style>
    </>
  );
}

/* ─── BUTTON STYLE HELPER ────────────────────────────── */
const btnStyle = (border, bg, color, fs) => ({
  border, background: bg, color, fontSize: fs,
  cursor:'pointer', fontFamily:'inherit', fontWeight:400, padding:0,
});
const circleBtn = {
  width:24, height:24, borderRadius:'50%', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center',
  fontFamily:'inherit', padding:0,
};

/* ─── COURSE CARD ────────────────────────────────────── */
function CourseCard({ cat, title, meta, pct, btn, catColor = P, isMobile = false, thumbnail = null, videoId = null, onPlay = null }) {
  const showProgress = pct !== undefined && pct !== null;
  const hasVideo = Boolean(videoId || thumbnail);
  const videoRef = React.useRef(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = React.useState(false);

  const handleMouseEnter = () => {
    if (videoRef.current && !isMobile) {
      // attempt to play preview silently
      videoRef.current.play().then(() => setIsPreviewPlaying(true)).catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    if (videoRef.current && !isMobile) {
      try { videoRef.current.pause(); videoRef.current.currentTime = 0; } catch (e) {}
      setIsPreviewPlaying(false);
    }
  };

  return (
    <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, marginBottom:12, overflow:'hidden', boxShadow:'0 8px 24px rgba(17,24,39,0.04)', transition:'transform .2s ease, box-shadow .2s ease' }}>
      <div style={{ height:3, background:'#F3F4F6' }}>
        <div style={{ height:3, width:`${showProgress ? pct : 100}%`, background:catColor === GR ? GR : P, borderRadius:'0 3px 3px 0' }} />
      </div>
      <div style={{ padding:'14px 18px 16px', display:'flex', flexDirection:isMobile ? 'column' : 'row', gap:14 }}>
        {hasVideo ? (
          <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} style={{ width:isMobile ? '100%' : 96, minWidth:isMobile ? 0 : 96, aspectRatio:'16 / 9', borderRadius:10, overflow:'hidden', background:PF, position:'relative', flexShrink:0 }}>
            {videoId ? (
              <video ref={videoRef} muted loop playsInline preload="metadata" poster={thumbnail} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}>
                <source src={`https://r.jina.ai/http://img.youtube.com/vi/${videoId}/hqdefault.jpg`} type="video/mp4" />
                {/* fallback to thumbnail if video preview not available */}
              </video>
            ) : thumbnail ? (
              <img src={thumbnail} alt={title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            ) : (
              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:P, fontSize:20 }}>
                ▶
              </div>
            )}
            {onPlay && (
              <button type="button" onClick={(event) => { event.stopPropagation(); onPlay(); }} style={{ position:'absolute', inset:0, border:'none', background:'rgba(17,24,39,0.25)', color:W, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                ▶
              </button>
            )}
          </div>
        ) : (
          <div style={{ width:36, height:44, background:PF, borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:P, fontSize:16 }}>
            <Icon name="doc" size={18} color={P} />
          </div>
        )}
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ fontSize:10, fontWeight:700, color:catColor, letterSpacing:.6, textTransform:'uppercase', margin:'0 0 5px' }}>{cat}</p>
          <p style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 4px', lineHeight:1.35 }}>{title}</p>
          <p style={{ fontSize:12, color:T2, margin:'0 0 14px', lineHeight:1.45 }}>{meta}</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexWrap:'wrap' }}>
            {showProgress ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0, width:isMobile ? '100%' : 'auto' }}>
                <div style={{ flex:1, minWidth:0, height:4, background:'#F3F4F6', borderRadius:4 }}>
                  <div style={{ width:`${pct}%`, height:4, background: catColor === GR ? GR : P, borderRadius:4 }}/>
                </div>
                <span style={{ fontSize:12, color:T2, whiteSpace:'nowrap' }}>{pct}% complete</span>
              </div>
            ) : (
              <span style={{ fontSize:12, color:T2 }}>{meta}</span>
            )}
            <button type="button" onClick={onPlay ? (event) => { event.stopPropagation(); onPlay(); } : undefined} style={{ ...btnStyle('none', P, W, 13), padding:'8px 16px', borderRadius:8, fontWeight:500, flexShrink:0, width:isMobile ? '100%' : 'auto' }}>
              {btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────── */
export default function HomePage({ user, currentPage = 'home', onNavigate = () => {}, onLogout = () => {}, onToggleSidebar = () => {}, isMobile = false, isTablet = false, isSidebarOpen = true }) {
  const [tourStep,   setTourStep]   = useState(0);
  const [tourActive, setTourActive] = useState(() => getTourVisitCount() < 2);
  const [spotlight,  setSpotlight]  = useState(null);
  const [tipPos,     setTipPos]     = useState({ top:'50%', left:'50%', transform:'translate(-50%,-50%)' });
  const [memberCount, setMemberCount] = useState(0);
  const [dashboardCourses, setDashboardCourses] = useState([]);
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const isOverlay = isMobile || isTablet;
  const displayName = user?.name || user?.firstName || user?.email?.split('@')[0] || 'there';
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [activeMetricIndex, setActiveMetricIndex] = useState(0);
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);
  const getAvatarSeed = (profile) => profile?.id || profile?.email || profile?.name || displayName || 'user';
  const getProfileAvatar = (profile) => {
    const seed = String(getAvatarSeed(profile));
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const bgColors = ['#F5F3FF', '#ECFDF5', '#EFF6FF', '#FEF3C7', '#FCE7F3'];
    const skinTones = ['#F4CBA3', '#E6B28A', '#CA8A62', '#9A5B3A'];
    const hairColors = ['#1F2937', '#4A2B22', '#2D1B12', '#774A25', '#A16207'];
    const shirtColors = ['#EDE9FE', '#DBEAFE', '#FDE68A', '#DCFCE7', '#FCE7F3'];
    const accentColors = ['#5B21B6', '#7C3AED', '#0D9488', '#EC4899', '#F59E0B'];
    const styleVariant = Math.abs(hash) % 5;
    const hairStyle = Math.abs(hash >> 1) % 3;
    const faceShape = Math.abs(hash >> 2) % 3;
    const accessory = Math.abs(hash >> 3) % 3;

    const bg = bgColors[Math.abs(hash >> 4) % bgColors.length];
    const skin = skinTones[Math.abs(hash >> 5) % skinTones.length];
    const hair = hairColors[Math.abs(hash >> 6) % hairColors.length];
    const shirt = shirtColors[Math.abs(hash >> 7) % shirtColors.length];
    const accent = accentColors[Math.abs(hash >> 8) % accentColors.length];
    const hairTilt = (Math.abs(hash) % 3) - 1;
    const eyeOffset = (Math.abs(hash >> 6) % 3) - 1;

    return { bg, skin, hair, shirt, accent, hairTilt, eyeOffset, styleVariant, hairStyle, faceShape, accessory };
  };
  const profileAvatar = getProfileAvatar(user);

  const achievementImages = [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1200&q=80',
  ];

  useEffect(() => {
    const metricTimer = window.setInterval(() => {
      setActiveMetricIndex((prev) => (prev + 1) % 4);
    }, 3200);
    return () => window.clearInterval(metricTimer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const [membersRes, coursesRes, eventsRes] = await Promise.all([
          usersAPI.getAll({ skip: 0, take: 100 }).catch(() => ({ data: [] })),
          coursesAPI.list({ skip: 0, take: 8 }).catch(() => ({ data: [] })),
          eventsAPI.list({ skip: 0, take: 6 }).catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;
        const normalizedCourses = (Array.isArray(coursesRes?.data) ? coursesRes.data : []).map((course) => ({
          id: course.id,
          category: course.category || course.cat || 'General',
          title: course.title || 'Untitled course',
          description: course.description || course.desc || course.subtitle || 'Continue your learning with this course.',
          duration: course.duration || course.dur || 'Self-paced',
          lessons: course.lessons || course.lessonCount || 0,
          difficulty: course.difficulty || course.level || 'Beginner',
          videoId: course.videoId || 'wMQDsjS9WC4',
          thumbnail: course.thumbnail || 'https://img.youtube.com/vi/wMQDsjS9WC4/hqdefault.jpg',
        }));
        setMemberCount(Array.isArray(membersRes?.data) ? membersRes.data.length : 0);
        setDashboardCourses(normalizedCourses);
        setDashboardEvents(Array.isArray(eventsRes?.data) ? eventsRes.data : []);
      } catch (error) {
        if (isMounted) {
          setMemberCount(0);
          setDashboardCourses([]);
          setDashboardEvents([]);
        }
      } finally {
        if (isMounted) setDashboardLoading(false);
      }
    };

    loadDashboardData();
    return () => { isMounted = false; };
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!isNotificationsOpen) return;
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  useEffect(() => {
    if (!isSearchOpen) return;
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSearchOpen]);

  useEffect(() => {
    if (!isNotificationsOpen) return;

    let isMounted = true;
    const loadNotifications = async () => {
      try {
        setNotificationsLoading(true);
        const response = await notificationsAPI.list().catch(() => ({ data: [] }));
        if (!isMounted) return;

        const apiNotifications = Array.isArray(response?.data) ? response.data : [];
        if (apiNotifications.length > 0) {
          setNotifications(apiNotifications.map((item) => ({
            id: item.id,
            title: item.title || item.type || 'Notification',
            detail: item.message || item.body || item.description || 'You have a new update',
            time: item.createdAt ? new Date(item.createdAt).toLocaleString('en', { month: 'short', day: 'numeric' }) : 'Now',
            read: Boolean(item.read),
          })));
        } else {
          setNotifications(dashboardEvents.slice(0, 3).map((event) => ({
            id: event.id,
            title: event.title,
            detail: event.description || 'New session available',
            time: event.startDate ? new Date(event.startDate).toLocaleString('en', { month: 'short', day: 'numeric' }) : 'Now',
            read: false,
          })));
        }
      } catch {
        if (isMounted) {
          setNotifications(dashboardEvents.slice(0, 3).map((event) => ({
            id: event.id,
            title: event.title,
            detail: event.description || 'New session available',
            time: event.startDate ? new Date(event.startDate).toLocaleString('en', { month: 'short', day: 'numeric' }) : 'Now',
            read: false,
          })));
        }
      } finally {
        if (isMounted) setNotificationsLoading(false);
      }
    };

    void loadNotifications();
    return () => { isMounted = false; };
  }, [isNotificationsOpen, dashboardEvents]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  /* Section refs */
  const bannerRef   = useRef(null);
  const statsRef    = useRef(null);
  const resumeRef   = useRef(null);
  const learningRef = useRef(null);
  const eventsRef   = useRef(null);
  const REFS = { banner:bannerRef, stats:statsRef, resume:resumeRef, learning:learningRef, events:eventsRef };

  const updatePositions = useCallback(() => {
    const step = STEPS[tourStep];
    if (!step.target) {
      setSpotlight(null);
      setTipPos({ top:'50%', left:'50%', transform:'translate(-50%,-50%)' });
      return;
    }
    const el = REFS[step.target]?.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const pad = 10;
    setSpotlight({ top:r.top-pad, left:r.left-pad, width:r.width+pad*2, height:r.height+pad*2 });

    const winW = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const TW = isMobile ? Math.min(320, winW - 24) : 340;
    const TH=280, M=18, VP=14;
    let top, left, transform='';
    switch(step.pos) {
      case 'right':  left=r.right+M;   top=Math.max(VP,r.top);  break;
      case 'bottom': left=r.left;       top=r.bottom+M;          break;
      case 'top':    left=r.left;       top=r.top-TH-M;          break;
      case 'left':   left=r.left-TW-M; top=Math.max(VP,r.top);  break;
      default:       left='50%'; top='50%'; transform='translate(-50%,-50%)'; break;
    }
    if(typeof left==='number') left=Math.max(VP, Math.min(left, window.innerWidth-TW-VP));
    if(typeof top==='number')  top =Math.max(VP, Math.min(top,  window.innerHeight-TH-VP));
    setTipPos({ top, left, transform });
  }, [tourStep]);

  useEffect(() => {
    if (!tourActive) return;
    const id = setTimeout(updatePositions, 80);
    const el = REFS[STEPS[tourStep]?.target]?.current;
    el?.scrollIntoView({ behavior:'smooth', block:'nearest' });
    return () => clearTimeout(id);
  }, [tourStep, tourActive, updatePositions]);

  const next  = () => {
    if (tourStep < STEPS.length - 1) {
      setTourStep((s) => s + 1);
      return;
    }
    if (typeof window !== 'undefined') {
      const nextCount = getTourVisitCount() + 1;
      window.localStorage.setItem(TOUR_VISITS_KEY, String(nextCount));
    }
    setTourActive(false);
  };
  const back  = () => tourStep > 0 && setTourStep(s=>s-1);
  const skip  = () => {
    if (typeof window !== 'undefined') {
      const nextCount = getTourVisitCount() + 1;
      window.localStorage.setItem(TOUR_VISITS_KEY, String(nextCount));
    }
    setTourActive(false);
  };

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const greeting = getTimeGreeting();

  const heroChips = [
    `${dashboardEvents.length} upcoming ${dashboardEvents.length === 1 ? 'session' : 'sessions'}`,
    `${dashboardCourses.length} available ${dashboardCourses.length === 1 ? 'course' : 'courses'}`,
    `${memberCount || 0} community ${memberCount === 1 ? 'member' : 'members'}`,
  ];

  const courseVideos = dashboardCourses
    .filter((course) => course.videoId)
    .slice(0, 3)
    .map((course) => ({
      title: course.title,
      duration: course.duration || 'Self-paced',
      tag: course.category || 'Course video',
      videoId: course.videoId,
      thumbnail: course.thumbnail,
    }));

  const demoVideos = courseVideos.length > 0 ? courseVideos : [
    { title: 'How Clean Energy Is Transforming Schools & Communities in Africa', duration: '1 min', tag: 'Demo lesson', videoId: 'wMQDsjS9WC4' },
    { title: 'Hospitals Are Going Dark in Africa — Tribes Capital is Fixing It', duration: '31 sec', tag: 'Live recap', videoId: 'Jdmt9BaYHnw' },
    { title: 'How Clean Energy Powers Africa', duration: '45 sec', tag: 'Quick watch', videoId: 'DnjMO5L5QgI' },
  ];

  const buildYouTubeEmbedUrl = (videoId) => `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&controls=1&rel=0&fs=1`;

  const statCards = [
    { label: 'Community members', value: memberCount || 0, badge: 'Updated' },
    { label: 'Available courses', value: dashboardCourses.length, badge: 'Fresh' },
    { label: 'Upcoming sessions', value: dashboardEvents.length, badge: 'This week' },
    { label: 'Latest updates', value: Math.max(1, dashboardCourses.length + dashboardEvents.length), badge: 'Ready' },
  ];

  const latestCourses = dashboardCourses.slice(0, 3);
  const upcomingEvents = dashboardEvents.slice(0, 3);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedSearch) return [];

    const pageMatches = [
      { type: 'page', key: 'home', label: 'Home', description: 'Overview and dashboard' },
      { type: 'page', key: 'learning', label: 'Learning Hub', description: 'Courses, lessons, and progress' },
      { type: 'page', key: 'events', label: 'Office Hours & Events', description: 'Sessions and community events' },
      { type: 'page', key: 'vault', label: 'Due Diligence Vault', description: 'Documents and deal materials' },
      { type: 'page', key: 'announcements', label: 'Announcements', description: 'Updates and community messages' },
      { type: 'page', key: 'help', label: 'Help', description: 'Support and guidance' },
    ].filter((item) => `${item.label} ${item.description}`.toLowerCase().includes(normalizedSearch));

    const courseMatches = dashboardCourses.filter((course) => {
      const haystack = `${course.title || ''} ${course.description || ''} ${course.category || ''}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    }).slice(0, 3).map((course) => ({ type: 'course', key: course.id, label: course.title, description: course.description || 'Course' }));

    const eventMatches = dashboardEvents.filter((event) => {
      const haystack = `${event.title || ''} ${event.description || ''} ${event.eventType || ''} ${event.meetingPlatform || ''}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    }).slice(0, 3).map((event) => ({ type: 'event', key: event.id, label: event.title, description: event.meetingPlatform || 'Upcoming session' }));

    return [...pageMatches, ...courseMatches, ...eventMatches];
  }, [normalizedSearch, dashboardCourses, dashboardEvents]);

  /* ── RENDER ── */
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', minHeight:'100dvh', background:'radial-gradient(circle at top left, rgba(124,58,237,0.10), transparent 28%), linear-gradient(135deg, #f8f7ff 0%, #f5f7ff 42%, #f9fbff 100%)', fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize:14, overflow:'hidden' }}>

      {/* ══ TOPBAR ══ */}
      <div style={{
        minHeight:54, height:'auto', background:'rgba(255,255,255,0.58)', backdropFilter:'blur(18px) saturate(180%)', WebkitBackdropFilter:'blur(18px) saturate(180%)',
        borderBottom:`1px solid rgba(255,255,255,0.65)`, display:'flex', alignItems:'center', padding:isMobile ? '10px 14px' : `0 ${24}px`, gap:12,
        flexShrink:0, justifyContent:'space-between', boxShadow:'0 10px 30px rgba(15,23,42,0.06)', position:'relative', zIndex:60,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          {/* Sidebar toggle */}
          {(isOverlay || !isSidebarOpen) && (
            <button className="topbar-action" onClick={onToggleSidebar} style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          <div ref={searchRef} style={{ flex:1, maxWidth: !isMobile ? 480 : '100%', minWidth:0, position:'relative' }}>
            {!isMobile ? (
              <>
                <div style={{ background: searchFocused ? '#FCFBFF' : '#F9FAFB', border: searchFocused ? `1px solid rgba(91,33,182,0.25)` : `1px solid ${BD}`, borderRadius:10,
                  height:38, display:'flex', alignItems:'center', gap:8, padding:'0 12px', boxShadow: searchFocused ? '0 0 0 3px rgba(91,33,182,0.12)' : '0 1px 3px rgba(17,24,39,0.04)', transition:'all .2s ease' }}>
                  <Icon name="search" size={14} color={searchFocused ? P : T3}/>
                  <label htmlFor="homepage-search" style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
                    Search the platform
                  </label>
                  <input
                    ref={searchInputRef}
                    id="homepage-search"
                    name="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => { setIsSearchOpen(true); setSearchFocused(true); }}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search topics, documents, people, events…"
                    style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:T1, padding:0 }}
                  />
                </div>
                {isSearchOpen && normalizedSearch && searchResults.length > 0 && (
                  <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:W, border:`1px solid ${BD}`, borderRadius:12, boxShadow:'0 16px 40px rgba(17,24,39,0.12)', overflow:'hidden', zIndex:40 }}>
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.key}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          if (result.type === 'page') {
                            onNavigate(result.key);
                          }
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        style={{ width:'100%', textAlign:'left', border:'none', background:'transparent', padding:'10px 12px', cursor:'pointer', display:'flex', flexDirection:'column', gap:2, borderBottom: result.key === searchResults[searchResults.length - 1].key ? 'none' : `1px solid ${BD}` }}
                      >
                        <span style={{ fontSize:12, fontWeight:600, color:T1 }}>{result.label}</span>
                        <span style={{ fontSize:11, color:T3 }}>{result.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearchOpen && normalizedSearch && searchResults.length === 0 && (
                  <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:W, border:`1px solid ${BD}`, borderRadius:12, boxShadow:'0 16px 40px rgba(17,24,39,0.12)', padding:'12px 14px', zIndex:40, fontSize:13, color:T2 }}>
                    No matches found for “{searchQuery}”.
                  </div>
                )}
              </>
            ) : isSearchOpen ? (
              <>
                <div style={{ background: searchFocused ? '#FCFBFF' : '#F9FAFB', border: searchFocused ? `1px solid rgba(91,33,182,0.25)` : `1px solid ${BD}`, borderRadius:10,
                  height:38, display:'flex', alignItems:'center', gap:8, padding:'0 12px', boxShadow: searchFocused ? '0 0 0 3px rgba(91,33,182,0.12)' : '0 1px 3px rgba(17,24,39,0.04)', transition:'all .2s ease', width:'100%' }}>
                  <Icon name="search" size={14} color={searchFocused ? P : T3}/>
                  <input
                    ref={searchInputRef}
                    id="homepage-search-mobile"
                    name="search"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onFocus={() => { setIsSearchOpen(true); setSearchFocused(true); }}
                    onBlur={() => setSearchFocused(false)}
                    placeholder="Search the platform"
                    style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:T1, padding:0 }}
                  />
                </div>
                {isSearchOpen && normalizedSearch && searchResults.length > 0 && (
                  <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:W, border:`1px solid ${BD}`, borderRadius:12, boxShadow:'0 16px 40px rgba(17,24,39,0.12)', overflow:'hidden', zIndex:40 }}>
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.key}`}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          if (result.type === 'page') {
                            onNavigate(result.key);
                          }
                          setSearchQuery('');
                          setIsSearchOpen(false);
                        }}
                        style={{ width:'100%', textAlign:'left', border:'none', background:'transparent', padding:'10px 12px', cursor:'pointer', display:'flex', flexDirection:'column', gap:2, borderBottom: result.key === searchResults[searchResults.length - 1].key ? 'none' : `1px solid ${BD}` }}
                      >
                        <span style={{ fontSize:12, fontWeight:600, color:T1 }}>{result.label}</span>
                        <span style={{ fontSize:11, color:T3 }}>{result.description}</span>
                      </button>
                    ))}
                  </div>
                )}
                {isSearchOpen && normalizedSearch && searchResults.length === 0 && (
                  <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:W, border:`1px solid ${BD}`, borderRadius:12, boxShadow:'0 16px 40px rgba(17,24,39,0.12)', padding:'12px 14px', zIndex:40, fontSize:13, color:T2 }}>
                    No matches found for “{searchQuery}”.
                  </div>
                )}
              </>
            ) : (
              <div style={{ display:'flex', alignItems:'baseline', minWidth:0 }}>
                <span style={{ fontSize:14, fontWeight:800, color:P, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', letterSpacing:'0.6px', fontFamily:'"Segoe UI", "Inter", "Arial", sans-serif' }}>TribesCapital</span>
              </div>
            )}
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:isMobile?8:12, flexShrink:0 }}>
          {isMobile && (
            <button className="topbar-action" onClick={() => { setIsSearchOpen((prev) => !prev); setSearchFocused(true); }} style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex' }} aria-label="Open search">
              <Icon name="search" size={18} color={T2}/>
            </button>
          )}
          <div ref={notifRef} style={{ position:'relative' }}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              className="topbar-action"
              style={{ width:34, height:34, border:`1px solid ${BD}`, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', flexShrink:0, background:W, transition:'all .2s ease', boxShadow:'0 1px 3px rgba(17,24,39,0.04)' }}
              aria-label="Open notifications"
            >
              <Icon name="bell2" size={16} color={T2}/>
              <div style={{ width:7, height:7, background:'#EF4444', borderRadius:'50%', border:'1.5px solid #fff',
                position:'absolute', top:6, right:6 }}/>
            </button>
            {isNotificationsOpen && (
              <div style={{ position:'fixed', top:isMobile ? 58 : 62, right:isMobile ? 12 : 22, width:280, maxHeight:'calc(100vh - 80px)', overflowY:'auto', background:W, border:`1px solid ${BD}`, borderRadius:12, boxShadow:'0 18px 42px rgba(17,24,39,0.16)', overflow:'hidden', zIndex:1000 }}>
                <div style={{ padding:'12px 14px', borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:T1 }}>Notifications</div>
                    <div style={{ fontSize:11, color:T3 }}>{notificationsLoading ? 'Loading…' : `${notifications.filter((item) => !item.read).length} unread`}</div>
                  </div>
                  <span style={{ fontSize:11, color:P, fontWeight:600 }}>View all</span>
                </div>
                <div>
                  {notificationsLoading ? (
                    <div style={{ padding:'12px 14px', color:T2, fontSize:13 }}>Loading notifications…</div>
                  ) : notifications.length > 0 ? notifications.map((item) => (
                    <div key={item.id || item.title} style={{ padding:'10px 14px', borderBottom:`1px solid ${BD}`, background:item.read ? '#FCFCFD' : '#F7F3FF' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T1, marginBottom:2 }}>{item.title}</div>
                      <div style={{ fontSize:12, color:T2, marginBottom:4 }}>{item.detail}</div>
                      <div style={{ fontSize:11, color:T3 }}>{item.time}</div>
                    </div>
                  )) : (
                    <div style={{ padding:'12px 14px', color:T2, fontSize:13 }}>No notifications yet.</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div title={displayName} className="topbar-avatar" style={{ width:46, height:46, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'1.5px solid rgba(255,255,255,0.95)', boxShadow:'0 10px 24px rgba(17,24,39,0.16)', background:'linear-gradient(135deg, #f5f3ff 0%, #fdf2f8 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:0, transition:'transform .2s ease, box-shadow .2s ease' }}>
            <svg viewBox="0 0 64 64" width="46" height="46" role="img" aria-label={`${displayName} avatar`}>
              <defs>
                <linearGradient id="avatarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={profileAvatar.bg} />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              <rect width="64" height="64" rx="32" fill="url(#avatarGradient)" />
              <circle cx="32" cy="32" r="29" fill="none" stroke="rgba(255,255,255,0.74)" strokeWidth="1.2" />
              <circle cx="32" cy="24" r="8" fill="#2f3b4a" />
              <path d="M20 46c1-9 6-14 12-14s11 5 12 14" fill="#6b5b4b" />
              <path d="M24 47c2-5 5-7 8-7 3 0 6 2 8 7" fill="none" stroke="#3b3128" strokeWidth="1.25" strokeLinecap="round" />
              <circle cx="29" cy="24" r="1" fill="#f6d8bf" />
              <circle cx="35" cy="24" r="1" fill="#f6d8bf" />
              <path d="M28 31c2 1.2 6 1.2 8 0" stroke="#3b3128" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:isMobile?'16px 14px 60px':'24px 28px 60px' }}>

          {/* ── HOME PAGE ── */}
          {currentPage === 'home' && (
          <>
          <div ref={bannerRef} className="soft-card" style={{
            background:'linear-gradient(135deg, #2E1065 0%, #4C1D95 45%, #5B21B6 100%)',
            borderRadius:18, padding:isMobile?'18px 16px':'26px 32px', marginBottom:22,
            display:'flex', flexDirection:isMobile?'column':'row',
            justifyContent:'space-between', alignItems:isMobile?'flex-start':'center', gap:isMobile?14:24,
            boxShadow:'0 30px 70px rgba(76,29,149,0.32), inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -12px 26px rgba(15,23,42,0.16)', position:'relative', overflow:'hidden',
          }}>
            <div style={{ minWidth:0, width:'100%' }}>
              <p style={{ color:'rgba(255,255,255,.9)', fontSize:10, fontWeight:800, letterSpacing:1.35,
                textTransform:'uppercase', margin:'0 0 8px', textShadow:'0 2px 8px rgba(0,0,0,0.22)' }}>WELCOME</p>
              <h1 style={{ color:W, fontSize:isMobile?18:26, fontWeight:800, margin:'0 0 8px', letterSpacing:-.5, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', lineHeight:1.2, textShadow:'0 3px 10px rgba(0,0,0,0.2)' }}>
                <span>{greeting}, {displayName}</span>
                <svg width="22" height="22" viewBox="0 0 128 128" fill="none" aria-hidden="true" style={{ flexShrink:0, animation:'wave 1.2s ease-in-out infinite', transformOrigin:'70% 60%' }} xmlns="http://www.w3.org/2000/svg">
                  <path d="M59.53 107.44c-3.95-3.17-40.63-38.84-41.04-39.23-1.62-1.62-2.64-3.3-2.92-4.84-.29-1.6.2-3 1.5-4.3 1.21-1.21 2.69-1.85 4.28-1.85 1.94 0 3.93.92 5.59 2.59l16.63 15.98c.29.28.67.42 1.04.42a1.494 1.494 0 0 0 1.07-2.54L19.13 46.25c-2.66-2.66-3.91-6.73-.75-9.89 1.21-1.21 2.69-1.85 4.28-1.85 1.94 0 3.93.92 5.59 2.59l27.16 26.48c.29.28.67.43 1.05.43s.77-.15 1.06-.44c.58-.58.59-1.52.01-2.11L24.91 28.02c-1.51-1.51-2.42-3.32-2.58-5.08-.15-1.79.48-3.45 1.83-4.8 1.21-1.21 2.69-1.85 4.28-1.85 1.94 0 3.93.92 5.59 2.58L67.3 51.31c.29.28.67.43 1.05.43s.77-.15 1.06-.44c.58-.58.59-1.52.01-2.11L45.26 24.36c-1.52-1.52-2.43-3.32-2.58-5.08-.15-1.79.48-3.45 1.83-4.8 1.21-1.21 2.69-1.85 4.28-1.85 1.94 0 3.93.92 5.59 2.59 8.86 8.7 31.99 31.45 32.77 32.29 2.97 2.05 3.57-1.05 3.72-3.06.17-2.34-2.51-10.51-.95-17.86 2.62-9.77 10.17-8.17 10.34-8.09 4.14 1.94 3.35 4.84 1.88 10.67l-.15 1.15c-1.54 7.62 9.04 30.2 9.82 31.89 4.15 9.08 8.93 27.49-6.9 43.32-17.35 17.35-38.83 8.46-45.38 1.91z" fill="#ffb300"/>
                  <path d="M81.79 117.18c-10.64 0-19.69-5.09-23.26-8.62-3.21-2.62-23.47-22.18-39.97-38.19-.67-.65-1.06-1.02-1.1-1.07-1.87-1.87-3.03-3.82-3.36-5.66-.38-2.09.27-3.98 1.91-5.63 1.5-1.5 3.34-2.29 5.34-2.29 2.35 0 4.71 1.08 6.65 3.03l16.61 15.96-26.56-27.42c-3.06-3.06-4.6-8.13-.73-11.99 1.5-1.5 3.34-2.29 5.34-2.29 2.35 0 4.71 1.08 6.65 3.03L56.45 62.5L23.84 29.07c-1.74-1.74-2.81-3.87-3-5.99-.19-2.26.59-4.33 2.26-6 1.5-1.5 3.34-2.29 5.34-2.29 2.34 0 4.7 1.07 6.65 3.02l33.26 32.43-24.16-24.83c-1.75-1.75-2.82-3.88-3-6-.19-2.25.59-4.32 2.26-5.99 1.5-1.5 3.34-2.29 5.34-2.29 2.35 0 4.71 1.08 6.65 3.03l7.21 7.07c12.85 12.6 23.59 23.15 24.74 24.33.56.45 1.29.62 1.6.47.2-.1.42-.56.38-1.53-.06-1.7-.3-3.81-.55-6.04-.5-4.48-1.02-9.12-.37-12.18 1.42-5.31 4.21-7.56 6.29-8.53 2.86-1.32 5.63-.86 6.16-.61 5.2 2.44 4.17 6.52 2.75 12.18l-.03.14-.16 1.17c-1.04 5.12 4.3 19.27 9.64 30.8l.08.16c3.57 7.8 10 27.81-7.2 45.01-7.91 7.89-16.47 10.58-24.19 10.58zM21.35 58.72c-1.18 0-2.3.49-3.22 1.41-.95.95-1.28 1.87-1.08 2.97.22 1.21 1.11 2.65 2.5 4.05.01.01.41.4 1.1 1.06 23.42 22.73 37.56 36.24 39.82 38.06l.12.11c5.52 5.52 26.03 15.32 43.26-1.91 15.87-15.87 9.9-34.4 6.59-41.64l-.07-.15c-3.44-7.42-11.26-25.42-9.87-32.6l.23-1.5c1.54-6.12 1.63-7.4-.98-8.66-.77-.14-6.29-.81-8.4 7.06-.53 2.51-.02 7.1.43 11.15.26 2.29.5 4.46.56 6.27.1 2.85-1.25 3.94-2.07 4.34-1.67.81-3.66.12-4.9-.92l-.13-.12c-.61-.66-15.12-14.89-24.72-24.31L53.3 16.3c-2.46-2.47-5.63-2.88-7.76-.75-1.04 1.04-1.51 2.26-1.4 3.61.12 1.41.88 2.88 2.15 4.15L70.5 48.14a3.012 3.012 0 0 1-.02 4.22c-1.11 1.11-3.07 1.13-4.21.03L32.98 19.94c-2.46-2.46-5.64-2.87-7.76-.74-1.04 1.04-1.51 2.26-1.4 3.61.13 1.41.89 2.89 2.15 4.14L58.6 60.41c1.15 1.16 1.14 3.06-.02 4.22-1.11 1.11-3.07 1.13-4.21.03L27.2 38.17c-2.46-2.48-5.64-2.88-7.76-.75-2.59 2.59-1.21 5.8.75 7.77l26.57 27.44a2.988 2.988 0 0 1-.03 4.2c-1.12 1.12-3.06 1.13-4.2.04L25.9 60.89c-1.4-1.41-3.01-2.17-4.55-2.17z" fill="#eda600"/>
                  <path d="M84.76 46.54c-5.49 11.21-4.78 26.9 3.46 39.49.93 1.7 2.52.87 1.71-.88-9.95-21.29.48-36.63.48-36.63l-5.65-1.98z" fill="#eda600"/>
                  <path d="M63.17 4.5c3.02-.79 6.24-.72 9.37.01 3.11.75 6.22 2.33 8.53 4.91 2.26 2.56 3.65 5.67 4.12 8.93.44 3.23.03 6.56-1.5 9.32-.18-3.1-.72-5.95-1.63-8.58-.47-1.31-1.02-2.56-1.69-3.74-.66-1.17-1.44-2.33-2.27-3.28-1.69-1.95-3.98-3.47-6.55-4.65-2.58-1.22-5.39-2.12-8.38-2.92z" fill="#b0bec5"/>
                  <path d="M64 13.98c1.67-1.06 3.76-1.28 5.73-.93 1.99.35 3.89 1.34 5.39 2.71 1.49 1.39 2.55 3.14 3.21 4.96.32.91.48 1.87.63 2.8.05.96.05 1.92-.1 2.88-.69-.73-1.23-1.46-1.74-2.17-.59-.67-1.05-1.38-1.58-2.03-1.04-1.29-2.05-2.46-3.14-3.5-1.12-1.01-2.3-1.9-3.67-2.67-1.36-.79-2.89-1.45-4.73-2.05z" fill="#90a4ae"/>
                </svg>
              </h1>
              <p style={{ color:'rgba(255,255,255,.9)', fontSize:isMobile?12:13, margin:'0 0 16px', maxWidth:430, lineHeight:isMobile?1.5:1.65, textShadow:'0 1px 6px rgba(0,0,0,0.18)' }}>
                Welcome to Tribes Capital, your home for clean energy learning, live sessions, and the momentum behind every next move.
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {heroChips.map((chip) => (
                  <div key={chip} style={{ background:'rgba(255,255,255,.16)', border:'1px solid rgba(255,255,255,.25)',
                    borderRadius:20, padding:'5px 13px', fontSize:12, fontWeight:500, color:W, whiteSpace:'nowrap' }}>
                    {chip}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position:'relative', flexShrink:0, width:isMobile?'100%':'240px', maxWidth:isMobile?320:240, minHeight:isMobile?'150px':'170px', display:'flex', alignItems:'center', justifyContent:'center', marginTop:isMobile?6:0, alignSelf:isMobile?'stretch':'auto' }}>
              {achievementImages.map((src, index) => {
                const offset = (index - activeMetricIndex + 4) % 4;
                const translateX = offset === 0 ? 0 : offset === 1 ? 16 : offset === 2 ? 32 : 48;
                const translateY = offset === 0 ? 0 : offset === 1 ? -6 : offset === 2 ? -12 : -18;
                const rotate = offset === 0 ? 0 : offset === 1 ? -2 : offset === 2 ? -4 : -6;
                const opacity = offset === 0 ? 1 : offset === 1 ? 0.9 : offset === 2 ? 0.72 : 0.5;
                const scale = offset === 0 ? 1 : offset === 1 ? 0.96 : 0.91;
                const zIndex = 4 - offset;
                return (
                  <div key={src} style={{
                    position:'absolute',
                    inset:0,
                    top:0,
                    left:0,
                    right:0,
                    background:'rgba(255,255,255,0.16)',
                    border:'1px solid rgba(255,255,255,0.24)',
                    borderRadius:isMobile?10:12,
                    overflow:'hidden',
                    backdropFilter:'blur(16px)',
                    WebkitBackdropFilter:'blur(16px)',
                    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -8px 18px rgba(15,23,42,0.16), 0 10px 28px rgba(15,23,42,0.12)',
                    transform:`translateX(${translateX}px) translateY(${translateY}px) rotate(${rotate}deg) scale(${scale})`,
                    opacity,
                    zIndex,
                    transition:'all 0.8s cubic-bezier(.2,.8,.2,1)',
                  }}>
                    <img
                      src={src}
                      alt={`Tribes Capital achievement ${index + 1}`}
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── RESUME CARD ── */}
          <div ref={resumeRef} className="soft-card" style={{
            background:'rgba(255,255,255,0.68)', backdropFilter:'blur(16px) saturate(180%)', WebkitBackdropFilter:'blur(16px) saturate(180%)',
            border:`1px solid rgba(255,255,255,0.7)`, borderRadius:14, padding:'18px 20px',
            marginBottom:24, display:'flex', flexDirection:isMobile?'column':'row',
            alignItems:isMobile?'flex-start':'center', gap:isMobile?10:16,
            boxShadow:'0 16px 36px rgba(17,24,39,0.06)',
          }}>
            <div style={{ width:44, minWidth:44, height:52, background:PF, borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="doc" size={20} color={P}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:15, fontWeight:600, color:T1, margin:'0 0 4px', lineHeight:1.3 }}>
                {dashboardCourses[0]?.title || 'Your next course is ready'}
              </p>
              <p style={{ fontSize:13, color:T2, margin:0 }}>
                {dashboardCourses[0]?.description || 'Open the learning hub to explore the latest content from the backend.'}
              </p>
            </div>
            <button onClick={() => onNavigate('learning')} style={{ ...btnStyle('none', 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)', W, 13), padding:'10px 20px', borderRadius:8, fontWeight:600,
              flexShrink:0, whiteSpace:'nowrap', width:isMobile?'100%':'auto', boxShadow:'0 10px 22px rgba(91, 33, 182, 0.18)', transition:'transform 0.2s ease, box-shadow 0.2s ease' }}>
              Open learning
            </button>
          </div>

          {/* ── TWO-COLUMN GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':isTablet?'1fr 240px':'1fr 290px', gap:isMobile?16:24 }}>

            {/* LEFT COLUMN */}
            <div>
              {/* Learning section */}
              <div ref={learningRef}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isMobile?10:14, gap:8, flexWrap:'wrap' }}>
                  <h2 style={{ fontSize:isMobile?14:16, fontWeight:600, color:T1, margin:0 }}>Learning</h2>
                  <button onClick={() => onNavigate('learning')} style={{ fontSize:isMobile?12:13, color:P, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                    Go to Learning Hub <Icon name="arrow" size={13} color={P}/>
                  </button>
                </div>
                {dashboardLoading ? (
                  <div style={{ background:'rgba(255,255,255,0.72)', border:'1px solid rgba(91,33,182,0.16)', borderRadius:14, padding:isMobile?'12px':'16px', color:T2, backdropFilter:'blur(16px)', boxShadow:'0 12px 30px rgba(15,23,42,0.04)' }}>Loading courses…</div>
                ) : latestCourses.length > 0 ? latestCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    cat={course.category || 'COURSE'}
                    title={course.title}
                    meta={course.description || 'Live from the platform'}
                    pct={null}
                    btn={course.videoId ? 'Watch video' : 'Open course'}
                    isMobile={isMobile}
                    thumbnail={course.thumbnail}
                    videoId={course.videoId}
                    onPlay={() => setActiveVideo({ title: course.title, duration: course.duration || 'Self-paced', tag: course.category || 'Course video', videoId: course.videoId, thumbnail: course.thumbnail })}
                  />
                )) : (
                  <div style={{ background:'rgba(255,255,255,0.72)', border:'1px solid rgba(91,33,182,0.16)', borderRadius:14, padding:'16px', color:T2, backdropFilter:'blur(16px)', boxShadow:'0 12px 30px rgba(15,23,42,0.04)' }}>No courses are available right now.</div>
                )}
              </div>

              {/* Events section */}
              <div ref={eventsRef} style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isMobile?10:14, gap:8, flexWrap:'wrap' }}>
                  <h2 style={{ fontSize:isMobile?14:16, fontWeight:600, color:T1, margin:0 }}>
                    Upcoming events <span style={{ fontSize:isMobile?12:13, color:T3, fontWeight:400 }}>(8)</span>
                  </h2>
                  <button onClick={() => onNavigate('events')} style={{ fontSize:isMobile?12:13, color:P, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                    View all <Icon name="arrow" size={13} color={P}/>
                  </button>
                </div>
                <div style={{ background:'rgba(255,255,255,0.74)', border:'1px solid rgba(91,33,182,0.16)', borderRadius:14, overflow:'hidden', backdropFilter:'blur(16px)', boxShadow:'0 12px 30px rgba(15,23,42,0.04)' }}>
                  {dashboardLoading ? (
                    <div style={{ padding:'16px', color:T2 }}>Loading sessions…</div>
                  ) : upcomingEvents.length > 0 ? upcomingEvents.map((event, index, arr) => {
                    const start = new Date(event.startDate);
                    const month = start.toLocaleDateString('en', { month: 'short' }).toUpperCase();
                    const day = start.getDate();
                    const weekday = start.toLocaleDateString('en', { weekday: 'short' }).toUpperCase();
                    const type = event.eventType || 'EVENT';
                    const meta = `${start.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' })} · ${event.meetingPlatform || 'Live session'} · ${event.capacity ? `${event.capacity} spots` : 'Open'}`;
                    return (
                      <div key={event.id} style={{ display:'flex', alignItems:isMobile?'flex-start':'center', gap:isMobile?8:14, padding:isMobile?'10px 10px':'14px 18px',
                        borderBottom:index<arr.length-1?`1px solid ${BD}`:'none', flexWrap:isMobile?'wrap':'nowrap', width:'100%' }}>
                        <div style={{ width:isMobile?40:46, minWidth:isMobile?40:46, background:PF, borderRadius:8, textAlign:'center', padding:'7px 4px' }}>
                          <div style={{ fontSize:isMobile?7.5:9, fontWeight:700, color:P, letterSpacing:.5, textTransform:'uppercase' }}>{month}</div>
                          <div style={{ fontSize:isMobile?15:20, fontWeight:700, color:P, lineHeight:1.1 }}>{day}</div>
                          <div style={{ fontSize:isMobile?7.5:9, color:P, fontWeight:500 }}>{weekday}</div>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <span style={{ background:PF, color:P, fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4, textTransform:'uppercase', letterSpacing:.4 }}>
                            {type}
                          </span>
                          <p style={{ fontSize:isMobile?11:12, fontWeight:600, color:T1, margin:'3px 0 2px', lineHeight:1.25 }}>{event.title}</p>
                          <p style={{ fontSize:isMobile?9.5:11, color:T2, margin:0, lineHeight:1.3 }}>{meta}</p>
                        </div>
                        <button onClick={() => onNavigate('events')} style={{
                          ...btnStyle('none', 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)', W, 12),
                          padding:'7px 14px', borderRadius:7, fontWeight:600, flexShrink:0,
                          marginTop:isMobile?4:0,
                          width:isMobile?'100%':'auto',
                          boxShadow:'0 8px 18px rgba(91, 33, 182, 0.16)', transition:'transform 0.2s ease, box-shadow 0.2s ease',
                        }}>Open</button>
                      </div>
                    );
                  }) : (
                    <div style={{ padding:'16px', color:T2 }}>No upcoming sessions yet.</div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display:'flex', flexDirection:'column', gap:isMobile?10:20 }}>

              {/* Recently added */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isMobile?8:12, gap:8, flexWrap:'wrap' }}>
                  <h3 style={{ fontSize:isMobile?12.5:14, fontWeight:600, color:T1, margin:0 }}>Recently added</h3>
                  <button onClick={() => onNavigate('vault')} style={{ fontSize:isMobile?11:12, color:P, background:'transparent', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>Open vault</button>
                </div>
                <div style={{ background:'rgba(255,255,255,0.74)', border:'1px solid rgba(91,33,182,0.16)', borderRadius:14, overflow:'hidden', backdropFilter:'blur(16px)', boxShadow:'0 12px 30px rgba(15,23,42,0.04)' }}>
                  {latestCourses.length > 0 ? latestCourses.map((course, index, arr) => (
                    <div key={course.id} style={{ display:'flex', alignItems:'center', gap:isMobile?7:10, padding:isMobile?'8px 10px':'11px 14px',
                      borderBottom:index<arr.length-1?`1px solid ${BD}`:'none', width:'100%' }}>
                      <div style={{ width:isMobile?28:32, height:isMobile?28:32, background:PF, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?12:14 }}>📘</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:isMobile?10.5:12, fontWeight:500, color:T1, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{course.title}</p>
                        <p style={{ fontSize:isMobile?9:10, color:T3, margin:0, lineHeight:1.3 }}>{course.description || 'Published course'}</p>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding:'12px 14px', color:T2 }}>No recent content yet.</div>
                  )}
                </div>
              </div>

              {/* Demo videos */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isMobile?8:12, gap:8, flexWrap:'wrap' }}>
                  <h3 style={{ fontSize:isMobile?12.5:14, fontWeight:600, color:T1, margin:0 }}>Videos</h3>
                  <button onClick={() => onNavigate('learning')} style={{ fontSize:isMobile?11:12, color:P, background:'transparent', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>Watch more</button>
                </div>
                <div style={{ background:'rgba(255,255,255,0.74)', border:'1px solid rgba(91,33,182,0.16)', borderRadius:14, overflow:'hidden', backdropFilter:'blur(16px)', boxShadow:'0 12px 30px rgba(15,23,42,0.04)' }}>
                  <div style={{ display:isMobile ? 'grid' : 'block', gridTemplateColumns:isMobile ? 'repeat(2, minmax(0, 1fr))' : undefined, gap:isMobile ? 8 : 0, padding:isMobile ? 8 : 0 }}>
                    {demoVideos.map((video, index) => (
                      <div key={`${video.title}-${index}`} style={{ display:'flex', flexDirection:'column', gap:8, padding:isMobile?'10px':'12px 14px', borderBottom:isMobile? 'none' : index < demoVideos.length - 1 ? `1px solid ${BD}` : 'none', width:'100%', background:isMobile ? 'rgba(255,255,255,0.7)' : 'transparent', borderRadius:isMobile ? 10 : 0 }}>
                        <div style={{ width:'100%', aspectRatio:'16 / 9', borderRadius:10, background:PF, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?13:16, flexShrink:0, overflow:'hidden', position:'relative' }}>
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                          ) : (
                            <span>▶</span>
                          )}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:isMobile?10.5:12, fontWeight:600, color:T1, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{video.title}</p>
                          <p style={{ fontSize:isMobile?9:11, color:T3, margin:'0 0 8px', lineHeight:1.3 }}>{video.tag} · {video.duration}</p>
                          <button
                            type="button"
                            onClick={() => setActiveVideo(video)}
                            style={{ ...btnStyle('none', 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)', W, 11), padding:'6px 10px', borderRadius:7, flexShrink:0, width:'100%', boxShadow:'0 8px 16px rgba(91, 33, 182, 0.16)', transition:'transform 0.2s ease, box-shadow 0.2s ease' }}>
                            Play
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Announcements */}
              <div style={{ marginTop:isMobile?12:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, gap:8, flexWrap:'wrap' }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:0 }}>Announcements</h3>
                  <button onClick={() => onNavigate('announcements')} style={{ fontSize:12, color:P, background:'transparent', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>View all</button>
                </div>
                <div style={{ background:'rgba(255,255,255,0.74)', border:'1px solid rgba(91,33,182,0.16)', borderRadius:14, overflow:'hidden', backdropFilter:'blur(16px)', boxShadow:'0 12px 30px rgba(15,23,42,0.04)' }}>
                  {notifications.length > 0 ? notifications.map((item, index, arr) => (
                    <div key={`${item.title}-${index}`} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:isMobile?'10px 12px':'11px 14px',
                      borderBottom:index<arr.length-1?`1px solid ${BD}`:'none', flexWrap:isMobile?'wrap':'nowrap' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:P, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:T1, margin:'0 0 2px' }}>{item.title}</p>
                        <p style={{ fontSize:11, color:T3, margin:0 }}>{item.detail}</p>
                      </div>
                      <span style={{ background:PF, color:P, fontSize:11, fontWeight:500, padding:'2px 9px', borderRadius:6, flexShrink:0, marginTop:isMobile?4:0 }}>{item.time}</span>
                    </div>
                  )) : (
                    <div style={{ padding:'12px 14px', color:T2 }}>No new updates yet.</div>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 12px' }}>Recent activity</h3>
                <div style={{ background:'rgba(255,255,255,0.74)', border:'1px solid rgba(91,33,182,0.16)', borderRadius:14, overflow:'hidden', backdropFilter:'blur(16px)', boxShadow:'0 12px 30px rgba(15,23,42,0.04)' }}>
                  {dashboardEvents.length > 0 ? dashboardEvents.slice(0,3).map((event, index, arr) => (
                    <div key={event.id} style={{ display:'flex', alignItems:'center', gap:isMobile?8:10, padding:isMobile?'8px 10px':'11px 14px',
                      borderBottom:index<arr.length-1?`1px solid ${BD}`:'none', flexWrap:isMobile?'wrap':'nowrap' }}>
                      <div style={{ width:isMobile?26:30, height:isMobile?26:30, borderRadius:'50%', background:PF, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:isMobile?7:9, height:isMobile?7:9, borderRadius:'50%', background:P }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:isMobile?11.5:12, fontWeight:500, color:T1, margin:'0 0 2px' }}>{event.title}</p>
                        <p style={{ fontSize:isMobile?10.5:11, color:T3, margin:0 }}>{event.meetingPlatform || 'Live session'}</p>
                      </div>
                      <span style={{ fontSize:isMobile?11:12, color:P, fontWeight:500, flexShrink:0, marginTop:isMobile?4:0 }}>{new Date(event.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  )) : (
                    <div style={{ padding:'12px 14px', color:T2 }}>No recent activity yet.</div>
                  )}
                </div>
              </div>

            </div>
          </div>
          </>
          )}

          {/* ── LEARNING HUB PAGE ── */}
          {currentPage === 'learning' && (
            <LearningHub user={user} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {/* ── DUE DILIGENCE PAGE ── */}
          {currentPage === 'vault' && (
            <DueDiligencePage user={user} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {/* ── OFFICE HOURS & EVENTS PAGE ── */}
          {currentPage === 'events' && (
            <OfficeHoursEvents user={user} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {/* ── ANNOUNCEMENTS PAGE ── */}
          {currentPage === 'announcements' && (
            <AnnouncementsPage user={user} onToggleSidebar={onToggleSidebar} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {/* ── HELP PAGE ── */}
          {currentPage === 'help' && (
            <HelpPage user={user} onToggleSidebar={onToggleSidebar} isMobile={isMobile} isTablet={isTablet}/>
          )}
        </div>

      {activeVideo && (
        <div style={{ position:'fixed', inset:0, background:'rgba(17,24,39,0.72)', zIndex:80, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ width:'100%', maxWidth:860, background:W, borderRadius:16, overflow:'hidden', boxShadow:'0 24px 60px rgba(0,0,0,0.28)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:`1px solid ${BD}` }}>
              <div>
                <div style={{ fontSize:13, fontWeight:700, color:T1 }}>{activeVideo.title}</div>
                <div style={{ fontSize:11, color:T3 }}>{activeVideo.tag} · {activeVideo.duration}</div>
              </div>
              <button type="button" onClick={() => setActiveVideo(null)} style={{ background:'transparent', border:'none', cursor:'pointer', color:T2, fontSize:18 }}>×</button>
            </div>
            <div style={{ aspectRatio:'16 / 9', background:'#000' }}>
              <iframe
                title={activeVideo.title}
                src={buildYouTubeEmbedUrl(activeVideo.videoId)}
                style={{ width:'100%', height:'100%', border:0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

      {/* ══ TUTORIAL OVERLAY ══ */}
      {tourActive && (
        <TutorialOverlay
          step={tourStep}
          total={STEPS.length}
          spotlight={spotlight}
          tipPos={tipPos}
          onNext={next}
          onBack={back}
          onSkip={skip}
          isMobile={isMobile}
        />
      )}
      <style>{`
        *{box-sizing:border-box;}
        button,input,select,textarea{font-family:inherit;}
        .soft-card{transition:transform .2s ease, box-shadow .2s ease, border-color .2s ease;}
        .soft-card:hover{transform:translateY(-1px); box-shadow:0 12px 30px rgba(15,23,42,0.08);}
        .soft-button{transition:transform .2s ease, box-shadow .2s ease, filter .2s ease;}
        .soft-button:hover{transform:translateY(-1px); box-shadow:0 8px 18px rgba(91,33,182,0.16); filter:brightness(1.01);}
        .topbar-action{transition:transform .2s ease, box-shadow .2s ease, background-color .2s ease;}
        .topbar-action:hover{transform:translateY(-1px); box-shadow:0 8px 18px rgba(91,33,182,0.12); background-color:rgba(245,243,255,0.9);}
        .topbar-avatar{transition:transform .2s ease, box-shadow .2s ease;}
        .topbar-avatar:hover{transform:translateY(-1px) scale(1.01); box-shadow:0 12px 24px rgba(17,24,39,0.16);}
        ::-webkit-scrollbar{width:5px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:10px;}
        ::-webkit-scrollbar-track{background:transparent;}
      `}</style>
    </div>
  );
}
