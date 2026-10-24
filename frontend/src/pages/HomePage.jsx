import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import LearningHub from './LearningHub';
import DueDiligencePage from './DueDiligencePage';
import ProjectPipelinePage from './ProjectPipelinePage';
import OfficeHoursEvents from './OfficeHoursEvents';
import AdminEventRequests from './AdminEventRequests';
import AnnouncementsPage from './AnnouncementsPage';
import HelpPage from './HelpPage';
import MessagingPage from './MessagingPage';
import ProfileSettings from '../components/ProfileSettings';
import ProfileAvatar from '../components/ProfileAvatar';
import AsyncState from '../components/AsyncState';
import { coursesAPI, eventsAPI, notificationsAPI } from '../api/endpoints';
import wavingHandIllustration from '../assets/illustrations/waving-hand-skin-4-svgrepo-com.svg';
import { formatRelativeTime } from '../utils/learningHubProgress';
import AdminOverview from './AdminOverview';
import AdminAnalytics from './AdminAnalytics';
import AdminLearningHub from './AdminLearningHub';
import { isAdminUser } from '../utils/isAdminUser';

/* ─── DESIGN TOKENS ─── */
const P   = '#5B21B6';
const PL  = '#7C3AED';
const PD  = '#4C1D95';
const PF  = '#F8FAFC';
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
const BG  = '#F8FAFC';
const W   = '#FFFFFF';

const glassCardStyle = (radius = 16, padding = '16px 18px') => ({
  background: W,
  border: `1px solid rgba(226,232,240,0.95)`,
  borderRadius: radius,
  boxShadow: '0 10px 24px rgba(15,23,42,0.06)',
  padding,
});

/* ─── TUTORIAL STEPS ──────*/
const STEPS = [
  { id:'welcome',  target:null,       pos:'center', icon:'spark', title:'Welcome to Tribes Capital',
    desc:"You're now part of a community of clean energy investors and professionals across Africa. Let us show you around in 6 quick steps." },
  { id:'sidebar',  target:'sidebar',  pos:'right',  icon:'home', title:'Your main navigation',
    desc:'Use this sidebar to jump between Learning Hub, Due Diligence Vault, Project Pipeline, Office Hours & Events, and every other community section.' },
  { id:'banner',   target:'banner',   pos:'bottom', icon:'book', title:'Your personal home base',
    desc:"Your dashboard brings together the learning, events, projects, and community updates you need for your next move." },
  { id:'stats',    target:'stats',    pos:'bottom', icon:'chart', title:'Track your progress',
    desc:'Five quick links take you straight to learning, events, projects, due diligence, and the latest community updates.' },
  { id:'activity', target:'activity', pos:'top',    icon:'calendar', title:'Stay up to date',
    desc:'Recent courses, events, videos, and announcements appear here, with a direct path to each item.' },
  { id:'done',     target:null,       pos:'center', icon:'check', title:"You're all set!",
    desc:"Dive into Learning Hub to continue your course, join an upcoming Office Hours, or explore the Project Pipeline. Welcome aboard!", isLast:true },
];

/* ─── SMALL ICON SVGs ────────────────────────────────── */
const TOUR_VISITS_KEY = 'tribescapital_welcome_tour_visits';
const COURSE_PROGRESS_STORAGE_PREFIX = 'tribes-course-progress';

const getTourVisitCount = () => {
  if (typeof window === 'undefined') return 0;
  const storedValue = window.localStorage.getItem(TOUR_VISITS_KEY);
  const parsedValue = Number(storedValue);
  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0;
};

function readStoredCourseProgress(courseId) {
  if (typeof window === 'undefined' || !courseId) return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0, lastAccessedAt: null };
  try {
    const storedValue = window.localStorage.getItem(`${COURSE_PROGRESS_STORAGE_PREFIX}:${courseId}`);
    if (!storedValue) return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0, lastAccessedAt: null };
    const parsed = JSON.parse(storedValue);
    return {
      progress: Number(parsed?.progress || 0),
      completedLessonIds: Array.isArray(parsed?.completedLessonIds) ? parsed.completedLessonIds : [],
      lastLessonId: parsed?.lastLessonId || null,
      lastLessonIndex: Number.isInteger(parsed?.lastLessonIndex) ? parsed.lastLessonIndex : 0,
      lastAccessedAt: parsed?.lastAccessedAt || null,
    };
  } catch {
    return { progress: 0, completedLessonIds: [], lastLessonId: null, lastLessonIndex: 0, lastAccessedAt: null };
  }
}

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
    check:   <><path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    close:   <><path d="M18 6L6 18" stroke={color} strokeWidth="1.8" strokeLinecap="round"/><path d="M6 6l12 12" stroke={color} strokeWidth="1.8" strokeLinecap="round"/></>,
    spark:   <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
    play:    <><path d="M8 6v12l10-6-10-6Z" stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></>,
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
function TutorialOverlay({ step, total, spotlight, tipPos = { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }, onNext, onBack, isMobile = false }) {
  const cur = STEPS[step] || {};
  const tipW = isMobile ? Math.min(320, (typeof window !== 'undefined' ? window.innerWidth : 340) - 24) : 340;

  return (
    <>
      {/* Spotlight or solid overlay */}
      {spotlight ? (
        <div style={{
          position: 'fixed', top: spotlight.top, left: spotlight.left,
          width: spotlight.width, height: spotlight.height,
          borderRadius: 14, zIndex: 1000, pointerEvents: 'none',
          boxShadow: '0 0 0 9999px rgba(17,24,39,0.68)',
          border: '2px solid rgba(255,255,255,0.55)',
          transition: 'all 0.35s cubic-bezier(.4,0,.2,1)'
        }} />
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(17,24,39,0.68)', zIndex: 999, pointerEvents: 'none' }} />
      )}

      <div style={{ position: 'fixed', top: tipPos.top, left: tipPos.left, transform: tipPos.transform, zIndex: 1001, width: tipW, maxWidth: '92%', display: 'flex', justifyContent: 'center' }}>
        <div style={{ ...glassCardStyle(12, '14px'), boxShadow: '0 12px 32px rgba(17,24,39,0.12)', borderRadius: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T1 }}>{cur.title}</div>
              <div style={{ fontSize: 13, color: T2, marginTop: 6 }}>{cur.desc}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
                {onBack && <button onClick={onBack} style={{ ...btnStyle('none', 'transparent', T2, 13), padding: '8px 12px', borderRadius: 8 }}>Back</button>}
                <button onClick={onNext} style={{ ...btnStyle('none', P, W, 13), padding: '8px 20px', borderRadius: 8, fontWeight: 500 }}>{step === total - 1 ? 'Start exploring ✓' : 'Next →'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes tipIn { from { opacity:0; transform: scale(.95) translateY(8px); } to { opacity:1; transform: scale(1) translateY(0); } }`}</style>
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

const getVisualThumbnail = (videoId, thumbnail) => {
  if (thumbnail) return thumbnail;
  if (videoId) return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  return null;
};

const getCategoryPalette = (category = '') => {
  const normalized = String(category).toLowerCase();
  if (normalized.includes('energy') || normalized.includes('clean')) return { start:'#4F46E5', end:'#0EA5E9' };
  if (normalized.includes('invest') || normalized.includes('deal')) return { start:'#7C3AED', end:'#DB2777' };
  if (normalized.includes('market') || normalized.includes('policy')) return { start:'#0F766E', end:'#14B8A6' };
  return { start:'#5B21B6', end:'#8B5CF6' };
};

/* ─── COURSE CARD ────────────────────────────────────── */
function LoadingCard({ isMobile = false, compact = false }) {
  return (
    <div style={{ ...glassCardStyle(14, isMobile ? '12px' : '16px'), overflow:'hidden' }}>
      <div style={{ display:'flex', gap:12, alignItems:'center', marginBottom:12 }}>
        <div style={{ width:compact ? 56 : 72, height:compact ? 56 : 72, borderRadius:12, background:'linear-gradient(90deg, #F3E8FF 0%, #EDE9FE 50%, #F3E8FF 100%)', backgroundSize:'200% 100%', animation:'shine 1.2s linear infinite' }} />
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ height:10, width:'45%', borderRadius:999, background:'linear-gradient(90deg, #F3E8FF 0%, #EDE9FE 50%, #F3E8FF 100%)', backgroundSize:'200% 100%', animation:'shine 1.2s linear infinite', marginBottom:8 }} />
          <div style={{ height:12, width:'82%', borderRadius:999, background:'linear-gradient(90deg, #F3E8FF 0%, #EDE9FE 50%, #F3E8FF 100%)', backgroundSize:'200% 100%', animation:'shine 1.2s linear infinite', marginBottom:8 }} />
          <div style={{ height:10, width:'60%', borderRadius:999, background:'linear-gradient(90deg, #F3E8FF 0%, #EDE9FE 50%, #F3E8FF 100%)', backgroundSize:'200% 100%', animation:'shine 1.2s linear infinite' }} />
        </div>
      </div>
      {!compact && (
        <div style={{ display:'grid', gap:8 }}>
          <div style={{ height:10, width:'100%', borderRadius:999, background:'linear-gradient(90deg, #F3E8FF 0%, #EDE9FE 50%, #F3E8FF 100%)', backgroundSize:'200% 100%', animation:'shine 1.2s linear infinite' }} />
          <div style={{ height:10, width:'70%', borderRadius:999, background:'linear-gradient(90deg, #F3E8FF 0%, #EDE9FE 50%, #F3E8FF 100%)', backgroundSize:'200% 100%', animation:'shine 1.2s linear infinite' }} />
        </div>
      )}
    </div>
  );
}

function CourseCard({ cat, title, meta, pct, btn, catColor = P, isMobile = false, thumbnail = null, videoId = null, onPlay = null }) {
  const showProgress = pct !== undefined && pct !== null;
  const resolvedThumbnail = React.useMemo(() => getVisualThumbnail(videoId, thumbnail), [videoId, thumbnail]);
  const categoryPalette = React.useMemo(() => getCategoryPalette(cat), [cat]);
  const [mediaError, setMediaError] = React.useState(false);
  const showMedia = Boolean(resolvedThumbnail || videoId);

  React.useEffect(() => {
    setMediaError(false);
  }, [resolvedThumbnail]);

  const fallbackLabel = typeof title === 'string' ? title.split(' ').slice(0, 2).join(' ').trim() : 'Course';

  return (
    <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, marginBottom:12, overflow:'hidden', boxShadow:'0 8px 24px rgba(17,24,39,0.04)', transition:'transform .2s ease, box-shadow .2s ease' }}>
      <div style={{ height:3, background:'#F3F4F6' }}>
        <div style={{ height:3, width:`${showProgress ? pct : 100}%`, background:catColor === GR ? GR : P, borderRadius:'0 3px 3px 0' }} />
      </div>
      <style>{`
        @keyframes shine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
      <div style={{ padding:'14px 18px 16px', display:'flex', flexDirection:isMobile ? 'column' : 'row', gap:14 }}>
        {showMedia ? (
          <div style={{ width:isMobile ? '100%' : 96, minWidth:isMobile ? 0 : 96, aspectRatio:'16 / 9', borderRadius:10, overflow:'hidden', background:PF, position:'relative', flexShrink:0, boxShadow:'inset 0 1px 0 rgba(255,255,255,0.35)' }}>
            {resolvedThumbnail && !mediaError ? (
              <img src={resolvedThumbnail} alt={title} onError={() => setMediaError(true)} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            ) : (
              <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, ${categoryPalette.start} 0%, ${categoryPalette.end} 100%)`, color:W, padding:12 }}>
                <div style={{ width:'100%', height:'100%', borderRadius:8, border:'1px solid rgba(255,255,255,0.22)', display:'flex', flexDirection:'column', justifyContent:'space-between', padding:12, background:'rgba(255,255,255,0.12)' }}>
                  <span style={{ fontSize:10, fontWeight:700, letterSpacing:1.1, textTransform:'uppercase', opacity:0.9 }}>Featured</span>
                  <div>
                    <div style={{ fontSize:22, fontWeight:700, lineHeight:1.2, marginBottom:4 }}>{fallbackLabel}</div>
                    <div style={{ fontSize:11, opacity:0.9 }}>Curated learning asset</div>
                  </div>
                </div>
              </div>
            )}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, rgba(17,24,39,0.08) 0%, rgba(17,24,39,0.24) 100%)', pointerEvents:'none' }} />
            {onPlay && (
              <button type="button" onClick={(event) => { event.stopPropagation(); onPlay(); }} style={{ position:'absolute', inset:0, border:'none', background:'transparent', color:W, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
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

function getNotificationData(value) {
  if (value && typeof value === 'object') return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function getNotificationPage(notification) {
  const type = String(notification?.type || '').toLowerCase();
  const data = getNotificationData(notification?.data);
  const explicitPage = String(data.page || data.sourcePage || '').toLowerCase();

  if (['messages', 'learning', 'vault', 'pipeline', 'events', 'announcements', 'help'].includes(explicitPage)) {
    return explicitPage;
  }

  if (data.conversationId || type.includes('message') || type.includes('mention')) return 'messages';
  if (data.dueDiligenceId || type.includes('diligence')) return 'vault';
  if (data.eventId || type.includes('event') || type.includes('office')) return 'events';
  if (data.courseId || data.lessonId || type.includes('course') || type.includes('lesson')) return 'learning';
  if (data.projectId || type.includes('project') || type.includes('pipeline')) return 'pipeline';
  if (type.includes('announcement') || type.includes('feedback')) return 'announcements';
  return 'announcements';
}

/* ─── MAIN APP ───────────────────────────────────────── */
export default function HomePage({ user, currentPage = 'home', onNavigate = () => {}, onLogout = () => {}, onUpdateUser = () => {}, onToggleSidebar = () => {}, isMobile = false, isTablet = false, isSidebarOpen = true }) {
  const [tourStep,   setTourStep]   = useState(0);
  const [tourActive, setTourActive] = useState(() => getTourVisitCount() < 2);
  const [spotlight,  setSpotlight]  = useState(null);
  const [tipPos,     setTipPos]     = useState({ top:'50%', left:'50%', transform:'translate(-50%,-50%)' });
  const [dashboardCourses, setDashboardCourses] = useState([]);
  const [dashboardEvents, setDashboardEvents] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardLoadErrors, setDashboardLoadErrors] = useState({ courses: false, events: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);

  const isOverlay = isMobile || isTablet;
  const displayName = user?.name || user?.firstName || user?.email?.split('@')[0] || 'there';
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [showAnnouncementPopup, setShowAnnouncementPopup] = useState(false);
  const [announcementPopup, setAnnouncementPopup] = useState(null);
  const [watchedVideos, setWatchedVideos] = useState([]);
  const notifRef = useRef(null);
  const lastNotificationIdRef = useRef(null);
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

  // The avatar is persisted on the authenticated user record.
  const [avatarDataUrl, setAvatarDataUrl] = useState(user?.avatar || null);
  const avatarInputRef = useRef(null);
  useEffect(() => {
    setAvatarDataUrl(user?.avatar || null);
  }, [user?.id, user?.avatar]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const handleAvatarClick = () => { setShowProfileModal(true); };
  const handleAvatarChange = (e) => {
    const f = e?.target?.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      setAvatarDataUrl(url);
    };
    reader.readAsDataURL(f);
  };

  const heroImage = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1200&q=80';

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedVideos = JSON.parse(window.localStorage.getItem('tribes-home-watched-videos') || '[]');
        setWatchedVideos(Array.isArray(storedVideos) ? storedVideos : []);
      } catch {
        setWatchedVideos([]);
      }
    }
  }, []);

  const recordWatchedVideo = useCallback((video) => {
    if (!video?.title || !video?.videoId) return;
    const watchedItem = {
      id: `${video.videoId}-${Date.now()}`,
      type: 'video',
      title: video.title,
      detail: `${video.tag || 'Video'} · ${video.duration || 'Recently watched'}`,
      time: 'Just now',
      timestamp: Date.now(),
      videoId: video.videoId,
      thumbnail: video.thumbnail,
    };

    setWatchedVideos((prev) => {
      const deduped = [watchedItem, ...prev.filter((item) => item.videoId !== video.videoId)].slice(0, 6);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('tribes-home-watched-videos', JSON.stringify(deduped));
      }
      return deduped;
    });
    setActiveVideo(video);
  }, []);

  const upcomingEvents = useMemo(() => (dashboardEvents || [])
    .filter((event) => {
      const startTime = new Date(event.startDate).getTime();
      return Number.isFinite(startTime) && startTime >= Date.now();
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3), [dashboardEvents]);

  const updatesFeed = useMemo(() => {
    const eventItems = upcomingEvents.slice(0, 2).map((event) => ({
      id: `event-${event.id}`,
      kind: 'event',
      title: event.title,
      detail: `${event.meetingPlatform || 'Live session'} · ${new Date(event.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
      time: 'Upcoming',
      timestamp: new Date(event.startDate).getTime(),
    }));

    const courseItems = (dashboardCourses || []).filter((course) => course.lastAccessedAt).slice(0, 2).map((course) => ({
      id: `course-${course.id}`,
      kind: 'course',
      title: course.title,
      detail: course.description || 'Recently added on the platform',
      time: formatRelativeTime(course.lastAccessedAt),
      timestamp: new Date(course.lastAccessedAt).getTime(),
    }));

    const announcementItems = (notifications || []).slice(0, 2).map((item) => ({
      id: `announcement-${item.id || item.title}`,
      kind: 'announcement',
      title: item.title,
      detail: item.detail || item.message || 'Fresh update from the community',
      time: item.time || 'Today',
      timestamp: Date.now() - 2000,
    }));

    const videoItems = (watchedVideos || []).slice(0, 2).map((video) => ({
      id: `video-${video.id}`,
      kind: 'video',
      title: video.title,
      detail: video.detail || 'You watched this lesson video',
      time: formatRelativeTime(video.timestamp || Date.now()),
      timestamp: video.timestamp || Date.now(),
    }));

    return [...eventItems, ...courseItems, ...announcementItems, ...videoItems]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 6);
  }, [dashboardCourses, upcomingEvents, notifications, watchedVideos]);

  const isMountedRef = React.useRef(true);

  const applyCourseProgressUpdate = React.useCallback((detail) => {
    const courseId = detail?.courseId;
    const progressValue = Number(detail?.progress ?? 0);
    if (!courseId) return;

    setDashboardCourses((prev) => prev.map((course) => {
      if (String(course.id) !== String(courseId)) return course;
      const nextStatus = progressValue >= 100 ? 'completed' : progressValue > 0 ? 'inProgress' : 'notStarted';
      return {
        ...course,
        progress: progressValue,
        status: nextStatus,
        lastAccessedAt: detail?.lastAccessedAt || course.lastAccessedAt,
        lastLessonId: detail?.lastLessonId || course.lastLessonId,
        lastLessonIndex: detail?.lastLessonIndex ?? course.lastLessonIndex,
      };
    }));

  }, []);

  const loadDashboardData = React.useCallback(async () => {
    setDashboardLoading(true);
    setDashboardLoadErrors({ courses: false, events: false });
    try {
      const [coursesRes, eventsRes, enrolledRes] = await Promise.all([
        coursesAPI.list({ skip: 0, take: 8 }).catch(() => {
          if (isMountedRef.current) setDashboardLoadErrors((current) => ({ ...current, courses: true }));
          return { data: [] };
        }),
        eventsAPI.list({ skip: 0, take: 6 }).catch(() => {
          if (isMountedRef.current) setDashboardLoadErrors((current) => ({ ...current, events: true }));
          return { data: [] };
        }),
        coursesAPI.getEnrolled().catch(() => ({ data: [] })),
      ]);

      if (!isMountedRef.current) return;

      const enrolledMap = new Map((Array.isArray(enrolledRes?.data) ? enrolledRes.data : []).map((enrollment) => [String(enrollment.courseId || enrollment.course?.id || ''), enrollment]));
      const normalizedCourses = (Array.isArray(coursesRes?.data) ? coursesRes.data : []).map((course) => {
        const enrollment = enrolledMap.get(String(course.id));
        const storedProgress = readStoredCourseProgress(course.id);
        const progress = Math.max(Number(enrollment?.progress ?? 0), Number(storedProgress.progress ?? 0));
        return {
          id: course.id,
          category: course.category || course.cat || 'General',
          title: course.title || 'Untitled course',
          description: course.description || course.desc || course.subtitle || 'Continue your learning with this course.',
          duration: course.duration || course.dur || 'Self-paced',
          lessons: course.lessons || course.lessonCount || 0,
          difficulty: course.difficulty || course.level || 'Beginner',
          videoId: course.videoId || 'wMQDsjS9WC4',
          thumbnail: getVisualThumbnail(course.videoId || 'wMQDsjS9WC4', course.thumbnail),
          progress,
          enrolled: Boolean(enrollment),
          status: progress >= 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted',
          lastAccessedAt: storedProgress.lastAccessedAt || null,
          lastLessonId: storedProgress.lastLessonId || null,
          lastLessonIndex: storedProgress.lastLessonIndex || 0,
        };
      });

      setDashboardCourses(normalizedCourses);
      setDashboardEvents(Array.isArray(eventsRes?.data) ? eventsRes.data : []);
    } catch (error) {
      if (isMountedRef.current) {
        setDashboardCourses([]);
        setDashboardEvents([]);
      }
    } finally {
      if (isMountedRef.current) setDashboardLoading(false);
    }
  }, [user?.id, user?.email]);

  useEffect(() => {
    isMountedRef.current = true;
    // initial load
    void loadDashboardData();

    // react to cross-component custom events
    const onDataUpdate = (event) => {
      if (event?.detail?.type === 'course-progress') {
        applyCourseProgressUpdate(event.detail);
        return;
      }
      if (event?.detail?.type && !['saved-courses', 'course-progress'].includes(event.detail.type)) {
        return;
      }
      void loadDashboardData();
    };

    // respond to other tabs or pages updating localStorage or custom events
    const onStorage = (e) => {
      if (!e || !e.key) return;
      const interesting = ['tribes-saved-courses', 'tribes-home-watched-videos', TOUR_VISITS_KEY];
      // Check if any course progress key was updated (stored as 'tribes-course-progress:courseId')
      const isCourseProgress = e.key?.startsWith('tribes-course-progress:');
      if (interesting.includes(e.key) || isCourseProgress) {
        void loadDashboardData();
      }
    };

    window.addEventListener('tribes:data-update', onDataUpdate);
    window.addEventListener('tribes:course-progress-update', onDataUpdate);
    window.addEventListener('storage', onStorage);

    return () => {
      isMountedRef.current = false;
      window.removeEventListener('tribes:data-update', onDataUpdate);
      window.removeEventListener('tribes:course-progress-update', onDataUpdate);
      window.removeEventListener('storage', onStorage);
    };
  }, [applyCourseProgressUpdate, loadDashboardData]);

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

  const loadNotifications = useCallback(async () => {
    try {
      setNotificationsLoading(true);
      const response = await notificationsAPI.list().catch(() => ({ data: [] }));
      const notificationPayload = response?.data?.data ?? response?.data ?? [];
      const apiNotifications = Array.isArray(notificationPayload) ? notificationPayload : [];
      const normalized = apiNotifications.map((item) => ({
        id: item.id,
        title: item.title || item.type || 'Notification',
        detail: item.message || item.body || item.description || 'You have a new update',
        time: item.createdAt ? new Date(item.createdAt).toLocaleString('en', { month: 'short', day: 'numeric' }) : 'Now',
        read: Boolean(item.isRead ?? item.read),
        type: item.type || '',
        data: getNotificationData(item.data),
      }));

      setNotifications(normalized);
      const nextUnread = normalized.find((item) => !item.read);
      if (nextUnread && nextUnread.id !== lastNotificationIdRef.current) {
        lastNotificationIdRef.current = nextUnread.id;
        setAnnouncementPopup(nextUnread);
        setShowAnnouncementPopup(true);
      }
    } catch {
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
      setShowAnnouncementPopup(false);
      setAnnouncementPopup(null);
    } catch {
      // Keep the unread state when the server could not confirm the update.
    }
  }, []);

  const markNotificationRead = useCallback(async (notification) => {
    if (!notification?.id || notification.read) return;
    try {
      await notificationsAPI.markAsRead(notification.id);
      setNotifications((prev) => prev.map((item) => item.id === notification.id ? { ...item, read: true } : item));
    } catch {
      // Keep the notification unread when the server could not confirm the update.
    }
  }, []);

  const openNotification = useCallback(async (notification) => {
    void markNotificationRead(notification);
    setIsNotificationsOpen(false);
    setShowAnnouncementPopup(false);
    setAnnouncementPopup(null);
    onNavigate(getNotificationPage(notification));
  }, [markNotificationRead, onNavigate]);

  useEffect(() => {
    let isMounted = true;
    const runLoad = async () => {
      await loadNotifications();
      if (!isMounted) return;
    };

    void runLoad();
    return () => { isMounted = false; };
  }, [loadNotifications]);

  useEffect(() => {
    const handleNotificationsEvent = (event) => {
      const eventType = event?.detail?.type;
      if (eventType && ['notifications-updated', 'due-diligence-created', 'announcement-updated'].includes(eventType)) {
        void loadNotifications();
      }
    };

    window.addEventListener('tribes:notifications-update', handleNotificationsEvent);
    return () => window.removeEventListener('tribes:notifications-update', handleNotificationsEvent);
  }, [loadNotifications]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  /* Section refs */
  const bannerRef   = useRef(null);
  const statsRef    = useRef(null);
  const activityRef = useRef(null);
  const REFS = { banner:bannerRef, stats:statsRef, activity:activityRef };

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
    { title: 'How Clean Energy Is Transforming Schools & Communities in Africa', duration: '1 min', tag: 'Demo lesson', videoId: 'wMQDsjS9WC4', thumbnail: getVisualThumbnail('wMQDsjS9WC4', null) },
    { title: 'Hospitals Are Going Dark in Africa — Tribes Capital is Fixing It', duration: '31 sec', tag: 'Live recap', videoId: 'Jdmt9BaYHnw', thumbnail: getVisualThumbnail('Jdmt9BaYHnw', null) },
    { title: 'How Clean Energy Powers Africa', duration: '45 sec', tag: 'Quick watch', videoId: 'DnjMO5L5QgI', thumbnail: getVisualThumbnail('DnjMO5L5QgI', null) },
  ];

  const buildYouTubeEmbedUrl = (videoId) => `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&controls=1&rel=0&fs=1`;

  const latestCourses = useMemo(() => {
    const inProgressCourses = dashboardCourses.filter((course) => course.enrolled && Number(course.progress || 0) < 100);
    return [...(inProgressCourses.length > 0 ? inProgressCourses : dashboardCourses)]
      .sort((a, b) => (new Date(b.lastAccessedAt || 0).getTime() - new Date(a.lastAccessedAt || 0).getTime()) || (Number(b.progress || 0) - Number(a.progress || 0)))
      .slice(0, 3);
  }, [dashboardCourses]);
  const hasInProgressCourses = dashboardCourses.some((course) => course.enrolled && Number(course.progress || 0) < 100);
  const dashboardShortcuts = [
    { label: 'Learning hub', detail: 'Build your knowledge', icon: 'book', page: 'learning', tone: 'violet' },
    { label: 'Events', detail: 'Meet the community', icon: 'calendar', page: 'events', tone: 'blue' },
    { label: 'Project pipeline', detail: 'Follow opportunities', icon: 'chart', page: 'pipeline', tone: 'teal' },
    { label: 'Due diligence', detail: 'Explore resources', icon: 'folder', page: 'vault', tone: 'amber' },
    { label: 'Community updates', detail: 'See what’s new', icon: 'bell', page: 'announcements', tone: 'rose' },
  ];
  const contentOwnsPageGutter = ['admin-dashboard', 'admin-analytics', 'events', 'messages', 'pipeline', 'settings', 'vault'].includes(currentPage);
  const pageGutterX = isMobile
    ? 'max(18px, env(safe-area-inset-left), env(safe-area-inset-right))'
    : isTablet
      ? 'max(24px, env(safe-area-inset-left), env(safe-area-inset-right))'
      : '32px';
  const contentPadding = contentOwnsPageGutter
    ? 0
    : `${isMobile ? '24px' : '32px'} var(--tc-page-gutter-x) calc(60px + env(safe-area-inset-bottom))`;
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
    <div style={{ display:'flex', flexDirection:'column', height:'100dvh', minHeight:'100dvh', background: BG, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize:14, overflow:'hidden' }}>

      {/* ══ TOPBAR ══ */}
      <div style={{
        minHeight:54, height:'auto', background:'rgba(248,250,252,0.92)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
        borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', padding:isMobile ? '10px 14px' : `0 ${24}px`, gap:12,
        flexShrink:0, justifyContent:'space-between', boxShadow:'0 8px 20px rgba(15,23,42,0.06)', position:'relative', zIndex:60,
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
          {/* Sidebar toggle */}
          {(isOverlay || !isSidebarOpen) && (
            <button className="topbar-action" onClick={onToggleSidebar} aria-label="Open navigation" title="Open navigation" style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', flexShrink:0 }}>
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
                    placeholder="Search dashboards, documents, and events…"
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
                    placeholder="Search dashboards, documents, and events…"
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
              style={{ width:40, height:40, border:`1px solid ${BD}`, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', flexShrink:0, background:W, transition:'all .2s ease', boxShadow:'0 1px 3px rgba(17,24,39,0.04)' }}
              aria-label="Open notifications"
            >
              <Icon name="bell2" size={22} color="#000"/>
            </button>
            {isNotificationsOpen && (
              <div style={{
                position: isMobile ? 'fixed' : 'absolute',
                top: isMobile ? 58 : '100%',
                right: isMobile ? 12 : 0,
                left: isMobile ? 12 : 'auto',
                marginTop: isMobile ? 0 : 8,
                width: isMobile ? 'calc(100% - 24px)' : 'min(384px, 90vw)',
                maxHeight: 'min(360px, calc(100vh - 160px))',
                overflow: 'hidden',
                background: W,
                border: `1px solid ${BD}`,
                borderRadius: 20,
                boxShadow: '0 22px 60px rgba(15,23,42,0.12)',
                zIndex: 200
              }}>
                <div className="notification-header" style={{ padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid rgba(226,232,240,0.9)` }}>
                  <div>
                    <div style={{ fontSize:12, fontWeight:800, color:T1, letterSpacing:'0.08em', textTransform:'uppercase' }}>Notifications</div>
                    <div style={{ fontSize:11.5, color:T3, marginTop:2 }}>{notificationsLoading ? 'Loading…' : `${notifications.filter((item) => !item.read).length} unread`}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { void markAllNotificationsRead(); }}
                    className="notification-action"
                  >
                    Mark all read
                  </button>
                </div>
                <div className="notification-list" style={{ maxHeight:'min(360px, calc(100vh - 160px))', overflowY:'auto' }}>
                  {notificationsLoading ? (
                    <AsyncState variant="loading" skeleton="rows" rows={2} compact title="Loading notifications" />
                  ) : notifications.length > 0 ? notifications.map((item) => (
                    <button
                      key={item.id || item.title}
                      type="button"
                      onClick={() => { void openNotification(item); }}
                      className={`notification-item ${item.read ? 'notification-item-read' : 'notification-item-unread'}`}
                      style={{ width:'100%', borderRadius:0, border:'none', padding:'16px', display:'block', textAlign:'left', cursor:'pointer' }}
                    >
                      <div style={{ fontSize:13.5, fontWeight:700, color:T1, marginBottom:4 }}>{item.title}</div>
                      <div style={{ fontSize:12.5, color:T2, lineHeight:1.5, marginBottom:6 }}>{item.detail}</div>
                      <div style={{ fontSize:11.5, color:T3 }}>{item.time}</div>
                    </button>
                  )) : (
                    <AsyncState variant="empty" compact title="You’re all caught up" description="New notifications will show up here." />
                  )}
                </div>
              </div>
            )}
          </div>
          <div title={displayName} className="topbar-avatar" onClick={handleAvatarClick} style={{ width:46, height:46, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'1.5px solid rgba(255,255,255,0.95)', boxShadow:'0 10px 24px rgba(17,24,39,0.16)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', padding:0, transition:'transform .2s ease, box-shadow .2s ease', cursor:'pointer', position:'relative' }}>
            <ProfileAvatar person={{ ...user, avatar: user?.avatar ?? avatarDataUrl }} alt={`${displayName} avatar`} style={{ width:'100%', height:'100%', borderRadius:0, fontSize:16 }} />
            <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'transparent', opacity:0, transition:'opacity .16s ease' }} className="avatar-overlay">
              <div style={{ background:'rgba(0,0,0,0.48)', color:'#fff', padding:'6px 8px', borderRadius:8, display:'flex', gap:8, alignItems:'center', fontSize:12 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
                Edit
              </div>
            </div>
            <input ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display:'none' }} />
          </div>
        </div>
      </div>

      {showAnnouncementPopup && announcementPopup && (
        <div className="notification-toast" role="status" aria-live="polite">
          <div className="notification-toast-icon"><Icon name="bell2" size={20} color="#000" /></div>
          <div className="notification-toast-content">
            <div className="notification-toast-label"><span>New notification</span></div>
            <strong>{announcementPopup.title}</strong>
            <p>{announcementPopup.detail}</p>
            <div className="notification-toast-actions">
              <button type="button" onClick={() => { void openNotification(announcementPopup); }}>View notification</button>
              <button type="button" className="notification-toast-dismiss" onClick={() => { setShowAnnouncementPopup(false); setAnnouncementPopup(null); }}>Dismiss</button>
            </div>
          </div>
          <button type="button" className="notification-toast-close" onClick={() => { setShowAnnouncementPopup(false); setAnnouncementPopup(null); }} aria-label="Close notification">×</button>
        </div>
      )}

      {/* SCROLLABLE CONTENT */}
      <div style={{ '--tc-page-gutter-x': pageGutterX, flex:1, minHeight:0, overflowY:currentPage === 'messages' ? 'hidden' : 'auto', WebkitOverflowScrolling:'touch', padding:contentPadding }}>

          {/* ── HOME PAGE ── */}
          {currentPage === 'admin-dashboard' && isAdminUser(user) && (
            <AdminOverview isMobile={isMobile} isTablet={isTablet} onNavigate={onNavigate} user={user} />
          )}
          {currentPage === 'admin-analytics' && isAdminUser(user) && (
            <AdminAnalytics isMobile={isMobile} isTablet={isTablet} />
          )}

          {currentPage === 'home' && !isAdminUser(user) && (
            <div className="home-dashboard">
              <section ref={bannerRef} className="home-dashboard-hero" aria-labelledby="home-dashboard-title">
                <div className="home-dashboard-hero-copy">
                  <p className="home-dashboard-eyebrow">TRIBES CAPITAL · YOUR COMMUNITY</p>
                  <h1 id="home-dashboard-title">
                    {greeting}, {displayName}
                    <img src={wavingHandIllustration} alt="" aria-hidden="true" />
                  </h1>
                  <p>Build your clean energy expertise, discover investment opportunities, and make your next move with the community.</p>
                  <div className="home-dashboard-hero-actions">
                    <button type="button" className="home-dashboard-primary-action" onClick={() => onNavigate('learning')}>
                      {hasInProgressCourses ? 'Continue learning' : 'Explore the Learning Hub'}
                      <Icon name="arrow" size={14} color="currentColor" />
                    </button>
                    <button type="button" className="home-dashboard-secondary-action" onClick={() => onNavigate('pipeline')}>Explore projects</button>
                  </div>
                </div>
                <div className="home-dashboard-hero-art" aria-hidden="true">
                  <img src={heroImage} alt="" />
                  <span className="home-dashboard-hero-orbit" />
                  <span className="home-dashboard-hero-caption">Powering a brighter future</span>
                </div>
              </section>

              <section ref={statsRef} className="home-dashboard-shortcuts" aria-labelledby="home-dashboard-shortcuts-title">
                <div className="home-dashboard-section-head">
                  <div>
                    <h2 id="home-dashboard-shortcuts-title">Explore Tribes Capital</h2>
                    <p>Go straight to a space in your community.</p>
                  </div>
                </div>
                <div className="home-dashboard-shortcut-grid">
                  {dashboardShortcuts.map((shortcut) => (
                    <button
                      type="button"
                      key={shortcut.page}
                      className={`home-dashboard-shortcut home-dashboard-shortcut--${shortcut.tone}`}
                      onClick={() => onNavigate(shortcut.page)}
                    >
                      <span className="home-dashboard-shortcut-icon"><Icon name={shortcut.icon} size={18} color="currentColor" /></span>
                      <span className="home-dashboard-shortcut-copy">
                        <span className="home-dashboard-shortcut-label">{shortcut.label}</span>
                        <span className="home-dashboard-shortcut-detail">{shortcut.detail}</span>
                      </span>
                      <Icon name="arrow" size={13} color={T3} />
                    </button>
                  ))}
                </div>
              </section>

              <div className="home-dashboard-content-grid">
                <section className="home-dashboard-panel home-dashboard-courses" aria-labelledby="home-dashboard-courses-title">
                  <div className="home-dashboard-section-head">
                    <div>
                      <h2 id="home-dashboard-courses-title">{hasInProgressCourses ? 'Continue learning' : 'Explore learning'}</h2>
                      <p>{hasInProgressCourses ? 'Pick up where you left off.' : 'Discover practical knowledge for the clean energy transition.'}</p>
                    </div>
                    <button type="button" onClick={() => onNavigate('learning')}>Learning hub <Icon name="arrow" size={13} color={P} /></button>
                  </div>
                  {latestCourses.length > 0 ? (
                    <div className="home-dashboard-course-grid">
                      {latestCourses.map((course) => {
                        const progress = Math.min(100, Math.max(0, Number(course.progress || 0)));
                        return (
                          <button key={course.id} type="button" className="home-dashboard-course-card" onClick={() => onNavigate('learning')}>
                            <span className="home-dashboard-course-image">
                              {course.thumbnail
                                ? <img src={course.thumbnail} alt="" />
                                : <Icon name="book" size={24} color={P} />}
                              <span className="home-dashboard-course-category">{course.category}</span>
                            </span>
                            <span className="home-dashboard-course-body">
                              <strong>{course.title}</strong>
                              <span className="home-dashboard-course-description">{course.description}</span>
                              {course.enrolled ? (
                                <span className="home-dashboard-progress">
                                  <span className="home-dashboard-progress-track"><span style={{ width:`${progress}%` }} /></span>
                                  <span>{progress}% complete</span>
                                </span>
                              ) : (
                                <span className="home-dashboard-course-cta">Explore course <Icon name="arrow" size={12} color={P} /></span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : dashboardLoading ? (
                    <AsyncState variant="loading" skeleton="cards" rows={2} compact title="Loading learning content" />
                  ) : dashboardLoadErrors.courses ? (
                    <AsyncState
                      variant="error"
                      compact
                      title="Learning content couldn’t load"
                      description="Please check your connection and try again."
                      action={<button type="button" onClick={() => void loadDashboardData()}>Try again</button>}
                    />
                  ) : (
                    <AsyncState
                      variant="empty"
                      icon="courses"
                      compact
                      title="Your next learning opportunity starts here"
                      description="Explore the Learning Hub to find courses and resources."
                      action={<button type="button" onClick={() => onNavigate('learning')}>Visit Learning Hub <Icon name="arrow" size={13} color={P} /></button>}
                    />
                  )}
                </section>

                <section className="home-dashboard-panel home-dashboard-events" aria-labelledby="home-dashboard-events-title">
                  <div className="home-dashboard-section-head">
                    <div>
                      <h2 id="home-dashboard-events-title">Connect with the community</h2>
                      <p>Upcoming events and live conversations.</p>
                    </div>
                    <button type="button" onClick={() => onNavigate('events')}>All events <Icon name="arrow" size={13} color={P} /></button>
                  </div>
                  <div className="home-dashboard-event-list">
                    {upcomingEvents.length > 0 ? upcomingEvents.map((event) => (
                      <button key={event.id} type="button" className="home-dashboard-event" onClick={() => onNavigate('events')}>
                        <span className="home-dashboard-event-date">
                          <strong>{new Date(event.startDate).toLocaleDateString('en', { day:'2-digit' })}</strong>
                          <small>{new Date(event.startDate).toLocaleDateString('en', { month:'short' })}</small>
                        </span>
                        <span className="home-dashboard-event-copy">
                          <strong>{event.title}</strong>
                          <small>{event.meetingPlatform || 'Community session'} · {new Date(event.startDate).toLocaleTimeString('en', { hour:'numeric', minute:'2-digit' })}</small>
                        </span>
                        <Icon name="arrow" size={13} color={T3} />
                      </button>
                    )) : dashboardLoading ? (
                      <AsyncState variant="loading" skeleton="rows" rows={2} compact title="Loading upcoming events" />
                    ) : dashboardLoadErrors.events ? (
                      <AsyncState
                        variant="error"
                        compact
                        title="Events couldn’t load"
                        description="Please check your connection and try again."
                        action={<button type="button" onClick={() => void loadDashboardData()}>Try again</button>}
                      />
                    ) : (
                      <AsyncState
                        variant="empty"
                        icon="events"
                        compact
                        title="No upcoming events right now"
                        description="New sessions are added regularly."
                        action={<button type="button" onClick={() => onNavigate('events')}>Browse events <Icon name="arrow" size={13} color={P} /></button>}
                      />
                    )}
                  </div>
                </section>

                <section className="home-dashboard-panel home-dashboard-videos" aria-labelledby="home-dashboard-videos-title">
                  <div className="home-dashboard-section-head">
                    <div>
                      <h2 id="home-dashboard-videos-title">Stories from the transition</h2>
                      <p>Short films and ideas from across the sector.</p>
                    </div>
                    <button type="button" onClick={() => onNavigate('learning')}>More to watch <Icon name="arrow" size={13} color={P} /></button>
                  </div>
                  <div className="home-dashboard-video-list">
                    {demoVideos.slice(0, 2).map((video, index) => (
                      <article key={`${video.title}-${index}`} className="home-dashboard-video">
                        <button type="button" className="home-dashboard-video-thumb" onClick={() => recordWatchedVideo(video)} aria-label={`Play ${video.title}`}>
                          {video.thumbnail && <img src={video.thumbnail} alt="" />}
                          <span><Icon name="play" size={15} color="#fff" /></span>
                        </button>
                        <div className="home-dashboard-video-copy">
                          <strong>{video.title}</strong>
                          <small>{video.tag} · {video.duration}</small>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              </div>

              <section ref={activityRef} className="home-dashboard-panel home-dashboard-activity" aria-labelledby="home-dashboard-activity-title">
                <div className="home-dashboard-section-head">
                  <div>
                    <h2 id="home-dashboard-activity-title">A pulse on the community</h2>
                    <p>Courses, events, and updates to help you stay in the loop.</p>
                  </div>
                  <button type="button" onClick={() => onNavigate('announcements')}>View updates <Icon name="arrow" size={13} color={P} /></button>
                </div>
                <div className="home-dashboard-activity-list">
                  {updatesFeed.slice(0, 4).map((item) => {
                    const itemIcon = item.kind === 'event' ? 'calendar' : item.kind === 'announcement' ? 'bell' : item.kind === 'video' ? 'play' : 'book';
                    const targetPage = item.kind === 'event' ? 'events' : item.kind === 'announcement' ? 'announcements' : 'learning';
                    return (
                      <button key={item.id} type="button" className="home-dashboard-activity-link" onClick={() => onNavigate(targetPage)}>
                        <span className={`home-dashboard-activity-icon home-dashboard-activity-icon--${item.kind}`}><Icon name={itemIcon} size={16} color={P} /></span>
                        <span className="home-dashboard-activity-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                        <span className="home-dashboard-activity-time">{item.time}</span>
                        <Icon name="arrow" size={13} color={T3} />
                      </button>
                    );
                  })}
                  {dashboardLoading && updatesFeed.length === 0 && <AsyncState variant="loading" skeleton="rows" rows={2} compact title="Loading community activity" />}
                  {!dashboardLoading && updatesFeed.length === 0 && (dashboardLoadErrors.courses || dashboardLoadErrors.events) ? (
                    <AsyncState variant="error" compact title="Community activity couldn’t load" description="Please try again in a moment." action={<button type="button" onClick={() => void loadDashboardData()}>Try again</button>} />
                  ) : null}
                  {!dashboardLoading && updatesFeed.length === 0 && !dashboardLoadErrors.courses && !dashboardLoadErrors.events && (
                    <AsyncState variant="empty" icon="default" compact title="Your community is getting started" description="New courses, events, and updates will appear here." />
                  )}
                </div>
              </section>
            </div>
          )}

          {/* ── LEARNING HUB PAGE ── */}
          {currentPage === 'learning' && (
            isAdminUser(user)
              ? <AdminLearningHub isMobile={isMobile} />
              : <LearningHub user={user} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {/* ── DUE DILIGENCE PAGE ── */}
          {currentPage === 'vault' && (
            <DueDiligencePage user={user} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {/* ── PROJECT PIPELINE PAGE ── */}
          {currentPage === 'pipeline' && (
            <ProjectPipelinePage user={user} onNavigate={onNavigate} isMobile={isMobile} isTablet={isTablet} />
          )}

          {currentPage === 'messages' && (
            <MessagingPage user={user} />
          )}

          {/* ── OFFICE HOURS & EVENTS PAGE ── */}
          {currentPage === 'events' && (
            <OfficeHoursEvents user={user} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {currentPage === 'admin-events' && (
            <AdminEventRequests user={user} isMobile={isMobile} />
          )}

          {/* ── ANNOUNCEMENTS PAGE ── */}
          {currentPage === 'announcements' && (
            <AnnouncementsPage user={user} onToggleSidebar={onToggleSidebar} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {currentPage === 'help' && (
            <HelpPage user={user} onToggleSidebar={onToggleSidebar} isMobile={isMobile} isTablet={isTablet}/>
          )}

          {/* ── PROFILE SETTINGS PAGE ── */}
          {currentPage === 'settings' && (
            <ProfileSettings user={user} avatarDataUrl={avatarDataUrl} onAvatarChange={(e) => {
              // adapter for avatar change: update local state and persist
              const file = e?.target?.files?.[0];
              const dataUrl = e?.dataUrl || null;
              if (dataUrl) {
                setAvatarDataUrl(dataUrl);
              } else if (!file) {
                setAvatarDataUrl(null);
              }
            }} onSaved={(updated) => {
              if (typeof onUpdateUser === 'function') {
                onUpdateUser(updated);
              }
            }} />
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
      {showProfileModal && (
        <div style={{ position:'fixed', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:1400 }}>
          <div onClick={() => setShowProfileModal(false)} style={{ position:'absolute', inset:0, background:'rgba(17,24,39,0.48)' }} />
          <div style={{ position:'relative', width:'min(920px, 96%)', maxHeight:'90vh', overflow:'auto', zIndex:1401 }}>
            <ProfileSettings user={user} avatarDataUrl={avatarDataUrl} onAvatarChange={(e) => {
              const dataUrl = e?.dataUrl || null;
              const file = e?.target?.files?.[0];
              if (dataUrl) setAvatarDataUrl(dataUrl);
              if (!file && dataUrl === null) setAvatarDataUrl(null);
            }} onSaved={(updated) => {
              if (typeof onUpdateUser === 'function') {
                onUpdateUser(updated);
              }
              setShowProfileModal(false);
            }} onClose={() => setShowProfileModal(false)} />
          </div>
        </div>
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
        .notification-action{background:transparent;border:0;padding:0;color:#7C3AED;font-size:0.78rem;font-weight:600;cursor:pointer;line-height:1;}
        .notification-action:hover{text-decoration:underline;color:#5B21B6;}
        .notification-list{max-height:min(360px, calc(100vh - 160px));overflow-y:auto;scrollbar-color:#CBD5E1 transparent;scrollbar-width:thin;}
        .notification-item{transition:background .2s ease;color:#111827;}
        .notification-item:hover{background:#F8FAFF;}
        .notification-item-unread{border-left:2px solid #CBD5E1;background:#FCFCFD;}
        .notification-item-read{background:transparent;}
        .notification-toast{position:fixed;top:24px;right:24px;z-index:1200;display:flex;align-items:flex-start;gap:12px;width:min(410px,calc(100vw - 32px));padding:16px 16px 15px 14px;border:1px solid rgba(226,232,240,.96);border-radius:16px;background:#FFFFFF;box-shadow:0 18px 48px rgba(15,23,42,.13),0 3px 10px rgba(15,23,42,.05);animation:notification-toast-in .3s cubic-bezier(.22,1,.36,1);}
        .notification-toast::before{content:'';position:absolute;left:-1px;top:14px;bottom:14px;width:3px;border-radius:0 4px 4px 0;background:#CBD5E1;}
        .notification-toast-icon{display:grid;place-items:center;flex:0 0 30px;width:30px;height:30px;margin-top:1px;border-radius:0;background:transparent;box-shadow:none;}
        .notification-toast-content{min-width:0;flex:1;padding-right:14px;}
        .notification-toast-label{display:flex;align-items:center;margin-bottom:5px;color:#7C3AED;font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;}
        .notification-toast-content strong{display:block;overflow:hidden;color:#172033;font-size:14px;line-height:1.35;text-overflow:ellipsis;white-space:nowrap;}
        .notification-toast-content p{display:-webkit-box;overflow:hidden;margin:5px 0 11px;color:#667085;font-size:12px;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:2;}
        .notification-toast-actions{display:flex;align-items:center;gap:12px;}
        .notification-toast-actions button{padding:0;border:0;background:transparent;color:#6D28D9;font-size:11px;font-weight:800;cursor:pointer;}
        .notification-toast-actions button:hover{text-decoration:underline;}
        .notification-toast-actions .notification-toast-dismiss{color:#667085;font-weight:600;}
        .notification-toast-close{position:absolute;top:9px;right:9px;width:24px;height:24px;padding:0;border:0;border-radius:7px;background:transparent;color:#98A2B3;font-size:18px;line-height:1;cursor:pointer;}
        .notification-toast-close:hover{background:#F2F4F7;color:#344054;}
        @keyframes notification-toast-in{from{opacity:0;transform:translate3d(20px,-10px,0) scale(.97)}to{opacity:1;transform:translate3d(0,0,0) scale(1)}}
        @media (max-width:600px){.notification-toast{top:12px;right:16px;width:calc(100vw - 32px);}.notification-toast-content strong{white-space:normal;}}
        .home-dashboard{max-width:1500px;margin:0 auto}
        .home-dashboard-hero{position:relative;display:flex;align-items:center;justify-content:space-between;gap:32px;min-height:220px;margin-bottom:25px;padding:30px 34px;overflow:hidden;border:1px solid rgba(255,255,255,.18);border-radius:20px;background:linear-gradient(112deg,#35106F 0%,#5B21B6 58%,#7C3AED 100%);box-shadow:0 18px 38px rgba(76,29,149,.2);color:#fff}
        .home-dashboard-hero::before,.home-dashboard-hero::after{position:absolute;content:'';border-radius:50%;pointer-events:none}
        .home-dashboard-hero::before{width:360px;height:360px;right:20%;top:-280px;background:rgba(255,255,255,.08)}
        .home-dashboard-hero::after{width:230px;height:230px;right:-100px;bottom:-165px;background:rgba(255,255,255,.08)}
        .home-dashboard-hero-copy{position:relative;z-index:1;min-width:0;max-width:600px}
        .home-dashboard-eyebrow{margin:0 0 10px;color:rgba(255,255,255,.72);font-size:10px;font-weight:750;letter-spacing:.13em}
        .home-dashboard-hero h1{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin:0 0 9px;color:#fff;font-size:clamp(24px,2.3vw,34px);font-weight:750;letter-spacing:-.035em;line-height:1.15}
        .home-dashboard-hero h1 img{width:25px;height:25px;object-fit:contain;animation:wave 1.4s ease-in-out infinite;transform-origin:70% 60%}
        .home-dashboard-hero-copy>p:not(.home-dashboard-eyebrow){max-width:480px;margin:0 0 20px;color:rgba(255,255,255,.82);font-size:13px;line-height:1.65}
        .home-dashboard-hero-actions{display:flex;flex-wrap:wrap;align-items:center;gap:10px}
        .home-dashboard-hero-actions button{display:inline-flex;min-height:38px;align-items:center;justify-content:center;gap:8px;padding:0 14px;border:1px solid transparent;border-radius:9px;font-size:11px;font-weight:700;cursor:pointer;transition:transform .18s ease,background .18s ease}
        .home-dashboard-hero-actions button:hover{transform:translateY(-1px)}
        .home-dashboard-primary-action{background:#fff;color:#4C1D95}
        .home-dashboard-secondary-action{border-color:rgba(255,255,255,.28)!important;background:rgba(255,255,255,.1);color:#fff}
        .home-dashboard-hero-art{position:relative;z-index:1;flex:0 0 245px;height:154px;overflow:hidden;border:1px solid rgba(255,255,255,.32);border-radius:15px;background:rgba(255,255,255,.1);box-shadow:0 16px 30px rgba(15,23,42,.2);transform:rotate(1deg)}
        .home-dashboard-hero-art img{width:100%;height:100%;object-fit:cover;opacity:.92}
        .home-dashboard-hero-orbit{position:absolute;right:-22px;bottom:-43px;width:110px;height:110px;border:13px solid rgba(255,255,255,.28);border-radius:50%}
        .home-dashboard-hero-caption{position:absolute;right:10px;bottom:10px;padding:6px 9px;border:1px solid rgba(255,255,255,.25);border-radius:7px;background:rgba(35,13,66,.58);color:#fff;font-size:9px;font-weight:650}
        .home-dashboard-shortcuts{margin-bottom:26px}
        .home-dashboard-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
        .home-dashboard-section-head h2{margin:0;color:#111827;font-size:16px;font-weight:720;letter-spacing:-.02em}
        .home-dashboard-section-head p{margin:4px 0 0;color:#6b7280;font-size:11px;line-height:1.5}
        .home-dashboard-section-head>button{display:inline-flex;align-items:center;gap:5px;flex-shrink:0;padding:6px 0;background:transparent;color:#5b21b6;font-size:11px;font-weight:680;cursor:pointer}
        .home-dashboard-section-head>button:hover{text-decoration:underline}
        .home-dashboard-shortcut-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:11px}
        .home-dashboard-shortcut{display:flex;min-width:0;min-height:76px;align-items:center;gap:11px;padding:12px;border:1px solid #e8eaf0;border-radius:13px;background:#fff;text-align:left;box-shadow:0 5px 14px rgba(15,23,42,.035);transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
        .home-dashboard-shortcut:hover{transform:translateY(-2px);border-color:#c7d2fe;box-shadow:0 10px 20px rgba(15,23,42,.08)}
        .home-dashboard-shortcut:focus-visible,.home-dashboard-section-head>button:focus-visible,.home-dashboard-activity-link:focus-visible,.home-dashboard-course-card:focus-visible,.home-dashboard-event:focus-visible,.home-dashboard-video-thumb:focus-visible{outline:2px solid #4f46e5;outline-offset:2px}
        .home-dashboard-shortcut-icon{display:grid;width:36px;height:36px;flex:0 0 36px;place-items:center;border-radius:10px;background:#f1edff;color:#5b21b6}
        .home-dashboard-shortcut-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}
        .home-dashboard-shortcut-label{overflow:hidden;width:100%;color:#1f2937;font-size:10.5px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
        .home-dashboard-shortcut-detail{overflow:hidden;color:#8b95a5;font-size:9px;line-height:1.3;text-overflow:ellipsis;white-space:nowrap}
        .home-dashboard-shortcut--blue .home-dashboard-shortcut-icon{background:#eff6ff;color:#2563eb}
        .home-dashboard-shortcut--teal .home-dashboard-shortcut-icon{background:#ecfdf5;color:#059669}
        .home-dashboard-shortcut--amber .home-dashboard-shortcut-icon{background:#fffbeb;color:#d97706}
        .home-dashboard-shortcut--rose .home-dashboard-shortcut-icon{background:#fdf2f8;color:#db2777}
        .home-dashboard-content-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(290px,1fr);align-items:start;gap:18px;margin-bottom:20px}
        .home-dashboard-panel{min-width:0;overflow:hidden;border:1px solid #e8eaf0;border-radius:15px;background:#fff;box-shadow:0 7px 20px rgba(15,23,42,.045)}
        .home-dashboard-panel>.home-dashboard-section-head{margin:0;padding:17px 18px 14px}
        .home-dashboard-course-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:0 16px 16px}
        .home-dashboard-course-card{display:flex;min-width:0;flex-direction:column;overflow:hidden;padding:0;border:1px solid #eceef3;border-radius:12px;background:#fff;text-align:left;cursor:pointer;transition:transform .18s ease,box-shadow .18s ease,border-color .18s ease}
        .home-dashboard-course-card:hover{transform:translateY(-2px);border-color:#d7cef7;box-shadow:0 10px 20px rgba(15,23,42,.08)}
        .home-dashboard-course-image{position:relative;display:grid;min-height:108px;place-items:center;overflow:hidden;background:#f1edff;color:#5b21b6}
        .home-dashboard-course-image img{position:absolute;width:100%;height:100%;object-fit:cover}
        .home-dashboard-course-category{position:absolute;left:8px;top:8px;max-width:calc(100% - 16px);overflow:hidden;padding:5px 7px;border:1px solid rgba(255,255,255,.45);border-radius:6px;background:rgba(17,24,39,.62);color:#fff;font-size:8px;font-weight:700;text-overflow:ellipsis;white-space:nowrap}
        .home-dashboard-course-body{display:flex;min-width:0;flex:1;flex-direction:column;align-items:flex-start;padding:11px}
        .home-dashboard-course-body>strong{display:-webkit-box;overflow:hidden;min-height:32px;color:#1f2937;font-size:11px;font-weight:700;line-height:1.45;-webkit-box-orient:vertical;-webkit-line-clamp:2}
        .home-dashboard-course-description{display:-webkit-box;overflow:hidden;min-height:30px;margin-top:5px;color:#7b8494;font-size:9px;line-height:1.5;-webkit-box-orient:vertical;-webkit-line-clamp:2}
        .home-dashboard-progress{display:flex;width:100%;align-items:center;gap:7px;margin-top:11px;color:#6b7280;font-size:8.5px;white-space:nowrap}
        .home-dashboard-progress-track{height:5px;flex:1;overflow:hidden;border-radius:99px;background:#eeeaf7}
        .home-dashboard-progress-track span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#5b21b6,#8b5cf6)}
        .home-dashboard-course-cta{display:flex;align-items:center;gap:5px;margin-top:11px;color:#5b21b6;font-size:9px;font-weight:700}
        .home-dashboard-empty-state{display:flex;min-height:152px;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:20px;color:#717b8b;text-align:center;font-size:10px;line-height:1.5}
        .home-dashboard-empty-state strong{color:#1f2937;font-size:11px}
        .home-dashboard-empty-icon{display:grid;width:40px;height:40px;place-items:center;border-radius:12px;background:#f1edff}
        .home-dashboard-empty-state button,.home-dashboard-event-empty button{display:inline-flex;align-items:center;gap:5px;margin-top:2px;padding:5px 0;background:transparent;color:#5b21b6;font-size:10px;font-weight:700;cursor:pointer}
        .home-dashboard-event-list{padding:0 16px 10px}
        .home-dashboard-event{display:flex;width:100%;align-items:center;gap:10px;padding:11px 2px;border:0;border-bottom:1px solid #f0f1f4;background:transparent;text-align:left;cursor:pointer}
        .home-dashboard-event:last-child{border-bottom:0}
        .home-dashboard-event:hover .home-dashboard-event-copy>strong,.home-dashboard-video:hover .home-dashboard-video-copy strong{color:#5b21b6}
        .home-dashboard-event-date{display:flex;width:39px;height:43px;flex:0 0 39px;flex-direction:column;align-items:center;justify-content:center;border-radius:9px;background:#f1edff;color:#5b21b6}
        .home-dashboard-event-date strong{font-size:14px;line-height:1.1}
        .home-dashboard-event-date small{margin-top:3px;font-size:8px;font-weight:700;text-transform:uppercase}
        .home-dashboard-event-copy,.home-dashboard-video-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}
        .home-dashboard-event-copy>strong,.home-dashboard-video-copy strong{overflow:hidden;color:#263143;font-size:10px;font-weight:680;text-overflow:ellipsis;white-space:nowrap;transition:color .15s ease}
        .home-dashboard-event-copy small,.home-dashboard-video-copy small{overflow:hidden;color:#8992a1;font-size:8.5px;text-overflow:ellipsis;white-space:nowrap}
        .home-dashboard-event-empty{display:flex;min-height:94px;flex-direction:column;align-items:center;justify-content:center;gap:5px;color:#7b8494;font-size:10px;text-align:center}
        .home-dashboard-videos{margin-top:16px}
        .home-dashboard-video-list{padding:0 16px 7px}
        .home-dashboard-video{display:flex;align-items:center;gap:10px;padding:0 0 10px}
        .home-dashboard-video+.home-dashboard-video{padding-top:10px;border-top:1px solid #f0f1f4}
        .home-dashboard-video-thumb{position:relative;display:grid;width:78px;height:48px;flex:0 0 78px;place-items:center;overflow:hidden;padding:0;border:0;border-radius:8px;background:#f1edff;cursor:pointer}
        .home-dashboard-video-thumb img{position:absolute;width:100%;height:100%;object-fit:cover}
        .home-dashboard-video-thumb>span{position:relative;display:grid;width:26px;height:26px;place-items:center;border:1px solid rgba(255,255,255,.65);border-radius:50%;background:rgba(50,20,90,.65)}
        .home-dashboard-video-copy strong{display:-webkit-box;white-space:normal;line-height:1.4;-webkit-box-orient:vertical;-webkit-line-clamp:2}
        .home-dashboard-activity{margin-bottom:12px}
        .home-dashboard-activity-list{padding:0 18px 8px}
        .home-dashboard-activity-link{display:flex;width:100%;align-items:center;gap:10px;padding:11px 0;border:0;border-top:1px solid #f0f1f4;background:transparent;text-align:left;cursor:pointer}
        .home-dashboard-activity-icon{display:grid;width:34px;height:34px;flex:0 0 34px;place-items:center;border-radius:10px;background:#f1edff}
        .home-dashboard-activity-icon--event{background:#eff6ff}
        .home-dashboard-activity-icon--announcement{background:#fff7ed}
        .home-dashboard-activity-icon--video{background:#ecfdf5}
        .home-dashboard-activity-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:4px}
        .home-dashboard-activity-copy strong{overflow:hidden;color:#263143;font-size:10px;font-weight:680;text-overflow:ellipsis;white-space:nowrap}
        .home-dashboard-activity-copy small{overflow:hidden;color:#929baa;font-size:9px;text-overflow:ellipsis;white-space:nowrap}
        .home-dashboard-activity-time{flex-shrink:0;color:#8992a1;font-size:9px;white-space:nowrap}
        @media (max-width:1100px){.home-dashboard-shortcut-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.home-dashboard-content-grid{grid-template-columns:minmax(0,1.4fr) minmax(260px,1fr)}.home-dashboard-course-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media (max-width:760px){.home-dashboard-content-grid{grid-template-columns:1fr}.home-dashboard-course-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.home-dashboard-hero-art{flex-basis:190px;height:132px}}
        @media (max-width:600px){.home-dashboard-hero{min-height:0;padding:22px;gap:15px}.home-dashboard-hero-art{flex-basis:110px;height:92px}.home-dashboard-hero-copy>p:not(.home-dashboard-eyebrow){font-size:11px}.home-dashboard-shortcut-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.home-dashboard-shortcut{min-height:68px;padding:9px}.home-dashboard-shortcut-icon{width:32px;height:32px;flex-basis:32px}.home-dashboard-course-grid{grid-template-columns:repeat(2,minmax(0,1fr));padding:0 11px 12px}.home-dashboard-panel>.home-dashboard-section-head{padding:14px 13px 11px}.home-dashboard-event-list,.home-dashboard-video-list{padding-right:12px;padding-left:12px}.home-dashboard-activity-list{padding-right:13px;padding-left:13px}}
        @media (max-width:420px){.home-dashboard-hero{align-items:flex-start;padding:18px}.home-dashboard-hero-art{flex-basis:72px;height:72px}.home-dashboard-hero-caption{right:5px;bottom:5px;padding:4px 5px;font-size:7px}.home-dashboard-hero h1{font-size:22px}.home-dashboard-hero-actions button{min-height:35px;padding:0 10px;font-size:10px}.home-dashboard-course-grid{gap:8px}.home-dashboard-course-image{min-height:86px}.home-dashboard-activity-time{font-size:8px}}
        @keyframes softDrift { 0%, 100% { transform: translate(0,0) scale(1); opacity:1; } 50% { transform: translate(6px,-4px) scale(1.01); opacity:0.94; } }
        @keyframes floatPulse { 0%, 100% { transform: translate(0,0) scale(1); opacity:1; } 30% { transform: translate(0,-4px) scale(1.04); opacity:0.88; } 60% { transform: translate(0,2px) scale(1.02); opacity:0.92; } }
        @keyframes wave { 0% { transform: rotate(0deg) scale(0.96); } 15% { transform: rotate(12deg) scale(1.04); } 30% { transform: rotate(-8deg) scale(1.02); } 45% { transform: rotate(10deg) scale(1.06); } 60% { transform: rotate(-4deg) scale(1.03); } 75% { transform: rotate(6deg) scale(1.05); } 100% { transform: rotate(0deg) scale(0.96); } }
        .topbar-avatar:hover{transform:translateY(-1px) scale(1.01); box-shadow:0 12px 24px rgba(17,24,39,0.16);}
        ::-webkit-scrollbar{width:5px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:10px;}
        ::-webkit-scrollbar-track{background:transparent;}
      `}</style>
    </div>
  );
}
