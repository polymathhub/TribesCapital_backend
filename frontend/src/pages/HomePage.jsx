import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import LearningHub from './LearningHub';
import DueDiligencePage from './DueDiligencePage';
import OfficeHoursEvents from './OfficeHoursEvents';
import AnnouncementsPage from './AnnouncementsPage';
import HelpPage from './HelpPage';
import { usersAPI, coursesAPI, eventsAPI, notificationsAPI } from '../api/endpoints';
import eventsIllustration from '../assets/illustrations/Events-rafiki.svg';
import newYorkIllustration from '../assets/illustrations/New-York-cuate.svg';
import wavingHandIllustration from '../assets/illustrations/waving-hand-skin-4-svgrepo-com.svg';
import profilePlaceholderImage from '../assets/illustrations/Artist Woman (1).png';

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

const glassCardStyle = (radius = 16, padding = '16px 18px') => ({
  background: 'linear-gradient(135deg, rgba(255,255,255,0.84) 0%, rgba(248,250,252,0.72) 100%)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.72)',
  borderRadius: radius,
  boxShadow: '0 18px 42px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.74)',
  padding,
});

/* ─── TUTORIAL STEPS ──────*/
const STEPS = [
  { id:'welcome',  target:null,       pos:'center', icon:'spark', title:'Welcome to Tribes Capital',
    desc:"You're now part of a community of 240+ clean energy investors and professionals across Africa. Let us show you around in 8 quick steps." },
  { id:'sidebar',  target:'sidebar',  pos:'right',  icon:'home', title:'Your main navigation',
    desc:'Use this sidebar to jump between Learning Hub, Due Diligence Vault, Project Pipeline, Office Hours & Events, and every other community section.' },
  { id:'banner',   target:'banner',   pos:'bottom', icon:'book', title:'Your personal home base',
    desc:"This banner shows your community at a glance — active deals, upcoming events, course progress, and live pipeline value." },
  { id:'stats',    target:'stats',    pos:'bottom', icon:'chart', title:'Track your progress',
    desc:'Four cards tracking community members, active projects, vault documents, and events this week — all updated in real time.' },
  { id:'resume',   target:'resume',   pos:'bottom', icon:'doc', title:'Pick up where you left off',
    desc:'This card shows your most recent course. Click Continue to jump straight back into your learning right where you stopped.' },
  { id:'learning', target:'learning', pos:'right',  icon:'book', title:'Continue your courses',
    desc:'All your enrolled courses live here. Track progress, access lessons, and earn certificates as you complete each module.' },
  { id:'events',   target:'events',   pos:'top',    icon:'calendar', title:'Join live sessions',
    desc:'Office Hours, workshops, and Member Circles run weekly. RSVP directly here so you never miss a live community session.' },
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
  if (typeof window === 'undefined' || !courseId) return { progress: 0, completedLessonIds: [] };
  try {
    const storedValue = window.localStorage.getItem(`${COURSE_PROGRESS_STORAGE_PREFIX}:${courseId}`);
    if (!storedValue) return { progress: 0, completedLessonIds: [] };
    const parsed = JSON.parse(storedValue);
    return {
      progress: Number(parsed?.progress || 0),
      completedLessonIds: Array.isArray(parsed?.completedLessonIds) ? parsed.completedLessonIds : [],
    };
  } catch {
    return { progress: 0, completedLessonIds: [] };
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
  const [watchedVideos, setWatchedVideos] = useState([]);
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

  const updatesFeed = useMemo(() => {
    const eventItems = (dashboardEvents || []).slice(0, 2).map((event) => ({
      id: `event-${event.id}`,
      kind: 'event',
      title: event.title,
      detail: `${event.meetingPlatform || 'Live session'} · ${new Date(event.startDate).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`,
      time: 'Upcoming',
      timestamp: new Date(event.startDate).getTime(),
    }));

    const courseItems = (dashboardCourses || []).slice(0, 2).map((course) => ({
      id: `course-${course.id}`,
      kind: 'course',
      title: course.title,
      detail: course.description || 'Recently added on the platform',
      time: 'New',
      timestamp: Date.now() - 1000,
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
      time: video.time || 'Recent',
      timestamp: video.timestamp || Date.now(),
    }));

    return [...eventItems, ...courseItems, ...announcementItems, ...videoItems]
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 6);
  }, [dashboardCourses, dashboardEvents, notifications, watchedVideos]);

  const isMountedRef = React.useRef(true);

  const loadDashboardData = React.useCallback(async () => {
    try {
      const [membersRes, coursesRes, eventsRes, enrolledRes] = await Promise.all([
        usersAPI.getAll({ skip: 0, take: 100 }).catch(() => ({ data: [] })),
        coursesAPI.list({ skip: 0, take: 8 }).catch(() => ({ data: [] })),
        eventsAPI.list({ skip: 0, take: 6 }).catch(() => ({ data: [] })),
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
          status: progress >= 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted',
        };
      });

      setMemberCount(Array.isArray(membersRes?.data) ? membersRes.data.length : 0);
      setDashboardCourses(normalizedCourses);
      setDashboardEvents(Array.isArray(eventsRes?.data) ? eventsRes.data : []);
    } catch (error) {
      if (isMountedRef.current) {
        setMemberCount(0);
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
      if (event?.detail?.type && !['saved-courses', 'course-progress'].includes(event.detail.type)) {
        return;
      }
      void loadDashboardData();
    };

    // respond to other tabs updating localStorage
    const onStorage = (e) => {
      if (!e || !e.key) return;
      const interesting = ['tribes-saved-courses', 'tribes-home-watched-videos', TOUR_VISITS_KEY];
      if (interesting.includes(e.key)) {
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
  }, [loadDashboardData]);

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

  const inProgressCourseCount = dashboardCourses.filter((course) => course.progress > 0 && course.progress < 100).length;
  const completedCourseCount = dashboardCourses.filter((course) => course.progress >= 100).length;

  const heroChips = [
    `${inProgressCourseCount} in-progress ${inProgressCourseCount === 1 ? 'course' : 'courses'}`,
    `${completedCourseCount} completed ${completedCourseCount === 1 ? 'course' : 'courses'}`,
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
    { title: 'How Clean Energy Is Transforming Schools & Communities in Africa', duration: '1 min', tag: 'Demo lesson', videoId: 'wMQDsjS9WC4', thumbnail: getVisualThumbnail('wMQDsjS9WC4', null) },
    { title: 'Hospitals Are Going Dark in Africa — Tribes Capital is Fixing It', duration: '31 sec', tag: 'Live recap', videoId: 'Jdmt9BaYHnw', thumbnail: getVisualThumbnail('Jdmt9BaYHnw', null) },
    { title: 'How Clean Energy Powers Africa', duration: '45 sec', tag: 'Quick watch', videoId: 'DnjMO5L5QgI', thumbnail: getVisualThumbnail('DnjMO5L5QgI', null) },
  ];

  const buildYouTubeEmbedUrl = (videoId) => `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&modestbranding=1&controls=1&rel=0&fs=1`;

  const statCards = [
    { label: 'Community members', value: memberCount || 0, badge: 'Updated' },
    { label: 'In progress', value: inProgressCourseCount, badge: 'Momentum' },
    { label: 'Completed', value: completedCourseCount, badge: 'Done' },
    { label: 'Upcoming sessions', value: dashboardEvents.length, badge: 'This week' },
  ];

  const latestCourses = dashboardCourses.slice(0, 3);
  const upcomingEvents = dashboardEvents.slice(0, 3);
  const recommendedNextStep = useMemo(() => {
    if (dashboardEvents.length > 0) {
      const event = dashboardEvents[0];
      return {
        type: 'event',
        title: event.title || 'Upcoming session',
        subtitle: event.description || 'Join the next live session and stay close to the community.',
        actionLabel: 'Join event',
        actionTarget: 'events',
      };
    }
    if (dashboardCourses.length > 0) {
      const course = dashboardCourses[0];
      return {
        type: 'course',
        title: course.title || 'Continue learning',
        subtitle: course.description || 'Pick up the next lesson and keep momentum going.',
        actionLabel: 'Open learning',
        actionTarget: 'learning',
      };
    }
    return {
      type: 'general',
      title: 'Explore the platform',
      subtitle: 'Browse courses, events, and announcements to build momentum.',
      actionLabel: 'Open hub',
      actionTarget: 'learning',
    };
  }, [dashboardCourses, dashboardEvents]);

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
          <div title={displayName} className="topbar-avatar" style={{ width:46, height:46, borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'1.5px solid rgba(255,255,255,0.95)', boxShadow:'0 10px 24px rgba(17,24,39,0.16)', background:'transparent', display:'flex', alignItems:'center', justifyContent:'center', padding:0, transition:'transform .2s ease, box-shadow .2s ease' }}>
            <img src={profilePlaceholderImage} alt={`${displayName} avatar`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          </div>
        </div>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div style={{ flex:1, minHeight:0, overflowY:'auto', WebkitOverflowScrolling:'touch', padding:isMobile?'16px 14px 60px':'24px 28px 60px' }}>

          {/* ── HOME PAGE ── */}
          {currentPage === 'home' && (
          <>
          <div ref={bannerRef} className="soft-card" style={{
            background:'linear-gradient(135deg, #140A2E 0%, #24105A 34%, #46208D 70%, #6D28D9 100%)',
            borderRadius:20, padding:isMobile?'16px 16px':'22px 24px', marginBottom:20,
            display:'flex', flexDirection:isMobile?'column':'row',
            justifyContent:'space-between', alignItems:isMobile?'flex-start':'center', gap:isMobile?14:18,
            boxShadow:'0 24px 60px rgba(76,29,149,0.28), inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -12px 24px rgba(15,23,42,0.16)',
            position:'relative', overflow:'hidden', minHeight:isMobile?'260px':'290px',
          }}>
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(circle at top right, rgba(255,255,255,0.14), transparent 36%), radial-gradient(circle at bottom left, rgba(255,255,255,0.08), transparent 34%)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', top:'-36px', right:'-24px', width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.10)', filter:'blur(2px)', pointerEvents:'none' }} />
            <div style={{ position:'absolute', bottom:'-48px', left:'-20px', width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.06)', filter:'blur(2px)', pointerEvents:'none' }} />
            <div style={{ minWidth:0, width:'100%', position:'relative', zIndex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <p style={{ color:'rgba(255,255,255,.9)', fontSize:10, fontWeight:800, letterSpacing:1.35,
                textTransform:'uppercase', margin:'0 0 6px', textShadow:'0 2px 8px rgba(0,0,0,0.22)' }}>WELCOME</p>
              <h1 style={{ color:W, fontSize:isMobile?18:24, fontWeight:800, margin:'0 0 8px', letterSpacing:-.5, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', lineHeight:1.14, textShadow:'0 3px 10px rgba(0,0,0,0.2)' }}>
                <span>{greeting}, {displayName}</span>
                <img src={wavingHandIllustration} alt="" width="22" height="22" aria-hidden="true" style={{ flexShrink:0, animation:'wave 1.2s ease-in-out infinite', transformOrigin:'70% 60%' }} />
              </h1>
              <p style={{ color:'rgba(255,255,255,.9)', fontSize:isMobile?11:12.5, margin:'0 0 12px', maxWidth:470, lineHeight:isMobile?1.5:1.6, textShadow:'0 1px 6px rgba(0,0,0,0.18)' }}>
                Welcome to Tribes Capital, your home for clean energy learning, live sessions, and the momentum behind every next move.
              </p>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {heroChips.map((chip) => (
                  <div key={chip} style={{ background:'rgba(255,255,255,.16)', border:'1px solid rgba(255,255,255,.24)',
                    borderRadius:999, padding:'4px 10px', fontSize:11, fontWeight:600, color:W, whiteSpace:'nowrap' }}>
                    {chip}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position:'relative', flexShrink:0, width:isMobile?'100%':'220px', maxWidth:isMobile?320:220, minHeight:isMobile?'140px':'180px', display:'flex', alignItems:'center', justifyContent:'center', marginTop:isMobile?6:0, alignSelf:isMobile?'stretch':'auto', padding:isMobile?'4px 0':'0' }}>
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
                    boxShadow:'inset 0 1px 0 rgba(255,255,255,0.24), inset 0 -8px 16px rgba(15,23,42,0.16), 0 10px 24px rgba(15,23,42,0.12)',
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
            ...glassCardStyle(14, '18px 20px'),
            marginBottom:24, display:'flex', flexDirection:isMobile?'column':'row',
            alignItems:isMobile?'flex-start':'center', gap:isMobile?10:16,
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
                {dashboardCourses[0]?.description || 'Open the learning hub to explore the latest contents.'}
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
              <div style={{ ...glassCardStyle(14, isMobile ? '12px' : '16px'), marginBottom: 16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10, gap:8, flexWrap:'wrap' }}>
                  <h2 style={{ fontSize:isMobile?14:16, fontWeight:600, color:T1, margin:0 }}>Updates</h2>
                  <button onClick={() => onNavigate('events')} style={{ fontSize:isMobile?12:13, color:P, background:'transparent', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>See what’s next</button>
                </div>
                {updatesFeed.length > 0 ? updatesFeed.map((item, index, arr) => {
                  const icon = item.kind === 'event' ? 'calendar' : item.kind === 'announcement' ? 'bell' : item.kind === 'video' ? 'play' : 'spark';
                  return (
                    <div key={item.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 0', borderBottom:index < arr.length - 1 ? `1px solid ${BD}` : 'none' }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:PF, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                        <Icon name={icon} size={15} color={P}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:12, fontWeight:600, color:T1, marginBottom:2 }}>{item.title}</div>
                        <div style={{ fontSize:11, color:T2, lineHeight:1.4 }}>{item.detail}</div>
                      </div>
                      <span style={{ fontSize:11, color:P, fontWeight:600, flexShrink:0, marginTop:2 }}>{item.time}</span>
                    </div>
                  );
                }) : (
                  <div style={{ fontSize:13, color:T2, padding:'4px 0' }}>No updates yet. New events, announcements, and watched videos will appear here.</div>
                )}
              </div>

              <div style={{ ...glassCardStyle(16, isMobile ? '14px' : '16px 18px'), marginBottom:16 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap', marginBottom:10 }}>
                  <div>
                    <div style={{ fontSize:10, fontWeight:700, color:P, letterSpacing:1.1, textTransform:'uppercase', marginBottom:4 }}>Recommended next step</div>
                    <div style={{ fontSize:15, fontWeight:700, color:T1 }}>{recommendedNextStep.title}</div>
                  </div>
                  <button onClick={() => onNavigate(recommendedNextStep.actionTarget)} style={{ fontSize:12, color:P, background:'transparent', border:'none', cursor:'pointer', fontWeight:600, whiteSpace:'nowrap' }}>{recommendedNextStep.actionLabel}</button>
                </div>
                <div style={{ fontSize:13, color:T2, lineHeight:1.5, marginBottom:12 }}>{recommendedNextStep.subtitle}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <button onClick={() => onNavigate('learning')} style={{ ...btnStyle('none', 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)', W, 12), padding:'8px 12px', borderRadius:8, fontWeight:600 }}>Continue learning</button>
                  <button onClick={() => onNavigate('events')} style={{ ...btnStyle(`1px solid ${BD}`, W, T2, 12), padding:'8px 12px', borderRadius:8, fontWeight:600 }}>View events</button>
                  <button onClick={() => onNavigate('announcements')} style={{ ...btnStyle(`1px solid ${BD}`, W, T2, 12), padding:'8px 12px', borderRadius:8, fontWeight:600 }}>See updates</button>
                </div>
              </div>

              {/* Learning section */}
              <div ref={learningRef}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isMobile?10:14, gap:8, flexWrap:'wrap' }}>
                  <h2 style={{ fontSize:isMobile?14:16, fontWeight:600, color:T1, margin:0 }}>Learning</h2>
                  <button onClick={() => onNavigate('learning')} style={{ fontSize:isMobile?12:13, color:P, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                    Go to Learning Hub <Icon name="arrow" size={13} color={P}/>
                  </button>
                </div>
                {dashboardLoading ? (
                  <div style={{ display:'grid', gap:12 }}>
                    <LoadingCard isMobile={isMobile} />
                    <LoadingCard isMobile={isMobile} compact />
                  </div>
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
                    onPlay={() => recordWatchedVideo({ title: course.title, duration: course.duration || 'Self-paced', tag: course.category || 'Course video', videoId: course.videoId, thumbnail: course.thumbnail })}
                  />
                )) : (
                  <div style={{ ...glassCardStyle(14, '16px'), color:T2 }}>
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:10, fontWeight:700, color:P, letterSpacing:1.1, textTransform:'uppercase', marginBottom:6 }}>Next up</div>
                        <div style={{ fontSize:15, fontWeight:700, color:T1, marginBottom:6 }}>Your learning hub is ready for deeper insight</div>
                        <p style={{ margin:0, fontSize:13, color:T2, lineHeight:1.55 }}>Explore curated deal briefings, live member sessions, and practical toolkits designed for modern clean-energy operators.</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:12 }}>
                      {['Investment briefings','Live office hours','Practical toolkits'].map((chip) => (
                        <span key={chip} style={{ background:'#F8FAFC', border:'1px solid #E5E7EB', borderRadius:999, padding:'6px 10px', fontSize:11, fontWeight:600, color:T2 }}>{chip}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Events section */}
              <div ref={eventsRef} style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isMobile?10:14, gap:8, flexWrap:'wrap' }}>
                  <h2 style={{ fontSize:isMobile?14:16, fontWeight:600, color:T1, margin:0 }}>
                    Upcoming events <span style={{ fontSize:isMobile?12:13, color:T3, fontWeight:400 }}>({dashboardEvents.length})</span>
                  </h2>
                  <button onClick={() => onNavigate('events')} style={{ fontSize:isMobile?12:13, color:P, background:'transparent', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:4, whiteSpace:'nowrap' }}>
                    View all <Icon name="arrow" size={13} color={P}/>
                  </button>
                </div>
                <div style={{ ...glassCardStyle(14), overflow:'hidden' }}>
                  {dashboardLoading ? (
                    <div style={{ padding:'12px 14px', display:'grid', gap:10 }}>
                      <LoadingCard isMobile={isMobile} compact />
                      <LoadingCard isMobile={isMobile} compact />
                    </div>
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
                    <div style={{ padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12, textAlign:'center', color:T2 }}>
                      <img src={eventsIllustration} alt="Illustration for the home page events empty state" style={{ width:'min(100%, 170px)', maxWidth:170, height:'auto', display:'block' }} />
                      <div style={{ maxWidth:320 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:T1, marginBottom:6 }}>No upcoming sessions yet</div>
                        <p style={{ margin:0, fontSize:12.5, color:T2, lineHeight:1.55 }}>New community sessions and office hours will appear here as they’re published.</p>
                      </div>
                    </div>
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
                <div style={{ marginBottom:12, display:'flex', justifyContent:'center', width:'100%' }}>
                  <img src={newYorkIllustration} alt="Recently added illustration" style={{ width:'100%', maxWidth:320, height:'auto', display:'block' }} />
                </div>
                {latestCourses.length > 0 ? (
                  <div>
                    {latestCourses.map((course, index, arr) => (
                      <div key={course.id} style={{ display:'flex', alignItems:'center', gap:isMobile?7:10, padding:isMobile?'8px 10px':'11px 14px',
                        borderBottom:index<arr.length-1?`1px solid ${BD}`:'none', width:'100%' }}>
                        <div style={{ width:isMobile?28:32, height:isMobile?28:32, background:PF, borderRadius:7, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?12:14 }}>📘</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:isMobile?10.5:12, fontWeight:500, color:T1, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{course.title}</p>
                          <p style={{ fontSize:isMobile?9:10, color:T3, margin:0, lineHeight:1.3 }}>{course.description || 'Published course'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {/* Demo videos */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:isMobile?8:12, gap:8, flexWrap:'wrap' }}>
                  <h3 style={{ fontSize:isMobile?12.5:14, fontWeight:600, color:T1, margin:0 }}>Videos</h3>
                  <button onClick={() => onNavigate('learning')} style={{ fontSize:isMobile?11:12, color:P, background:'transparent', border:'none', cursor:'pointer', whiteSpace:'nowrap' }}>Watch more</button>
                </div>
                <div style={{ ...glassCardStyle(14), overflow:'hidden' }}>
                  <div style={{ display:isMobile ? 'grid' : 'block', gridTemplateColumns:isMobile ? 'repeat(2, minmax(0, 1fr))' : undefined, gap:isMobile ? 8 : 0, padding:isMobile ? 8 : 0 }}>
                    {demoVideos.map((video, index) => (
                      <div key={`${video.title}-${index}`} style={{ display:'flex', flexDirection:'column', gap:8, padding:isMobile?'10px':'12px 14px', borderBottom:isMobile? 'none' : index < demoVideos.length - 1 ? `1px solid ${BD}` : 'none', width:'100%', background:isMobile ? 'rgba(255,255,255,0.7)' : 'transparent', borderRadius:isMobile ? 10 : 0 }}>
                        <div style={{ width:'100%', aspectRatio:'16 / 9', borderRadius:10, background:PF, display:'flex', alignItems:'center', justifyContent:'center', fontSize:isMobile?13:16, flexShrink:0, overflow:'hidden', position:'relative' }}>
                          {video.thumbnail ? (
                            <img src={video.thumbnail} alt={video.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                          ) : (
                            <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:18, height:18 }}>
                              <Icon name="play" size={12} color={P}/>
                            </span>
                          )}
                        </div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:isMobile?10.5:12, fontWeight:600, color:T1, margin:'0 0 1px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{video.title}</p>
                          <p style={{ fontSize:isMobile?9:11, color:T3, margin:'0 0 8px', lineHeight:1.3 }}>{video.tag} · {video.duration}</p>
                          <button
                            type="button"
                            onClick={() => recordWatchedVideo(video)}
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
                <div style={{ ...glassCardStyle(14), overflow:'hidden' }}>
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
                    <div style={{ padding:'12px 14px', color:T2, lineHeight:1.55 }}>No new updates yet. Join a session or watch a lesson to start building your activity stream.</div>
                  )}
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 12px' }}>Recent activity</h3>
                <div style={{ ...glassCardStyle(14), overflow:'hidden' }}>
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
                    <div style={{ padding:'12px 14px', color:T2, lineHeight:1.55 }}>No recent activity yet. Your most recent events and lesson activity will appear here.</div>
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
