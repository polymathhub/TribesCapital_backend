import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import LearningHub from './LearningHub';
import DueDiligencePage from './DueDiligencePage';
import OfficeHoursEvents from './OfficeHoursEvents';
import AnnouncementsPage from './AnnouncementsPage';
import HelpPage from './HelpPage';
import { usersAPI, coursesAPI, eventsAPI } from '../api/endpoints';

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
function CourseCard({ cat, title, meta, pct, btn, catColor = P }) {
  const showProgress = pct !== undefined && pct !== null;
  return (
    <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, marginBottom:12, overflow:'hidden', boxShadow:'0 8px 24px rgba(17,24,39,0.04)', transition:'transform .2s ease, box-shadow .2s ease' }}>
      {/* Top progress stripe */}
      <div style={{ height:3, background:'#F3F4F6' }}>
        <div style={{ height:3, width:`${pct}%`, background:catColor === GR ? GR : P, borderRadius:'0 3px 3px 0' }}/>
      </div>
      <div style={{ padding:'14px 18px 16px', display:'flex', gap:14 }}>
        {/* Doc icon */}
        <div style={{ width:36, height:44, background:PF, borderRadius:8, display:'flex', alignItems:'center',
          justifyContent:'center', flexShrink:0, color:P, fontSize:16 }}>
          <Icon name="doc" size={18} color={P}/>
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:10, fontWeight:700, color:catColor, letterSpacing:.6, textTransform:'uppercase', margin:'0 0 5px' }}>{cat}</p>
          <p style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 4px', lineHeight:1.35 }}>{title}</p>
          <p style={{ fontSize:12, color:T2, margin:'0 0 14px' }}>{meta}</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
            {showProgress ? (
              <div style={{ display:'flex', alignItems:'center', gap:8, flex:1 }}>
                <div style={{ width:160, height:4, background:'#F3F4F6', borderRadius:4 }}>
                  <div style={{ width:`${pct}%`, height:4, background: catColor === GR ? GR : P, borderRadius:4 }}/>
                </div>
                <span style={{ fontSize:12, color:T2 }}>{pct}% complete</span>
              </div>
            ) : (
              <span style={{ fontSize:12, color:T2 }}>{meta}</span>
            )}
            <button style={{ ...btnStyle('none', P, W, 13), padding:'8px 16px', borderRadius:8, fontWeight:500, flexShrink:0 }}>
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
  const [tourActive, setTourActive] = useState(true);
  const [spotlight,  setSpotlight]  = useState(null);
  const [tipPos,     setTipPos]     = useState({ top:'50%', left:'50%', transform:'translate(-50%,-50%)' });
  const [memberCount, setMemberCount] = useState(0);
  const [dashboardCourses, setDashboardCourses] = useState([]);
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const isOverlay = isMobile || isTablet;
  const displayName = user?.name || user?.firstName || user?.email?.split('@')[0] || 'there';
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notifications = dashboardEvents.slice(0,3).map((event) => ({
    title: event.title,
    detail: event.description || 'New session available',
    time: event.startDate ? new Date(event.startDate).toLocaleString('en', { month: 'short', day: 'numeric' }) : 'Now',
  }));
  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const getAvatarSeed = (profile) => profile?.id || profile?.email || profile?.name || displayName || 'user';
  const getProfileAvatar = (profile) => {
    const seed = String(getAvatarSeed(profile));
    let hash = 0;
    for (let i = 0; i < seed.length; i += 1) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const bgColors = ['#5B21B6', '#7C3AED', '#0D9488', '#1D4ED8', '#D97706', '#059669'];
    const skinTones = ['#F4CBA3', '#E6B28A', '#CA8A62', '#9A5B3A'];
    const hairColors = ['#1F2937', '#4A2B22', '#2D1B12', '#774A25'];
    const shirtColors = ['#EDE9FE', '#DBEAFE', '#FDE68A', '#DCFCE7'];
    const accentColors = ['#F59E0B', '#EC4899', '#06B6D4'];

    const bg = bgColors[Math.abs(hash) % bgColors.length];
    const skin = skinTones[Math.abs(hash >> 2) % skinTones.length];
    const hair = hairColors[Math.abs(hash >> 3) % hairColors.length];
    const shirt = shirtColors[Math.abs(hash >> 4) % shirtColors.length];
    const accent = accentColors[Math.abs(hash >> 5) % accentColors.length];
    const hairTilt = (Math.abs(hash) % 3) - 1;
    const eyeOffset = (Math.abs(hash >> 6) % 3) - 1;

    return { bg, skin, hair, shirt, accent, hairTilt, eyeOffset };
  };
  const profileAvatar = getProfileAvatar(user);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      try {
        const [membersRes, coursesRes, eventsRes] = await Promise.all([
          usersAPI.getAll({ skip: 0, take: 100 }).catch(() => ({ data: [] })),
          coursesAPI.list({ skip: 0, take: 6 }).catch(() => ({ data: [] })),
          eventsAPI.list({ skip: 0, take: 6 }).catch(() => ({ data: [] })),
        ]);
        if (!isMounted) return;
        setMemberCount(Array.isArray(membersRes?.data) ? membersRes.data.length : 0);
        setDashboardCourses(Array.isArray(coursesRes?.data) ? coursesRes.data : []);
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

  const next  = () => tourStep < STEPS.length-1 ? setTourStep(s=>s+1) : setTourActive(false);
  const back  = () => tourStep > 0 && setTourStep(s=>s-1);
  const skip  = () => setTourActive(false);

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

  const demoVideos = [
    { title: 'How to evaluate a climate deal', duration: '12 min', tag: 'Demo lesson', videoId: 'aqz-KE-bpKQ' },
    { title: 'Member circle: founder Q&A', duration: '18 min', tag: 'Live recap', videoId: 'M7lc1UVf-VE' },
    { title: 'Office hours tips for new members', duration: '8 min', tag: 'Quick watch', videoId: 'dQw4w9WgXcQ' },
  ];

  const buildYouTubeEmbedUrl = (videoId) => `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&controls=1&rel=0&fs=1`;

  const statCards = [
    { label: 'Community members', value: memberCount || 0, badge: 'Updated' },
    { label: 'Available courses', value: dashboardCourses.length, badge: 'Fresh' },
    { label: 'Upcoming sessions', value: dashboardEvents.length, badge: 'This week' },
    { label: 'Latest updates', value: Math.max(1, dashboardCourses.length + dashboardEvents.length), badge: 'Ready' },
  ];

  const latestCourses = dashboardCourses.slice(0, 2);
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
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, background:BG, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize:14, overflow:'hidden' }}>

      {/* ══ TOPBAR ══ */}
      <div style={{
        height:54, background:W, borderBottom:`1px solid ${BD}`,
        display:'flex', alignItems:'center', padding:`0 ${isMobile?14:24}px`, gap:12,
        flexShrink:0, justifyContent:'space-between', boxShadow:'0 1px 0 rgba(17,24,39,0.03)',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          {/* Sidebar toggle */}
          {(isOverlay || !isSidebarOpen) && (
            <button onClick={onToggleSidebar} style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', flexShrink:0 }}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          )}
          {/* Search — full on desktop, icon-only on mobile */}
          {!isMobile ? (
            <div ref={searchRef} style={{ flex:1, maxWidth:480, position:'relative' }}>
              <div style={{ background:'#F9FAFB', border:`1px solid ${BD}`, borderRadius:10,
                height:38, display:'flex', alignItems:'center', gap:8, padding:'0 12px', boxShadow:'0 1px 3px rgba(17,24,39,0.04)', transition:'border-color .2s ease, box-shadow .2s ease' }}>
                <Icon name="search" size={14} color={T3}/>
                <input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  placeholder="Search topics, documents, people, events…"
                  style={{ flex:1, border:'none', outline:'none', background:'transparent', fontSize:13, color:T1, padding:0 }}
                />
              </div>
              {isSearchOpen && normalizedSearch && searchResults.length > 0 && (
                <div style={{ position:'absolute', top:'calc(100% + 8px)', left:0, right:0, background:W, border:`1px solid ${BD}`, borderRadius:12, boxShadow:'0 16px 40px rgba(17,24,39,0.12)', overflow:'hidden', zIndex:40 }}>
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.key}`}
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
            </div>
          ) : (
            <span style={{ fontSize:14, fontWeight:600, color:T1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>Home</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:isMobile?8:12, flexShrink:0 }}>
          {isMobile && (
            <button style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex' }}>
              <Icon name="search" size={18} color={T2}/>
            </button>
          )}
          <div ref={notifRef} style={{ position:'relative' }}>
            <button
              type="button"
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              style={{ width:34, height:34, border:`1px solid ${BD}`, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', flexShrink:0, background:W }}
              aria-label="Open notifications"
            >
              <Icon name="bell2" size={16} color={T2}/>
              <div style={{ width:7, height:7, background:'#EF4444', borderRadius:'50%', border:'1.5px solid #fff',
                position:'absolute', top:6, right:6 }}/>
            </button>
            {isNotificationsOpen && (
              <div style={{ position:'absolute', top:'calc(100% + 10px)', right:0, width:280, background:W, border:`1px solid ${BD}`, borderRadius:12, boxShadow:'0 18px 42px rgba(17,24,39,0.12)', overflow:'hidden', zIndex:30 }}>
                <div style={{ padding:'12px 14px', borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:700, color:T1 }}>Notifications</div>
                    <div style={{ fontSize:11, color:T3 }}>3 new updates</div>
                  </div>
                  <span style={{ fontSize:11, color:P, fontWeight:600 }}>View all</span>
                </div>
                <div>
                  {notifications.map((item) => (
                    <div key={item.title} style={{ padding:'10px 14px', borderBottom:`1px solid ${BD}`, background:'#FCFCFD' }}>
                      <div style={{ fontSize:13, fontWeight:600, color:T1, marginBottom:2 }}>{item.title}</div>
                      <div style={{ fontSize:12, color:T2, marginBottom:4 }}>{item.detail}</div>
                      <div style={{ fontSize:11, color:T3 }}>{item.time}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div title={displayName} style={{ width:46, height:46, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'2px solid #111827', boxShadow:'0 6px 16px rgba(17,24,39,0.14)', background:'#FFFFFF', display:'flex', alignItems:'center', justifyContent:'center', padding:0 }}>
            <svg viewBox="0 0 64 64" width="46" height="46" role="img" aria-label={`${displayName} avatar`}>
              <rect width="64" height="64" rx="32" fill="#FFFFFF" />
              <circle cx="32" cy="24" r="12" fill={profileAvatar.skin} stroke="#111827" strokeWidth="2.5" />
              <path d="M20 48c2-10 10-15 12-15s10 5 12 15" fill={profileAvatar.shirt} stroke="#111827" strokeWidth="2.5" />
              <path d="M20 31c2-6 7-10 12-10 5 0 10 4 12 10" stroke={profileAvatar.hair} strokeWidth="4" strokeLinecap="round" fill="none" />
              <rect x="27" y="24" width="3" height="3" rx="1.5" fill="#111827" />
              <rect x="34" y="24" width="3" height="3" rx="1.5" fill="#111827" />
              <path d="M28 31c2 2 6 2 8 0" stroke={profileAvatar.accent} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            </svg>
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex:1, minHeight:0, overflowY:'auto', padding:isMobile?'16px 14px 60px':'24px 28px 60px' }}>

          {/* ── HOME PAGE ── */}
          {currentPage === 'home' && (
          <>
          <div ref={bannerRef} style={{
            background:`linear-gradient(135deg, ${PD} 0%, ${P} 55%, ${PL} 100%)`,
            borderRadius:18, padding:isMobile?'20px 18px':'26px 32px', marginBottom:22,
            display:'flex', flexDirection:isMobile?'column':'row',
            justifyContent:'space-between', alignItems:isMobile?'flex-start':'center', gap:isMobile?16:24,
            boxShadow:'0 16px 36px rgba(91,33,182,0.18)', position:'relative', overflow:'hidden',
          }}>
            <div style={{ minWidth:0 }}>
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:10, fontWeight:600, letterSpacing:1.2,
                textTransform:'uppercase', margin:'0 0 8px' }}>{greeting.toUpperCase()}</p>
              <h1 style={{ color:W, fontSize:isMobile?20:26, fontWeight:700, margin:'0 0 8px', letterSpacing:-.5 }}>
                {greeting}, {displayName} 👋
              </h1>
              <p style={{ color:'rgba(255,255,255,.8)', fontSize:13, margin:'0 0 16px', maxWidth:400, lineHeight:1.6 }}>
                Your home dashboard is synced with the latest courses, events, and member activity from the platform.
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
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flexShrink:0, width:isMobile?'100%':'auto' }}>
              {[
                { value: memberCount || 0, label: 'Members' },
                { value: dashboardCourses.length, label: 'Courses' },
                { value: dashboardEvents.length, label: 'Sessions' },
                { value: dashboardLoading ? '—' : Math.max(1, dashboardCourses.length + dashboardEvents.length), label: 'Updates' },
              ].map((item) => (
                <div key={item.label} style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)',
                  borderRadius:10, padding:isMobile?'10px 14px':'12px 18px', textAlign:'center', minWidth:isMobile?0:90 }}>
                  <div style={{ fontSize:isMobile?17:20, fontWeight:700, color:W, letterSpacing:-.5 }}>{item.value}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', marginTop:2 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── RESUME CARD ── */}
          <div ref={resumeRef} style={{
            background:W, border:`1px solid #EEEAFD`, borderRadius:14, padding:'18px 20px',
            marginBottom:24, display:'flex', flexDirection:isMobile?'column':'row',
            alignItems:isMobile?'flex-start':'center', gap:isMobile?10:16,
            boxShadow:'0 10px 28px rgba(17,24,39,0.05)',
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
            <button onClick={() => onNavigate('learning')} style={{ ...btnStyle('none', P, W, 13), padding:'10px 20px', borderRadius:8, fontWeight:500,
              flexShrink:0, whiteSpace:'nowrap', width:isMobile?'100%':'auto' }}>
              Open learning
            </button>
          </div>

          {/* ── TWO-COLUMN GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':isTablet?'1fr 240px':'1fr 290px', gap:24 }}>

            {/* LEFT COLUMN */}
            <div>
              {/* Learning section */}
              <div ref={learningRef}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:16, fontWeight:600, color:T1, margin:0 }}>Learning</h2>
                  <button onClick={() => onNavigate('learning')} style={{ fontSize:13, color:P, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                    Go to Learning Hub <Icon name="arrow" size={13} color={P}/>
                  </button>
                </div>
                {dashboardLoading ? (
                  <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:'16px', color:T2 }}>Loading courses…</div>
                ) : latestCourses.length > 0 ? latestCourses.map((course) => (
                  <CourseCard key={course.id} cat={course.category || 'COURSE'} title={course.title} meta={course.description || 'Live from the platform'} pct={null} btn="Open course"/>
                )) : (
                  <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:'16px', color:T2 }}>No courses are available right now.</div>
                )}
              </div>

              {/* Events section */}
              <div ref={eventsRef} style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:16, fontWeight:600, color:T1, margin:0 }}>
                    Upcoming events <span style={{ fontSize:13, color:T3, fontWeight:400 }}>(8)</span>
                  </h2>
                  <button onClick={() => onNavigate('events')} style={{ fontSize:13, color:P, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4 }}>
                    View all <Icon name="arrow" size={13} color={P}/>
                  </button>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
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
                      <div key={event.id} style={{ display:'flex', alignItems:isMobile?'flex-start':'center', gap:14, padding:'14px 18px',
                        borderBottom:index<arr.length-1?`1px solid ${BD}`:'none', flexWrap:isMobile?'wrap':'nowrap' }}>
                        <div style={{ width:46, minWidth:46, background:PF, borderRadius:8, textAlign:'center', padding:'7px 4px' }}>
                          <div style={{ fontSize:9, fontWeight:700, color:P, letterSpacing:.5, textTransform:'uppercase' }}>{month}</div>
                          <div style={{ fontSize:20, fontWeight:700, color:P, lineHeight:1.1 }}>{day}</div>
                          <div style={{ fontSize:9, color:P, fontWeight:500 }}>{weekday}</div>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <span style={{ background:PF, color:P, fontSize:9, fontWeight:700, padding:'2px 7px', borderRadius:4, textTransform:'uppercase', letterSpacing:.4 }}>
                            {type}
                          </span>
                          <p style={{ fontSize:13, fontWeight:600, color:T1, margin:'4px 0 3px', lineHeight:1.3 }}>{event.title}</p>
                          <p style={{ fontSize:11, color:T2, margin:0 }}>{meta}</p>
                        </div>
                        <button onClick={() => onNavigate('events')} style={{
                          ...btnStyle('none', P, W, 12),
                          padding:'7px 14px', borderRadius:7, fontWeight:500, flexShrink:0,
                          marginTop:isMobile?4:0,
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
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Recently added */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:0 }}>Recently added</h3>
                  <button onClick={() => onNavigate('vault')} style={{ fontSize:12, color:P, background:'transparent', border:'none', cursor:'pointer' }}>Open vault</button>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:14, overflow:'hidden', boxShadow:'0 10px 24px rgba(17,24,39,0.04)' }}>
                  {latestCourses.length > 0 ? latestCourses.map((course, index, arr) => (
                    <div key={course.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:index<arr.length-1?`1px solid ${BD}`:'none' }}>
                      <div style={{ width:32, height:32, background:PF, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>📘</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:T1, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{course.title}</p>
                        <p style={{ fontSize:10, color:T3, margin:0 }}>{course.description || 'Published course'}</p>
                      </div>
                    </div>
                  )) : (
                    <div style={{ padding:'12px 14px', color:T2 }}>No recent content yet.</div>
                  )}
                </div>
              </div>

              {/* Demo videos */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:0 }}>Videos</h3>
                  <button onClick={() => onNavigate('learning')} style={{ fontSize:12, color:P, background:'transparent', border:'none', cursor:'pointer' }}>Watch more</button>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {demoVideos.map((video, index, arr) => (
                    <div key={video.title} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderBottom:index < arr.length - 1 ? `1px solid ${BD}` : 'none' }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:PF, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>▶</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:600, color:T1, margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{video.title}</p>
                        <p style={{ fontSize:11, color:T3, margin:0 }}>{video.tag} · {video.duration}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveVideo(video)}
                        style={{ ...btnStyle('none', P, W, 11), padding:'6px 10px', borderRadius:7, flexShrink:0 }}>
                        Play
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Announcements */}
              <div style={{ marginTop:20 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:0 }}>Announcements</h3>
                  <button onClick={() => onNavigate('events')} style={{ fontSize:12, color:P, background:'transparent', border:'none', cursor:'pointer' }}>View all</button>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:14, overflow:'hidden', boxShadow:'0 10px 24px rgba(17,24,39,0.04)' }}>
                  {notifications.length > 0 ? notifications.map((item, index, arr) => (
                    <div key={`${item.title}-${index}`} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:index<arr.length-1?`1px solid ${BD}`:'none' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:P, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:T1, margin:'0 0 2px' }}>{item.title}</p>
                        <p style={{ fontSize:11, color:T3, margin:0 }}>{item.detail}</p>
                      </div>
                      <span style={{ background:PF, color:P, fontSize:11, fontWeight:500, padding:'2px 9px', borderRadius:6, flexShrink:0 }}>{item.time}</span>
                    </div>
                  )) : (
                    <div style={{ padding:'12px 14px', color:T2 }}>No new updates yet.</div>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 12px' }}>Recent activity</h3>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:14, overflow:'hidden', boxShadow:'0 10px 24px rgba(17,24,39,0.04)' }}>
                  {dashboardEvents.length > 0 ? dashboardEvents.slice(0,3).map((event, index, arr) => (
                    <div key={event.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:index<arr.length-1?`1px solid ${BD}`:'none' }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:PF, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:P }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:T1, margin:'0 0 2px' }}>{event.title}</p>
                        <p style={{ fontSize:11, color:T3, margin:0 }}>{event.meetingPlatform || 'Live session'}</p>
                      </div>
                      <span style={{ fontSize:12, color:P, fontWeight:500, flexShrink:0 }}>{new Date(event.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
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
        ::-webkit-scrollbar{width:5px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:10px;}
        ::-webkit-scrollbar-track{background:transparent;}
      `}</style>
    </div>
  );
}
