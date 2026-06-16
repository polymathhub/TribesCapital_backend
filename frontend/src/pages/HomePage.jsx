import React, { useState, useRef, useEffect, useCallback } from "react";
import LearningHub from './LearningHub';
import DueDiligencePage from './DueDiligencePage';
import OfficeHoursEvents from './OfficeHoursEvents';
import AnnouncementsPage from './AnnouncementsPage';
import HelpPage from './HelpPage';
import { NAV_ITEMS } from '../constants/navigation';

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

/* ─── TUTORIAL STEPS ────────────────────────────────── */
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
  return (
    <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, marginBottom:12, overflow:'hidden' }}>
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
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:160, height:4, background:'#F3F4F6', borderRadius:4 }}>
                <div style={{ width:`${pct}%`, height:4, background: catColor === GR ? GR : P, borderRadius:4 }}/>
              </div>
              <span style={{ fontSize:12, color:T2 }}>{pct}% complete</span>
            </div>
            <button style={{ ...btnStyle('none', P, W, 13), padding:'8px 16px', borderRadius:8, fontWeight:500 }}>
              {btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── MAIN APP ───────────────────────────────────────── */
export default function HomePage({ user, currentPage = 'home', onNavigate = () => {}, onLogout = () => {}, onToggleSidebar = () => {}, isMobile = false, isTablet = false }) {
  const [tourStep,   setTourStep]   = useState(0);
  const [tourActive, setTourActive] = useState(true);
  const [spotlight,  setSpotlight]  = useState(null);
  const [tipPos,     setTipPos]     = useState({ top:'50%', left:'50%', transform:'translate(-50%,-50%)' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isOverlay = isMobile || isTablet;

  /* Section refs */
  const sidebarRef  = useRef(null);
  const bannerRef   = useRef(null);
  const statsRef    = useRef(null);
  const resumeRef   = useRef(null);
  const learningRef = useRef(null);
  const eventsRef   = useRef(null);
  const REFS = { sidebar:sidebarRef, banner:bannerRef, stats:statsRef, resume:resumeRef, learning:learningRef, events:eventsRef };

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

  /* ── RENDER ── */
  return (
    <div style={{ display:'flex', height:'100vh', background:BG, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize:14, overflow:'hidden' }}>

      {/* ══ SIDEBAR BACKDROP (mobile/tablet) ══ */}
      {isOverlay && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position:'fixed', inset:0, background:'rgba(0,0,0,.45)', zIndex:200,
        }}/>
      )}

      {/* ══ SIDEBAR ══ */}
      <div ref={sidebarRef} style={{
        width:200, minWidth:200, background:W, borderRight:`1px solid ${BD}`,
        display:'flex', flexDirection:'column', overflowY:'auto', flexShrink:0,
        ...(isOverlay ? {
          position:'fixed', top:0, left:0, height:'100%', zIndex:201,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-200px)',
          transition:'transform .25s ease',
          boxShadow: sidebarOpen ? '4px 0 24px rgba(0,0,0,.2)' : 'none',
        } : { height:'100%', zIndex:5 }),
      }}>
        {/* Logo */}
        <div style={{ padding:'16px 16px 14px', borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', justifyContent:'space-between', gap:10, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:26, height:26, background:P, borderRadius:'50%', flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg viewBox="0 0 14 14" width={13} height={13}><circle cx="7" cy="7" r="5" stroke="white" strokeWidth="1.2" fill="none"/><path d="M4.5 7h5M7 4.5v5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
            </div>
            <span style={{ fontWeight:700, fontSize:11, color:T1, letterSpacing:.8, textTransform:'uppercase' }}>Tribes Capital</span>
          </div>
          {isOverlay && (
            <button onClick={() => setSidebarOpen(false)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, color:T2, display:'flex', alignItems:'center' }}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke={T2} strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>
        {/* Nav items */}
        <div style={{ flex:1, padding:'8px 0' }}>
          {NAV_ITEMS.map((item, i) => {
            if (!item) return <div key={`divider-${i}`} style={{ height:1, background:BD, margin:'6px 14px' }}/>;
            const isActive = currentPage === item.key;
            return (
              <div key={item.id} 
                onClick={() => onNavigate(item.key)}
                style={{
                  display:'flex', alignItems:'center', gap:9,
                  padding:'8px 14px', margin:'1px 6px', borderRadius:8, cursor:'pointer',
                  background: isActive ? PF : 'transparent',
                  color:      isActive ? P  : T2,
                  fontWeight: isActive ? 500 : 400,
                  fontSize:   13,
                  borderLeft: isActive ? `3px solid ${P}` : '3px solid transparent',
                  transition:'all .15s',
                }}>
                <Icon name={item.icon} size={15} color={isActive ? P : T3}/>
                <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ MAIN AREA ══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>

        {/* TOPBAR */}
        <div style={{
          height:54, background:W, borderBottom:`1px solid ${BD}`,
          display:'flex', alignItems:'center', padding:`0 ${isMobile?14:24}px`, gap:12,
          flexShrink:0, justifyContent:'space-between',
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, flex:1, minWidth:0 }}>
            {/* Hamburger — mobile/tablet */}
            {isOverlay && (
              <button onClick={() => setSidebarOpen(true)} style={{ background:'none', border:'none', cursor:'pointer', padding:4, display:'flex', alignItems:'center', flexShrink:0 }}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke={T1} strokeWidth="2" strokeLinecap="round">
                  <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
            )}
            {/* Search — full on desktop, icon-only on mobile */}
            {!isMobile ? (
              <div style={{ flex:1, maxWidth:400, background:BG, border:`1px solid ${BD}`, borderRadius:8,
                height:36, display:'flex', alignItems:'center', gap:8, padding:'0 12px' }}>
                <Icon name="search" size={14} color={T3}/>
                <span style={{ fontSize:13, color:T3, whiteSpace:'nowrap', overflow:'hidden' }}>Search topics, documents, people, events…</span>
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
            <div style={{ width:34, height:34, border:`1px solid ${BD}`, borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative', flexShrink:0 }}>
              <Icon name="bell2" size={16} color={T2}/>
              <div style={{ width:7, height:7, background:'#EF4444', borderRadius:'50%', border:'1.5px solid #fff',
                position:'absolute', top:6, right:6 }}/>
            </div>
            <div style={{ width:34, height:34, background:P, borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center', color:W, fontSize:12, fontWeight:600, flexShrink:0 }}>
              A
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{ flex:1, overflowY:'auto', padding:isMobile?'16px 14px 60px':'24px 28px 60px' }}>

          {/* ── HOME PAGE ── */}
          {currentPage === 'home' && (
          <>
          <div ref={bannerRef} style={{
            background:`linear-gradient(135deg, ${PD} 0%, ${P} 55%, ${PL} 100%)`,
            borderRadius:16, padding:isMobile?'20px 18px':'26px 32px', marginBottom:20,
            display:'flex', flexDirection:isMobile?'column':'row',
            justifyContent:'space-between', alignItems:isMobile?'flex-start':'center', gap:isMobile?16:24,
          }}>
            <div style={{ minWidth:0 }}>
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:10, fontWeight:600, letterSpacing:1.2,
                textTransform:'uppercase', margin:'0 0 8px' }}>WELCOME BACK</p>
              <h1 style={{ color:W, fontSize:isMobile?20:26, fontWeight:700, margin:'0 0 8px', letterSpacing:-.5 }}>
                Good morning, Ali 👋
              </h1>
              <p style={{ color:'rgba(255,255,255,.8)', fontSize:13, margin:'0 0 16px', maxWidth:400, lineHeight:1.6 }}>
                You're part of a community of 240+ clean energy investors across Africa.
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {['3 deals in due diligence','2 events this week','62% course complete'].map(chip=>(
                  <div key={chip} style={{ background:'rgba(255,255,255,.16)', border:'1px solid rgba(255,255,255,.25)',
                    borderRadius:20, padding:'5px 13px', fontSize:12, fontWeight:500, color:W, whiteSpace:'nowrap' }}>
                    {chip}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, flexShrink:0, width:isMobile?'100%':'auto' }}>
              {[['240','Members'],['12','Live Projects'],['48','Docs'],['$124M','Pipeline']].map(([v,l])=>(
                <div key={l} style={{ background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.18)',
                  borderRadius:10, padding:isMobile?'10px 14px':'12px 18px', textAlign:'center', minWidth:isMobile?0:90 }}>
                  <div style={{ fontSize:isMobile?17:20, fontWeight:700, color:W, letterSpacing:-.5 }}>{v}</div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,.7)', marginTop:2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div ref={statsRef} style={{ display:'grid', gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)', gap:isMobile?10:16, marginBottom:20 }}>
            {[
              { l:'Community members', v:'240', badge:'3 in progress', bc:P,   bb:PF  },
              { l:'Active projects',   v:'12',  badge:'Well done',      bc:GR,  bb:GRB },
              { l:'Vault docs',        v:'48',  badge:'This month',     bc:TL,  bb:TLB },
              { l:'Events',            v:'8',   badge:'This week',      bc:AM,  bb:AMB },
            ].map(s=>(
              <div key={s.l} style={{ background:W, border:`1px solid ${BD}`, borderRadius:10, padding:'16px 20px' }}>
                <p style={{ fontSize:12, color:T2, margin:'0 0 6px' }}>{s.l}</p>
                <p style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 8px', letterSpacing:-.8 }}>{s.v}</p>
                <span style={{ background:s.bb, color:s.bc, fontSize:11, fontWeight:500, padding:'2px 10px', borderRadius:20 }}>
                  {s.badge}
                </span>
              </div>
            ))}
          </div>

          {/* ── RESUME CARD ── */}
          <div ref={resumeRef} style={{
            background:W, border:`1px solid ${BD}`, borderRadius:12, padding:'16px 20px',
            marginBottom:24, display:'flex', flexDirection:isMobile?'column':'row',
            alignItems:isMobile?'flex-start':'center', gap:isMobile?10:16,
          }}>
            <div style={{ width:44, minWidth:44, height:52, background:PF, borderRadius:8,
              display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Icon name="doc" size={20} color={P}/>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:15, fontWeight:600, color:T1, margin:'0 0 4px', lineHeight:1.3 }}>
                Understanding Clean Energy Ownership Structures
              </p>
              <p style={{ fontSize:13, color:T2, margin:0 }}>
                Last viewed 2 days ago · Module 4 of 7: Legal Frameworks
              </p>
            </div>
            <button style={{ ...btnStyle('none', P, W, 13), padding:'10px 20px', borderRadius:8, fontWeight:500,
              flexShrink:0, whiteSpace:'nowrap', width:isMobile?'100%':'auto' }}>
              Continue
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
                  <a href="#" style={{ fontSize:13, color:P, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                    Go to Learning Hub <Icon name="arrow" size={13} color={P}/>
                  </a>
                </div>
                <CourseCard cat="PROJECT FINANCE — MODULE 4" title="Understanding Clean Energy Ownership Structures" meta="Lesson 6 of 10 · 38 min · Certificate" pct={62} btn="Continue lesson"/>
                <CourseCard cat="PROJECT FINANCE — MODULE 4" title="Understanding Clean Energy Ownership Structures" meta="Lesson 6 of 10 · 38 min · Certificate" pct={3}  btn="Continue lesson"/>
              </div>

              {/* Events section */}
              <div ref={eventsRef} style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:16, fontWeight:600, color:T1, margin:0 }}>
                    Upcoming events <span style={{ fontSize:13, color:T3, fontWeight:400 }}>(8)</span>
                  </h2>
                  <a href="#" style={{ fontSize:13, color:P, textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
                    View all <Icon name="arrow" size={13} color={P}/>
                  </a>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {[
                    { mo:'JUN',dy:'5', dw:'THU',type:'OFFICE HOURS',title:'Project Finance Deep Dive: Structuring Your First Deal',    meta:'3:00 PM GMT · Kwame Asante · 14 spots left', rv:false,tc:BLU,tb:BLB },
                    { mo:'JUN',dy:'10',dw:'TUE',type:'WORKSHOP',    title:'Building a 1MW Financial Model from Scratch',               meta:'2:00 PM GMT · Ngozi Fakoya · 2h session',      rv:true, tc:GR, tb:GRB },
                    { mo:'JUN',dy:'17',dw:'TUE',type:'MEMBER CIRCLE',title:'West Africa Energy Deal Flow — June Roundtable',          meta:'4:00 PM GMT · Members only · 30 spots',        rv:false,tc:P,  tb:PF  },
                  ].map((ev,i,arr)=>(
                    <div key={i} style={{ display:'flex', alignItems:isMobile?'flex-start':'center', gap:14, padding:'14px 18px',
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none', flexWrap:isMobile?'wrap':'nowrap' }}>
                      {/* Date box */}
                      <div style={{ width:46, minWidth:46, background:ev.tb, borderRadius:8,
                        textAlign:'center', padding:'7px 4px' }}>
                        <div style={{ fontSize:9, fontWeight:700, color:ev.tc, letterSpacing:.5, textTransform:'uppercase' }}>{ev.mo}</div>
                        <div style={{ fontSize:20, fontWeight:700, color:ev.tc, lineHeight:1.1 }}>{ev.dy}</div>
                        <div style={{ fontSize:9, color:ev.tc, fontWeight:500 }}>{ev.dw}</div>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <span style={{ background:ev.tb, color:ev.tc, fontSize:9, fontWeight:700,
                          padding:'2px 7px', borderRadius:4, textTransform:'uppercase', letterSpacing:.4 }}>
                          {ev.type}
                        </span>
                        <p style={{ fontSize:13, fontWeight:600, color:T1, margin:'4px 0 3px', lineHeight:1.3 }}>{ev.title}</p>
                        <p style={{ fontSize:11, color:T2, margin:0 }}>{ev.meta}</p>
                      </div>
                      <button style={{
                        ...btnStyle(ev.rv?`1px solid ${GR}`:'none', ev.rv?GRB:P, ev.rv?GR:W, 12),
                        padding:'7px 14px', borderRadius:7, fontWeight:500, flexShrink:0,
                        marginTop:isMobile?4:0,
                      }}>{ev.rv?'✓ RSVPed':'RSVP'}</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

              {/* Recently added */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:0 }}>Recently added</h3>
                  <a href="#" style={{ fontSize:12, color:P, textDecoration:'none' }}>Open vault</a>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {[
                    { bg:'#FEE2E2',em:'📄',nm:'Investment Framework Template Q1 2026',mt:'PDF · v2.1 · 2 days ago' },
                    { bg:'#D1FAE5',em:'📊',nm:'Investment Framework Template Q1 2026',mt:'PDF · v2.1 · 2 days ago' },
                    { bg:'#DBEAFE',em:'📝',nm:'Investment Framework Template Q1 2026',mt:'PDF · v2.1 · 2 days ago' },
                  ].map((d,i,arr)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none' }}>
                      <div style={{ width:32, height:32, background:d.bg, borderRadius:7, flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{d.em}</div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:T1, margin:'0 0 2px',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.nm}</p>
                        <p style={{ fontSize:10, color:T3, margin:0 }}>{d.mt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Announcements */}
              <div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:0 }}>Announcements</h3>
                  <a href="#" style={{ fontSize:12, color:P, textDecoration:'none' }}>View all</a>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {[
                    { dot:GR, nm:'Project Financing Deep Dive', dt:'Thu, May 8 · 3:00 PM GMT' },
                    { dot:P,  nm:'Project Financing Deep Dive', dt:'Thu, May 8 · 3:00 PM GMT' },
                    { dot:AM, nm:'Project Financing Deep Dive', dt:'Thu, May 8 · 3:00 PM GMT' },
                  ].map((a,i,arr)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none' }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:a.dot, flexShrink:0 }}/>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:T1, margin:'0 0 2px' }}>{a.nm}</p>
                        <p style={{ fontSize:11, color:T3, margin:0 }}>{a.dt}</p>
                      </div>
                      <span style={{ background:PF, color:P, fontSize:11, fontWeight:500,
                        padding:'2px 9px', borderRadius:6, flexShrink:0 }}>RSVPed</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent activity */}
              <div>
                <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 12px' }}>Recent activity</h3>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {[
                    { bg:PF, col:P,  nm:'Kwame Asante',  role:'Lead Investment Analyst', stat:'8 sessions' },
                    { bg:GRB,col:GR, nm:'Ngozi Fakoya',  role:'ESG & Policy Lead',        stat:'8 sessions' },
                    { bg:AMB,col:AM, nm:'Bola Oladele',  role:'Risk & FX Specialist',     stat:'8 sessions' },
                  ].map((p,i,arr)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none' }}>
                      <div style={{ width:30, height:30, borderRadius:'50%', background:p.bg, flexShrink:0,
                        display:'flex', alignItems:'center', justifyContent:'center' }}>
                        <div style={{ width:9, height:9, borderRadius:'50%', background:p.col }}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:12, fontWeight:500, color:T1, margin:'0 0 2px' }}>{p.nm}</p>
                        <p style={{ fontSize:11, color:T3, margin:0 }}>{p.role}</p>
                      </div>
                      <span style={{ fontSize:12, color:P, fontWeight:500, flexShrink:0 }}>{p.stat}</span>
                    </div>
                  ))}
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
      </div>

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
