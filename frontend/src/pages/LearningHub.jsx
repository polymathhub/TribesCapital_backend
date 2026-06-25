import React, { useState, useEffect } from "react";
import { coursesAPI, lessonsAPI, usersAPI } from '../api/endpoints';
import apiClient from '../api/client';

/* ═══════════════════════════════════════════════════════
   BREAKPOINT HOOK — tracks viewport width live
═══════════════════════════════════════════════════════ */
function useBreakpoint() {
  const getW = () => (typeof window !== 'undefined' ? window.innerWidth : 1280);
  const [w, setW] = useState(getW);
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { w, isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024 };
}

/* ═══════════════════════════════════════════════════════
   TOKENS — exact from design
═══════════════════════════════════════════════════════ */
const PU='#5B21B6', PUF='#EDE9FE', PUL='#7C3AED', PUD='#4C1D95';
const GR='#16A34A', GRB='#DCFCE7', AM='#D97706', AMB='#FEF3C7';
const TL='#0D9488', TLB='#CCFBF1';
const T1='#111827', T2='#6B7280', T3='#9CA3AF';
const BD='#E5E7EB', BG='#F9FAFB', W='#FFFFFF';

const CAT = {
  'Energy Finance':  { c:'#EA580C', b:'#FFF7ED' },
  'Solar & Storage': { c:'#0D9488', b:'#F0FDFA' },
  'Risk & FX':       { c:'#7C3AED', b:'#F5F3FF' },
  'Policy & ESG':    { c:'#16A34A', b:'#F0FDF4' },
};

/* ═══════════════════════════════════════════════════════
   ICONS — exact Feather SVG paths matching the design
═══════════════════════════════════════════════════════ */
const PATHS = {
  home:       <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
  book:       <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="12" y1="6" x2="17" y2="6"/><line x1="12" y1="10" x2="17" y2="10"/></>,
  folder:     <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>,
  activity:   <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>,
  fileText:   <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></>,
  calendar:   <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  users:      <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  monitor:    <><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
  globe:      <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z"/></>,
  bell:       <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  help:       <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  search:     <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  clock:      <><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></>,
  file:       <><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="13,2 13,8 20,8"/></>,
  grid:       <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  list:       <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  chevDown:   <polyline points="6,9 12,15 18,9"/>,
  check:      <polyline points="20,6 9,17 4,12"/>,
  x:          <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  bookmark:   <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>,
  share:      <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></>,
  link:       <><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></>,
  mail:       <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
  play:       <polygon points="5,3 19,12 5,21"/>,
  volume:     <><polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/></>,
  maximize:   <path d="M8 3H5a2 2 0 00-2 2v3m18 0V5a2 2 0 00-2-2h-3m0 18h3a2 2 0 002-2v-3M3 16v3a2 2 0 002 2h3"/>,
  minimize:   <path d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"/>,
  checkSq:    <><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></>,
  arrow:      <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></>,
  msgCircle:  <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  briefcase:  <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></>,
};

function Ico({ name, size=16, color=T2, sw=1.5, fill='none' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {PATHS[name]}
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════
   DATA
═══════════════════════════════════════════════════════ */
const LESSONS = [
  { id:1, title:'Introduction to energy ownership', dur:'18 min' },
  { id:2, title:'Types of project structures',      dur:'22 min' },
  { id:3, title:'SPV and holding companies',        dur:'30 min' },
  { id:4, title:'Legal frameworks explained',       dur:'28 min' },
  { id:5, title:'Tax equity structures',            dur:'28 min' },
  { id:6, title:'Revenue sharing models',           dur:'28 min' },
  { id:7, title:'Exit strategies & liquidity',      dur:'28 min' },
];

const PATH_STEPS = [
  {n:1,label:'Energy Basics'},{n:2,label:'Project Finance'},
  {n:3,label:'Due Diligence'},{n:4,label:'Deal Structuring'},
];

const NAV_ITEMS = [
  {label:'Home',                    icon:'home'},
  {label:'Learning Hub',            icon:'book', active:true},
  {label:'Due Diligence Vault',     icon:'folder'},
  {label:'Project Pipeline',        icon:'activity'},
  {label:'Reporting Library',       icon:'fileText'},
  {label:'Office Hours & Events',   icon:'calendar'},
  null,
  {label:'Member Circles',          icon:'users'},
  {label:'Toolkits & Templates',    icon:'monitor'},
  {label:'Partner Marketplace',     icon:'globe'},
  null,
  {label:'Announcements & Feedback',icon:'bell'},
  {label:'Help',                    icon:'help'},
];

function buildYouTubeEmbedUrl(videoId) {
  return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&modestbranding=1&controls=1&rel=0&fs=1`;
}

function buildYouTubeThumbnailUrl(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

/* ═══════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════ */
function Sidebar({ open, onClose, isMobile, isTablet }) {
  const isOverlay = isMobile || isTablet;
  if (isOverlay && !open) return null;
  return (
    <>
      {isOverlay && (
        <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200}}/>
      )}
      <aside style={{
        width:200, minWidth:200, height:'100%', background:W,
        borderRight:`1px solid ${BD}`, display:'flex', flexDirection:'column',
        overflowY:'auto', flexShrink:0,
        ...(isOverlay ? { position:'fixed', top:0, left:0, zIndex:201, boxShadow:'4px 0 24px rgba(0,0,0,.18)' } : {}),
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,padding:'14px 16px',borderBottom:`1px solid ${BD}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:28,height:28,background:PU,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round">
                <circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>
              </svg>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:T1,letterSpacing:.9,textTransform:'uppercase'}}>Tribes Capital</span>
          </div>
          {isOverlay && (
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',color:T2}}>
              <Ico name="x" size={16} color={T2} sw={2}/>
            </button>
          )}
        </div>
        <nav style={{flex:1,padding:'6px 0'}}>
          {NAV_ITEMS.map((item,i) => {
            if (!item) return <div key={i} style={{height:1,background:BD,margin:'4px 14px'}}/>;
            return (
              <div key={i} onClick={isOverlay ? onClose : undefined}
                style={{display:'flex',alignItems:'center',gap:9,padding:'8px 14px',margin:'1px 6px',borderRadius:8,cursor:'pointer',background:item.active?PUF:'transparent',color:item.active?PU:T2,fontSize:13,fontWeight:item.active?500:400,borderLeft:item.active?`3px solid ${PU}`:'3px solid transparent'}}>
                <Ico name={item.icon} size={15} color={item.active?PU:T3} sw={item.active?2:1.5}/>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   TOPBARS
═══════════════════════════════════════════════════════ */
function HubTopBar({ onMenuToggle, isMobile, isTablet }) {
  const showHamburger = isMobile || isTablet;
  return (
    <header style={{height:54,background:W,borderBottom:`1px solid ${BD}`,display:'flex',alignItems:'center',padding:`0 ${isMobile?14:24}px`,justifyContent:'space-between',flexShrink:0,gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
        {showHamburger && (
          <button onClick={onMenuToggle} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',flexShrink:0}}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth={2} strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        {!isMobile ? (
          <div style={{flex:1,maxWidth:400,background:BG,border:`1px solid ${BD}`,borderRadius:8,height:36,display:'flex',alignItems:'center',gap:8,padding:'0 12px'}}>
            <Ico name="search" size={14} color={T3} sw={1.5}/>
            <span style={{fontSize:13,color:T3,whiteSpace:'nowrap',overflow:'hidden'}}>Search topics, documents, people, events…</span>
          </div>
        ) : (
          <span style={{fontSize:14,fontWeight:600,color:T1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Learning Hub</span>
        )}
      </div>
    </header>
  );
}

function PlayerTopBar({ onBack, onMenuToggle, isMobile, isTablet }) {
  const showHamburger = isMobile || isTablet;
  return (
    <header style={{height:54,background:W,borderBottom:`1px solid ${BD}`,display:'flex',alignItems:'center',padding:`0 ${isMobile?14:24}px`,justifyContent:'space-between',flexShrink:0,gap:12}}>
      <div style={{display:'flex',alignItems:'center',gap:isMobile?8:6,fontSize:13,flex:1,minWidth:0}}>
        {showHamburger && (
          <button onClick={onMenuToggle} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',flexShrink:0}}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={T1} strokeWidth={2} strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
        )}
        <span onClick={onBack} style={{color:PU,cursor:'pointer',flexShrink:0,fontWeight:500}}>
          {isMobile ? '← Hub' : 'Learning Hub'}
        </span>
        {!isMobile && <Ico name="arrow" size={13} color={T3} sw={1.5}/>}
        {!isMobile && <span style={{color:T1,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Understanding Clean Energy Ownership Structures</span>}
        {isMobile && <span style={{color:T1,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:13}}>Clean Energy Ownership</span>}
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════
   COURSE CARD — grid view, exact design
═══════════════════════════════════════════════════════ */
function CourseCard({ course, onAction, onOpenModal }) {
  const [progOpen, setProgOpen] = useState(false);
  const cs    = CAT[course.cat] || { c:T2, b:BG };
  const inProg = course.status === 'inProgress';
  const done   = course.status === 'completed';
  const notSt  = course.status === 'notStarted';
  const btnLbl = done ? 'Review' : inProg ? 'Resume' : 'Start';
  const lessonsDone = done ? course.lessons : inProg ? Math.round(course.lessons * course.progress / 100) : 0;

  return (
    <div
      onClick={() => onOpenModal(course)}
      style={{background:W,border:`1px solid ${BD}`,borderRadius:12,overflow:'hidden',display:'flex',flexDirection:'column',cursor:'pointer',transition:'box-shadow .15s'}}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.08)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}
    >
      {/* Gray image placeholder */}
      <div style={{height:175,background:'#D1D5DB',flexShrink:0}}/>

      <div style={{padding:'14px 16px 16px',display:'flex',flexDirection:'column',gap:0}}>
        {/* Category */}
        <span style={{fontSize:11,fontWeight:700,color:cs.c,display:'block',marginBottom:6,letterSpacing:.3}}>{course.cat}</span>
        {/* Title */}
        <h3 style={{fontSize:14,fontWeight:700,color:T1,margin:'0 0 8px',lineHeight:1.4}}>{course.title}</h3>
        {/* Description — 3-line clamp */}
        <p style={{fontSize:12,color:T2,margin:'0 0 14px',lineHeight:1.65,minHeight:58,display:'-webkit-box',WebkitLineClamp:3,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{course.desc}</p>
        {/* Meta row */}
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14,flexWrap:'wrap'}}>
          <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:T2}}><Ico name="clock" size={12} color={T3} sw={1.5}/>{course.dur}</span>
          <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:T2}}><Ico name="file" size={12} color={T3} sw={1.5}/>{course.lessons} lessons</span>
          <span style={{fontSize:12,color:T2}}>{course.level}</span>
        </div>

        {/* ── PROGRESS BAR — only rendered for in-progress and completed (matches design exactly) ── */}
        {(inProg || done) && (
          <div style={{position:'relative',marginBottom:10}}>
            {/* Clickable track opens lesson dropdown */}
            <div
              onClick={e => { e.stopPropagation(); setProgOpen(o => !o); }}
              style={{cursor:'pointer'}}
            >
              <div style={{height:4,background:'#F3F4F6',borderRadius:4}}>
                <div style={{
                  height:4,
                  width:`${course.progress}%`,
                  background: done ? GR : PU,
                  borderRadius:4,
                  transition:'width .3s ease',
                }}/>
              </div>
            </div>

            {/* Lesson breakdown dropdown */}
            {progOpen && (
              <>
                <div style={{position:'fixed',inset:0,zIndex:49}} onClick={e=>{e.stopPropagation();setProgOpen(false);}}/>
                <div style={{position:'absolute',bottom:'calc(100% + 10px)',left:0,right:0,background:W,border:`1px solid ${BD}`,borderRadius:12,boxShadow:'0 8px 28px rgba(0,0,0,.14)',zIndex:50,overflow:'hidden',minWidth:240}}>
                  <div style={{padding:'11px 14px',borderBottom:`1px solid ${BD}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span style={{fontSize:12,fontWeight:600,color:T1}}>Course progress</span>
                    <span style={{fontSize:12,fontWeight:600,color:done?GR:PU}}>{course.progress}%</span>
                  </div>
                  <div style={{padding:'10px 14px 6px'}}>
                    <div style={{height:4,background:'#F3F4F6',borderRadius:4}}>
                      <div style={{height:4,width:`${course.progress}%`,background:done?GR:PU,borderRadius:4}}/>
                    </div>
                    <div style={{fontSize:11,color:T3,marginTop:5}}>{lessonsDone} of {course.lessons} lessons complete</div>
                  </div>
                  {LESSONS.map((l,i) => {
                    const lDone = i < lessonsDone;
                    return (
                      <div key={l.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 14px',borderTop:`1px solid ${BD}`}}>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          {lDone
                            ? <div style={{width:16,height:16,borderRadius:'50%',background:done?GRB:PUF,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Ico name="check" size={10} color={done?GR:PU} sw={2.5}/></div>
                            : <div style={{width:16,height:16,borderRadius:'50%',border:`1.5px solid ${BD}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:9,color:T3}}>{l.id}</div>
                          }
                          <span style={{fontSize:12,color:lDone?T1:T3}}>{l.title}</span>
                        </div>
                        <span style={{fontSize:11,color:T3,flexShrink:0,marginLeft:8}}>{l.dur}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* Bottom row — status label + action button */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          {/* Status text — clicking progress text also toggles the dropdown for in-prog/done */}
          <span
            onClick={e => { e.stopPropagation(); if (inProg || done) setProgOpen(o => !o); }}
            style={{
              fontSize:12,
              color: done ? GR : T2,           // gray for in-progress, green for completed
              cursor: inProg||done ? 'pointer' : 'default',
            }}
          >
            {inProg ? `${course.progress}% complete` : done ? 'Completed' : 'Not started'}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onAction(course); }}
            style={{background:W,color:T1,border:`1px solid ${BD}`,borderRadius:7,padding:'6px 14px',fontSize:13,fontWeight:400,cursor:'pointer'}}
          >{btnLbl}</button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COURSE TABLE — list / tabular view (Image 4)
   Columns: Course | Category | Level | Duration | Progress | Status | (action)
═══════════════════════════════════════════════════════ */
function CourseTable({ courses, onOpenModal }) {
  return (
    <div>
      <div style={{background:W,border:`1px solid ${BD}`,borderRadius:12,overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse'}}>
          <thead>
            <tr style={{background:BG}}>
              {['Course','Category','Level','Duration','Progress','Status',''].map((h,i) => (
                <th key={i} style={{padding:'12px 16px',fontSize:12,fontWeight:500,color:T2,textAlign:'left',borderBottom:`1px solid ${BD}`,whiteSpace:'nowrap'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {courses.map((c, i) => {
              const done   = c.status === 'completed';
              const inProg = c.status === 'inProgress';
              const btnLbl = done ? 'Review' : inProg ? 'Resume' : 'Start';
              return (
                <tr key={c.id}
                  style={{borderBottom: i < courses.length-1 ? `1px solid ${BD}` : 'none', cursor:'pointer'}}
                  onClick={() => onOpenModal(c)}
                >
                  {/* Course */}
                  <td style={{padding:'14px 16px',minWidth:260}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:10}}>
                      <div style={{width:32,height:38,background:PUF,borderRadius:6,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1}}>
                        <Ico name="file" size={16} color={PU} sw={1.5}/>
                      </div>
                      <div>
                        <div style={{fontSize:13,fontWeight:500,color:T1,lineHeight:1.35,marginBottom:3}}>{c.title}</div>
                        <div style={{fontSize:12,color:T3}}>{c.lessons} lessons</div>
                      </div>
                    </div>
                  </td>
                  {/* Category — outlined pill */}
                  <td style={{padding:'14px 16px'}}>
                    <span style={{display:'inline-block',padding:'3px 10px',borderRadius:20,border:`1px solid ${BD}`,fontSize:12,color:T2,whiteSpace:'nowrap'}}>{c.cat}</span>
                  </td>
                  {/* Level */}
                  <td style={{padding:'14px 16px',fontSize:13,color:T2,whiteSpace:'nowrap'}}>{c.level}</td>
                  {/* Duration */}
                  <td style={{padding:'14px 16px',fontSize:13,color:T2,whiteSpace:'nowrap'}}>{c.dur}</td>
                  {/* Progress */}
                  <td style={{padding:'14px 16px',minWidth:140}}>
                    <div style={{fontSize:12,color:done?GR:T2,marginBottom:5}}>
                      {done ? 'Completed' : `${c.progress}% complete`}
                    </div>
                    <div style={{height:4,background:'#F3F4F6',borderRadius:4}}>
                      <div style={{height:4,width:`${c.progress}%`,background:done?GR:PU,borderRadius:4}}/>
                    </div>
                  </td>
                  {/* Status — colored outlined pill */}
                  <td style={{padding:'14px 16px'}}>
                    <span style={{display:'inline-block',padding:'4px 11px',borderRadius:20,border:`1.5px solid ${done?GR:PU}`,fontSize:12,fontWeight:500,color:done?GR:PU,whiteSpace:'nowrap'}}>
                      {done ? 'Completed' : inProg ? 'In progress' : 'Not started'}
                    </span>
                  </td>
                  {/* Action */}
                  <td style={{padding:'14px 16px'}}>
                    <button onClick={e=>e.stopPropagation()} style={{background:W,color:T1,border:`1px solid ${BD}`,borderRadius:7,padding:'6px 14px',fontSize:12,fontWeight:400,cursor:'pointer',whiteSpace:'nowrap'}}>
                      {btnLbl}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Pagination — exact from Image 4 */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:16,padding:'0 2px'}}>
        <span style={{fontSize:13,color:T2}}>Showing 1-10 of 20,584</span>
        <div style={{display:'flex',alignItems:'center',gap:2}}>
          {[1,2,3,'…',20584].map((p,i) => (
            <button key={i} style={{minWidth:32,height:32,borderRadius:7,border:'none',cursor:'pointer',fontSize:13,background:p===1?PU:'transparent',color:p===1?W:T2,fontWeight:p===1?500:400}}>
              {p}
            </button>
          ))}
          <button style={{width:32,height:32,borderRadius:7,border:'none',cursor:'pointer',background:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Ico name="arrow" size={14} color={T2}/>
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   COURSE MODAL — right slide panel (Image 5)
═══════════════════════════════════════════════════════ */
function CourseModal({ course, onClose, onContinue, isMobile }) {
  if (!course) return null;
  const cs = CAT[course.cat] || { c:T2, b:BG };
  const modalW = isMobile ? '100%' : 420;
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.28)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:modalW,height:'100%',background:W,zIndex:101,display:'flex',flexDirection:'column',boxShadow:'-4px 0 32px rgba(0,0,0,.14)',overflowY:'auto'}}>
        {/* Close */}
        <div style={{display:'flex',justifyContent:'flex-end',padding:'16px 20px 0'}}>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${BD}`,background:W,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <Ico name="x" size={14} color={T2} sw={2}/>
          </button>
        </div>
        {/* Header */}
        <div style={{padding:'12px 24px 20px',borderBottom:`1px solid ${BD}`}}>
          <span style={{fontSize:11,fontWeight:700,color:cs.c,display:'block',marginBottom:6,letterSpacing:.3}}>{course.cat}</span>
          <h2 style={{fontSize:16,fontWeight:700,color:T1,margin:'0 0 8px',lineHeight:1.4}}>{course.title}</h2>
          <p style={{fontSize:13,color:T2,margin:'0 0 20px',lineHeight:1.65}}>{course.desc}</p>
          {/* 4 stat boxes */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:8}}>
            {[{v:'7',l:'Lessons'},{v:'3h 20m',l:'Duration'},{v:'Beginner',l:'Level'},{v:`${course.progress}%`,l:'Progress'}].map(s => (
              <div key={s.l} style={{border:`1px solid ${BD}`,borderRadius:8,padding:'10px 6px',textAlign:'center'}}>
                <div style={{fontSize:13,fontWeight:700,color:T1,marginBottom:2}}>{s.v}</div>
                <div style={{fontSize:10,color:T3}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Lesson list */}
        <div style={{flex:1,overflowY:'auto',padding:'8px 24px 16px'}}>
          {LESSONS.map(l => (
            <div key={l.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 0',borderBottom:`1px solid ${BD}`}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <Ico name="check" size={15} color={PU} sw={2.5}/>
                <span style={{fontSize:13,color:T1}}>{l.title}</span>
              </div>
              <span style={{fontSize:12,color:T3,flexShrink:0,marginLeft:8}}>{l.dur}</span>
            </div>
          ))}
        </div>
        {/* Continue button */}
        <div style={{padding:'16px 24px',borderTop:`1px solid ${BD}`,flexShrink:0}}>
          <button onClick={onContinue} style={{width:'100%',background:PU,color:W,border:'none',borderRadius:10,padding:'14px',fontSize:14,fontWeight:600,cursor:'pointer'}}>
            Continue
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════
   LESSON PLAYER — real lesson-driven course flow
═══════════════════════════════════════════════════════ */
function LessonPlayer({ course, onBack, isMobile, isTablet, onMenuToggle }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [bkMsg, setBkMsg] = useState(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(true);
  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [videoEmbedUrl, setVideoEmbedUrl] = useState('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(course?.thumbnail || '');
  const [videoReady, setVideoReady] = useState(false);
  const [isVideoVisible, setIsVideoVisible] = useState(false);

  const fallbackLessonCount = Math.max(1, Math.min(4, Number(course?.lessons) || 4));
  const fallbackLessons = Array.from({ length: fallbackLessonCount }, (_, index) => ({
    id: `${course?.id || 'course'}-${index + 1}`,
    title: index === 0 ? `${course?.title || 'Course'} overview` : `${course?.title || 'Course'} lesson ${index + 1}`,
    description: index === 0 ? 'Start with the overview to understand the course.' : 'Continue through the lesson flow.',
    duration: `${Math.max(8, 10 + index * 4)} min`,
    order: index + 1,
    videoId: course?.videoId || 'aqz-KE-bpKQ',
  }));

  const lessonItems = lessons.length ? lessons : fallbackLessons;
  const activeLesson = lessonItems[activeLessonIndex] || lessonItems[0];
  const lessonCount = lessonItems.length || 1;
  const completedCount = completedLessonIds.length;
  const progress = lessonCount > 0 ? Math.round((completedCount / lessonCount) * 100) : 0;
  const currentLessonNumber = Math.min(activeLessonIndex + 1, lessonCount);
  const selectedVideoId = activeLesson?.videoId || course?.videoId || 'aqz-KE-bpKQ';
  const isCompleted = progress >= 100;

  function handleBookmark() {
    const next = !bookmarked;
    setBookmarked(next);
    setBkMsg(next ? 'Bookmarked' : 'Unbookmarked');
    setTimeout(() => setBkMsg(null), 2000);
  }

  function handleCopyLink() {
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2800);
  }

  async function handleCompleteLesson(lesson) {
    if (!lesson || completedLessonIds.includes(lesson.id)) return;
    try {
      await lessonsAPI.markComplete(lesson.id);
      setCompletedLessonIds((prev) => [...prev, lesson.id]);
      if (activeLessonIndex < lessonItems.length - 1) {
        setActiveLessonIndex((prev) => Math.min(prev + 1, lessonItems.length - 1));
      }
    } catch (error) {
      setCompletedLessonIds((prev) => (prev.includes(lesson.id) ? prev : [...prev, lesson.id]));
    }
  }

  function handleStartCourse() {
    setActiveLessonIndex(0);
    setIsVideoVisible(true);
  }

  function handleContinue() {
    const nextIndex = lessonItems.findIndex((lesson, index) => index > activeLessonIndex && !completedLessonIds.includes(lesson.id));
    setActiveLessonIndex(nextIndex >= 0 ? nextIndex : Math.min(activeLessonIndex + 1, lessonItems.length - 1));
    setIsVideoVisible(true);
  }

  async function handleReview() {
    if (!lessonItems.length) return;
    for (const lesson of lessonItems) {
      try {
        await lessonsAPI.markComplete(lesson.id);
      } catch (error) {
        // ignore and keep UI consistent
      }
    }
    setCompletedLessonIds(lessonItems.map((lesson) => lesson.id));
  }

  useEffect(() => {
    let isMounted = true;
    const fallbackEmbedUrl = buildYouTubeEmbedUrl(selectedVideoId);

    const loadVideo = async () => {
      try {
        const response = await lessonsAPI.getYouTubeProxy(selectedVideoId);
        const embedUrl = response?.data?.embedUrls?.[0] || fallbackEmbedUrl;
        if (isMounted) {
          setVideoEmbedUrl(embedUrl);
          setVideoPreviewUrl(course?.thumbnail || buildYouTubeThumbnailUrl(selectedVideoId));
          setVideoReady(false);
        }
      } catch (error) {
        if (isMounted) {
          setVideoEmbedUrl(fallbackEmbedUrl);
          setVideoPreviewUrl(course?.thumbnail || buildYouTubeThumbnailUrl(selectedVideoId));
          setVideoReady(false);
        }
      }
    };

    loadVideo();
    lessonsAPI.trackWatch({
      videoId: selectedVideoId,
      courseId: String(course?.id || '1'),
      lessonId: activeLesson?.id || '1',
      watchDuration: 0,
      totalDuration: 0,
      percentageWatched: 0,
      isCompleted: false,
    }).catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [course?.id, course?.thumbnail, selectedVideoId, activeLesson?.id]);

  useEffect(() => {
    let isMounted = true;
    const loadLessons = async () => {
      if (!course?.id) {
        setLessons([]);
        setLoadingLessons(false);
        return;
      }

      try {
        setLoadingLessons(true);
        const response = await lessonsAPI.getByCourse(course.id);
        const normalized = (response?.data || []).map((lesson, index) => ({
          id: lesson.id,
          title: lesson.title || `Lesson ${index + 1}`,
          description: lesson.description || 'Continue learning with this lesson.',
          duration: lesson.duration ? `${Math.max(1, Math.round(lesson.duration / 60))} min` : `${Math.max(8, 10 + index * 4)} min`,
          order: lesson.order || index + 1,
          videoId: lesson.videoId || course?.videoId || 'aqz-KE-bpKQ',
        }));
        if (isMounted) {
          setLessons(normalized.length ? normalized : fallbackLessons);
        }
      } catch (error) {
        if (isMounted) {
          setLessons(fallbackLessons);
        }
      } finally {
        if (isMounted) {
          setLoadingLessons(false);
        }
      }
    };

    loadLessons();
    return () => {
      isMounted = false;
    };
  }, [course?.id, course?.title, course?.lessons]);

  useEffect(() => {
    if (!lessonItems.length) return;
    if (activeLessonIndex >= lessonItems.length) {
      setActiveLessonIndex(lessonItems.length - 1);
    }
  }, [activeLessonIndex, lessonItems.length]);

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
      <PlayerTopBar onBack={onBack} onMenuToggle={onMenuToggle} isMobile={isMobile} isTablet={isTablet}/>
      <div style={{flex:1,overflowY:'auto',background:BG}}>

        {/* ── Course info bar ── */}
        <div style={{background:W,border:`1px solid ${BD}`,borderRadius:12,margin:isMobile?'14px 14px 14px':'20px 24px 20px',padding:isMobile?'14px':'16px 20px',display:'flex',flexDirection:isMobile?'column':'row',alignItems:isMobile?'flex-start':'center',gap:isMobile?10:14}}>
          <div style={{width:40,height:48,background:PUF,borderRadius:7,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
            <Ico name="file" size={18} color={PU} sw={1.5}/>
          </div>
          <div style={{flex:1,minWidth:0,width:isMobile?'100%':'auto'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6}}>
              <span style={{fontSize:isMobile?13:15,fontWeight:600,color:T1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'70%'}}>{course.title}</span>
              <span style={{fontSize:13,color:progress>0?PU:T3,flexShrink:0,marginLeft:12}}>{progress}% complete</span>
            </div>
            <div style={{height:4,background:'#F3F4F6',borderRadius:4,marginBottom:7}}>
              <div style={{height:4,width:`${progress}%`,background:PU,borderRadius:4,transition:'width .35s ease'}}/>
            </div>
            <span style={{fontSize:12,color:T3}}>{`${course.cat || 'General'} · ${course.level || 'Beginner'} · ${lessonCount} lessons · ${course.dur || 'Self-paced'}`}</span>
          </div>
          <div style={{display:'flex',gap:8,flexShrink:0,width:isMobile?'100%':'auto'}}>
            <div style={{position:'relative',flex:isMobile?1:0}}>
              <button onClick={handleBookmark} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 14px',border:`1px solid ${BD}`,borderRadius:8,background:W,color:T2,fontSize:13,cursor:'pointer',width:isMobile?'100%':'auto',whiteSpace:'nowrap'}}>
                <Ico name="bookmark" size={15} color={bookmarked?PU:T2} fill={bookmarked?PU:'none'} sw={1.5}/>
                {bookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              {bkMsg && (
                <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,background:T1,color:W,fontSize:12,fontWeight:500,padding:'7px 13px',borderRadius:8,whiteSpace:'nowrap',zIndex:20,boxShadow:'0 4px 14px rgba(0,0,0,.18)'}}>
                  {bkMsg}
                </div>
              )}
            </div>
            <div style={{position:'relative',flex:isMobile?1:0}}>
              <button onClick={() => { setShareOpen(o=>!o); if(shareOpen) setLinkCopied(false); }}
                style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 14px',border:`1px solid ${BD}`,borderRadius:8,background:W,color:T2,fontSize:13,cursor:'pointer',width:isMobile?'100%':'auto',whiteSpace:'nowrap'}}>
                <Ico name="share" size={15} color={T2} sw={1.5}/>
                Share
              </button>
              {shareOpen && (
                <>
                  <div style={{position:'fixed',inset:0,zIndex:9}} onClick={()=>{setShareOpen(false);setLinkCopied(false);}}/>
                  <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:224,background:W,border:`1px solid ${BD}`,borderRadius:12,boxShadow:'0 8px 28px rgba(0,0,0,.13)',zIndex:10,overflow:'hidden'}}>
                    <div style={{padding:'13px 16px',fontSize:13,fontWeight:600,color:T1,borderBottom:`1px solid ${BD}`}}>Share this course</div>
                    <div onClick={handleCopyLink} style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:10,fontSize:13,cursor:'pointer',borderBottom:`1px solid ${BD}`,color:linkCopied?GR:T1,background:linkCopied?GRB:W}}>
                      <Ico name="check" size={15} color={linkCopied?GR:T2} sw={2} style={{visibility:linkCopied?'visible':'hidden'}}/>
                      {linkCopied ? 'Link copied to clipboard!' : (
                        <span style={{display:'flex',alignItems:'center',gap:10,color:T1}}>
                          <Ico name="link" size={15} color={T2} sw={1.5}/>
                          Copy link
                        </span>
                      )}
                    </div>
                    {[{label:'Share on WhatsApp', iconEl:<div style={{width:20,height:20,borderRadius:'50%',background:'#25D366',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><Ico name="msgCircle" size={11} color={W} sw={1.5}/></div>},{label:'Share on LinkedIn', iconEl:<div style={{width:20,height:20,borderRadius:3,background:'#0A66C2',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><span style={{color:W,fontSize:9,fontWeight:700}}>in</span></div>},{label:'Send via mail', iconEl:<Ico name="mail" size={17} color={T2} sw={1.5}/>},].map(s => (
                      <div key={s.label} style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:10,fontSize:13,color:T1,cursor:'pointer',borderBottom:`1px solid ${BD}`}}>
                        {s.iconEl}
                        {s.label}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:isMobile||isTablet?'column':'row',gap:20,padding:isMobile?'0 14px 20px':'0 24px 20px',alignItems:'flex-start'}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{borderRadius:14,overflow:'hidden',background:'#0f172a',position:'relative',aspectRatio:'16/9',width:'100%',maxWidth:'100%',border:'1px solid rgba(255,255,255,0.08)',boxShadow:'0 18px 40px rgba(0,0,0,.18)'}}>
              {!isVideoVisible ? (
                <div onClick={() => setIsVideoVisible(true)} style={{ position:'absolute', inset:0, backgroundImage:`url(${videoPreviewUrl})`, backgroundSize:'cover', backgroundPosition:'center', cursor:'pointer' }}>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(145deg, rgba(17,24,39,0.28) 0%, rgba(17,24,39,0.56) 100%)' }} />
                  <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', zIndex:2 }}>
                    <div style={{ padding:'10px 16px', borderRadius:999, background:'rgba(17,24,39,0.72)', color:W, fontSize:13, fontWeight:600, backdropFilter:'blur(12px)' }}>
                      {loadingLessons ? 'Preparing lesson flow…' : 'Open lesson'}
                    </div>
                  </div>
                </div>
              ) : videoEmbedUrl ? (
                <iframe title="Learning lesson" src={videoEmbedUrl} style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:0 }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" onLoad={() => setVideoReady(true)} />
              ) : (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(145deg, #111827 0%, #1f2937 100%)', color:W }}>
                  <div style={{ fontSize:14, fontWeight:600 }}>Loading video…</div>
                </div>
              )}
              <div style={{position:'absolute',top:14,left:14,background:PU,color:W,fontSize:12,fontWeight:600,padding:'4px 10px',borderRadius:6,zIndex:3}}>
                Lesson {currentLessonNumber} of {lessonCount}
              </div>
              <div style={{position:'absolute',top:14,right:14,background:'rgba(255,255,255,0.16)',color:W,fontSize:11,fontWeight:600,padding:'4px 10px',borderRadius:999,zIndex:3,backdropFilter:'blur(8px)'}}>
                YouTube • Live lesson
              </div>
              {!videoReady && isVideoVisible && videoEmbedUrl && (
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(15, 23, 42, 0.35)', pointerEvents:'none' }}>
                  <div style={{ color:W, fontSize:13, fontWeight:600, padding:'8px 12px', borderRadius:999, background:'rgba(0,0,0,0.45)' }}>Preparing player…</div>
                </div>
              )}
            </div>

            {isCompleted && (
              <div style={{display:'flex',alignItems:'center',gap:12,padding:'14px 18px',background:'#F0FDF4',border:`1px solid ${GR}`,borderRadius:10,margin:'16px 0'}}>
                <div style={{width:28,height:28,background:GR,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                  <Ico name="check" size={14} color={W} sw={2.5}/>
                </div>
                <div>
                  <div style={{fontSize:14,fontWeight:700,color:GR}}>You completed this course</div>
                  <div style={{fontSize:12,color:GR}}>All available lessons are now marked complete · {course.dur || 'Self-paced'} total learning time</div>
                </div>
              </div>
            )}

            <div style={{marginTop:16}}>
              <span style={{fontSize:12,fontWeight:700,color:CAT[course.cat] ? CAT[course.cat].c : PU,display:'block',marginBottom:8}}>{course.cat || 'General'}</span>
              <h2 style={{fontSize:16,fontWeight:700,color:T1,margin:'0 0 8px'}}>{activeLesson?.title || course.title}</h2>
              <p style={{fontSize:13,color:T2,lineHeight:1.7,margin:'0 0 16px'}}>{activeLesson?.description || course.desc || 'Continue your learning with this course.'}</p>
              <div style={{border:`1px solid ${BD}`,borderRadius:10,padding:'16px 18px'}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
                  <Ico name="checkSq" size={16} color={T2} sw={1.5}/>
                  <span style={{fontSize:14,fontWeight:600,color:T1}}>Current lesson</span>
                </div>
                <div style={{fontSize:13,color:T2,lineHeight:1.6}}>
                  {loadingLessons ? 'Loading course lessons…' : `${activeLesson?.title || 'Lesson'} · ${activeLesson?.duration || 'Self-paced'}${completedLessonIds.includes(activeLesson?.id) ? ' · completed' : ''}`}
                </div>
              </div>
            </div>
          </div>

          {!expanded && (
            <div style={{width:isMobile||isTablet?'100%':238,flexShrink:0,background:W,border:`1px solid ${BD}`,borderRadius:12,overflow:'hidden',position:isMobile||isTablet?'relative':'sticky',top:16}}>
              <div style={{padding:'16px 16px 12px'}}>
                <h3 style={{fontSize:13,fontWeight:700,color:T1,margin:'0 0 12px',lineHeight:1.35}}>{course.title}</h3>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                  <div style={{flex:1,height:4,background:'#F3F4F6',borderRadius:4}}>
                    <div style={{height:4,width:`${progress}%`,background:PU,borderRadius:4,transition:'width .35s'}}/>
                  </div>
                  <span style={{fontSize:12,color:T2,flexShrink:0}}>{progress}%</span>
                </div>
                <p style={{fontSize:12,color:T3,margin:0}}>{completedCount} of {lessonCount} lessons complete</p>
              </div>
              <div>
                {lessonItems.map((l, index) => {
                  const done = completedLessonIds.includes(l.id);
                  const active = activeLessonIndex === index;
                  return (
                    <div key={l.id} onClick={() => { setActiveLessonIndex(index); setIsVideoVisible(true); }} style={{padding:'10px 16px',borderTop:`1px solid ${BD}`,cursor:'pointer',background:active?PUF:'transparent'}}>
                      <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                        {done ? (
                          <Ico name="check" size={14} color={PU} sw={2.5}/>
                        ) : (
                          <span style={{width:18,height:18,borderRadius:'50%',border:`1.5px solid ${active?PU:BD}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,color:active?PU:T3,flexShrink:0,lineHeight:1}}>{index + 1}</span>
                        )}
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{fontSize:12,color:active||done?T1:T2,lineHeight:1.35,marginBottom:2}}>{l.title}</div>
                          <div style={{fontSize:11,color:T3}}>{l.duration || l.dur}</div>
                          {done && <div style={{fontSize:11,color:GR,marginTop:1}}>complete</div>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div style={{position:'sticky',bottom:0,background:W,border:`1px solid ${BD}`,borderRadius:12,padding:'12px 18px',margin:isMobile?'0 14px 20px':'0 24px 24px',display:'flex',gap:10,flexWrap:'wrap'}}>
          <button
            onClick={handleStartCourse}
            style={{padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',background: progress === 0 ? PU : W, color: progress === 0 ? W : T2, border: progress === 0 ? 'none' : `1px solid ${BD}`}}>
            {progress === 0 ? 'Start course' : 'Restart course'}
          </button>
          <button
            onClick={handleContinue}
            style={{padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',background: progress > 0 && progress < 100 ? PU : W, color: progress > 0 && progress < 100 ? W : T2, border: progress > 0 && progress < 100 ? 'none' : `1px solid ${BD}`}}>
            {progress >= 100 ? 'Review course' : 'Continue'}
          </button>
          <button
            onClick={() => handleCompleteLesson(activeLesson)}
            style={{padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',background: activeLesson && completedLessonIds.includes(activeLesson.id) ? GRB : W, color: activeLesson && completedLessonIds.includes(activeLesson.id) ? GR : T2, border: activeLesson && completedLessonIds.includes(activeLesson.id) ? `1px solid ${GR}` : `1px solid ${BD}`}}>
            {activeLesson && completedLessonIds.includes(activeLesson.id) ? 'Completed' : 'Mark complete'}
          </button>
          <button
            onClick={handleReview}
            style={{padding:'10px 20px',borderRadius:8,fontSize:13,fontWeight:500,cursor:'pointer',background: W, color: T2, border: `1px solid ${BD}`}}>
            Review all
          </button>
        </div>

      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HUB VIEW — main Learning Hub page
═══════════════════════════════════════════════════════ */
function HubView({ onPlay, isMobile, isTablet, onMenuToggle }) {
  const [courseView,   setCourseView]   = useState('grid'); // 'grid'|'table'
  const [activeTab,    setActiveTab]    = useState('all');
  const [activeFilter, setActiveFilter] = useState('thisMonth');
  const [sortOpen,     setSortOpen]     = useState(false);
  const [sortBy,       setSortBy]       = useState('progress');
  const [modalCourse,  setModalCourse]  = useState(null);
  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const TABS    = [{id:'all',label:'All courses'},{id:'inProgress',label:'In progress'},{id:'completed',label:'Completed'},{id:'saved',label:'Saved'}];
  const FILTERS = [{id:'thisMonth',label:'This month'},{id:'energyFinance',label:'Energy Finance'},{id:'solarStorage',label:'Solar & Storage'},{id:'riskFX',label:'Risk & FX'},{id:'policyESG',label:'Policy & ESG'}];
  const SORTS   = [{id:'progress',label:'Progress'},{id:'newest',label:'Newest'},{id:'az',label:'A–Z'}];
  const FILTER_CAT = { energyFinance:'Energy Finance', solarStorage:'Solar & Storage', riskFX:'Risk & FX', policyESG:'Policy & ESG' };
  const demoLessons = [
    {
      id: 'demo-1',
      title: 'Energy ownership explained',
      subtitle: 'A short walkthrough of SPVs and investor rights',
      videoId: 'aqz-KE-bpKQ',
      cat: 'Demo',
      level: 'Beginner',
      dur: '12 min',
      lessons: 4,
    },
    {
      id: 'demo-2',
      title: 'Inside a clean energy deal',
      subtitle: 'See how project finance and equity stack together',
      videoId: 'M7lc1UVf-VE',
      cat: 'Demo',
      level: 'Intermediate',
      dur: '10 min',
      lessons: 3,
    },
  ];

  useEffect(() => {
    let isMounted = true;
    const loadCourses = async () => {
      try {
        const [coursesResponse, profileResponse] = await Promise.all([
          coursesAPI.list({ take: 20 }),
          usersAPI.getProfile(),
        ]);
        const enrolledResponse = await apiClient.get(`/courses/${profileResponse.data.id}/enrollments`);
        const enrolledMap = new Map((enrolledResponse.data || []).map((course) => [course.id, course]));

        const transformed = (coursesResponse.data || []).map((course) => {
          const enrollment = enrolledMap.get(course.id);
          const progress = enrollment?.progress ?? 0;
          const status = progress >= 100 ? 'completed' : progress > 0 ? 'inProgress' : 'notStarted';
          return {
            id: course.id,
            cat: course.category || 'General',
            title: course.title,
            desc: course.description || 'Continue your learning with this course.',
            dur: course.duration ? `${Math.round(course.duration / 60)}h ${course.duration % 60}m` : 'Self-paced',
            lessons: course.lessons || 0,
            level: course.difficulty || 'Beginner',
            progress,
            status,
            thumbnail: course.thumbnail || 'https://img.youtube.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
          };
        });

        if (isMounted) {
          setCourses(transformed);
        }
      } catch (error) {
        if (isMounted) {
          setCourses([]);
        }
      } finally {
        if (isMounted) {
          setLoadingCourses(false);
        }
      }
    };

    loadCourses();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = courses.filter(c => {
    if (activeTab === 'inProgress' && c.status !== 'inProgress') return false;
    if (activeTab === 'completed'  && c.status !== 'completed')  return false;
    if (activeTab === 'saved') return false;
    const cat = FILTER_CAT[activeFilter];
    if (cat && c.cat !== cat) return false;
    return true;
  });

  const resumeCourse = courses.find(c => c.status === 'inProgress');

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
      <main style={{flex:1,overflowY:'auto',padding:isMobile?'16px 14px 60px':'28px 32px 60px'}}>

        {/* Page header */}
        <h1 style={{fontSize:isMobile?20:26,fontWeight:700,color:T1,margin:'0 0 4px',letterSpacing:-.5}}>Learning Hub</h1>
        <p style={{fontSize:13,color:T2,margin:'0 0 20px'}}>Expand your knowledge on energy infrastructure, finance, and policy</p>

        {/* ── RESUME BLOCK — matches exact design ── */}
        {loadingCourses ? (
          <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 14, padding: '16px 20px', marginBottom: 24, color: T2 }}>
            Loading your learning hub…
          </div>
        ) : resumeCourse && (
          <div style={{
            background: W, border: `1px solid ${BD}`, borderRadius: 14,
            padding: isMobile?'14px':'16px 20px', marginBottom: 24,
            display: 'flex', flexDirection: isMobile?'column':'row',
            alignItems: isMobile?'flex-start':'center', gap: isMobile?10:16,
            boxShadow: '0 1px 4px rgba(0,0,0,.06)',
          }}>
            {/* Plain gray document icon — no coloured background */}
            <div style={{
              width: 42, height: 42, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={36} height={36} viewBox="0 0 24 24" fill="none"
                stroke={T3} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="8" y1="13" x2="16" y2="13"/>
                <line x1="8" y1="17" x2="13" y2="17"/>
              </svg>
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T1, marginBottom: 4, lineHeight: 1.3 }}>
                {resumeCourse.title}
              </div>
              <div style={{ fontSize: 13, color: T2 }}>
                Last viewed 2 days ago · Module {Math.round(resumeCourse.lessons * resumeCourse.progress / 100)} of {resumeCourse.lessons}: Legal Frameworks
              </div>
            </div>

            {/* Continue button */}
            <button
              onClick={() => onPlay(resumeCourse)}
              style={{
                background: PU, color: W, border: 'none',
                borderRadius: 9, padding: '10px 22px',
                fontSize: 14, fontWeight: 500, cursor: 'pointer',
                flexShrink: 0, whiteSpace:'nowrap',
                width: isMobile?'100%':'auto',
              }}>
              Continue
            </button>
          </div>
        )}

        {/* Next best actions */}
        <h2 style={{fontSize:isMobile?14:16,fontWeight:600,color:T1,margin:'0 0 12px'}}>Next best actions</h2>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:isMobile?10:16,marginBottom:24}}>
          {[
            {l:'Courses enrolled',v: courses.filter(c => c.status !== 'notStarted').length, badge:`${courses.filter(c => c.status === 'inProgress').length} in progress`, bc:PU, bb:PUF},
            {l:'Completed',       v: courses.filter(c => c.status === 'completed').length, badge:'Well done', bc:GR, bb:GRB},
            {l:'Hours learned',   v: `${courses.reduce((sum, c) => sum + (Number(c.dur?.split('h')[0]) || 0), 0)}h`, badge:'This month', bc:TL, bb:TLB},
            {l:'Active lessons',  v: courses.reduce((sum, c) => sum + (c.lessons || 0), 0), badge:'Keep going!', bc:AM, bb:AMB},
          ].map(s => (
            <div key={s.l} style={{background:W,border:`1px solid ${BD}`,borderRadius:10,padding:'14px 18px'}}>
              <div style={{fontSize:12,color:T2,marginBottom:6}}>{s.l}</div>
              <div style={{fontSize:28,fontWeight:700,color:T1,marginBottom:8,letterSpacing:-.8}}>{s.v}</div>
              <span style={{background:s.bb,color:s.bc,fontSize:11,fontWeight:500,padding:'2px 10px',borderRadius:20}}>{s.badge}</span>
            </div>
          ))}
        </div>

        {/* Learning path banner */}
        <div style={{background:`linear-gradient(135deg,${PUD},${PU} 55%,${PUL})`,borderRadius:14,padding:isMobile?'18px 16px':'22px 28px',marginBottom:24,display:'flex',flexDirection:isMobile?'column':'row',alignItems:isMobile?'flex-start':'center',justifyContent:'space-between',gap:16}}>
          <div>
            <div style={{color:W,fontSize:15,fontWeight:700,marginBottom:5}}>Your recommended learning path</div>
            <div style={{color:'rgba(255,255,255,.75)',fontSize:13,marginBottom:18,lineHeight:1.5}}>Tailored for Community Members new to energy infrastructure investment</div>
            <div style={{display:'flex',alignItems:'center',flexWrap:isMobile?'wrap':'nowrap',gap:isMobile?6:0}}>
              {PATH_STEPS.map((s,i) => (
                <div key={i} style={{display:'flex',alignItems:'center'}}>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div style={{width:26,height:26,borderRadius:'50%',background:i===0?W:'rgba(255,255,255,.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:i===0?PU:'rgba(255,255,255,.9)',flexShrink:0}}>{s.n}</div>
                    <span style={{fontSize:13,color:'rgba(255,255,255,.85)',fontWeight:i===0?600:400,whiteSpace:'nowrap'}}>{s.label}</span>
                  </div>
                  {i < PATH_STEPS.length-1 && <div style={{width:28,height:1,background:'rgba(255,255,255,.35)',margin:'0 10px'}}/>}
                </div>
              ))}
            </div>
          </div>
          <button style={{background:'rgba(255,255,255,.15)',color:W,border:'1.5px solid rgba(255,255,255,.4)',borderRadius:8,padding:'9px 18px',fontSize:13,fontWeight:500,cursor:'pointer',flexShrink:0,whiteSpace:'nowrap'}}>
            View full path
          </button>
        </div>

        {/* Demo lessons */}
        <div style={{marginBottom:24}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <h2 style={{fontSize:15,fontWeight:600,color:T1,margin:0}}>Featured demo lessons</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':isTablet?'1fr 1fr':'repeat(2,1fr)',gap:isMobile?12:16}}>
            {demoLessons.map((demo) => (
              <div key={demo.id} style={{background:W,border:`1px solid ${BD}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{height:140,backgroundImage:`url(${buildYouTubeThumbnailUrl(demo.videoId)})`,backgroundSize:'cover',backgroundPosition:'center'}}/>
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontSize:11,fontWeight:700,color:PU,marginBottom:6,letterSpacing:.3,textTransform:'uppercase'}}>{demo.cat}</div>
                  <div style={{fontSize:14,fontWeight:700,color:T1,marginBottom:6,lineHeight:1.35}}>{demo.title}</div>
                  <div style={{fontSize:12,color:T2,marginBottom:10,lineHeight:1.5}}>{demo.subtitle}</div>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,marginBottom:10,flexWrap:'wrap'}}>
                    <span style={{fontSize:12,color:T3}}>{demo.dur}</span>
                    <span style={{fontSize:12,color:T3}}>{demo.level}</span>
                  </div>
                  <button
                    onClick={() => onPlay({
                      id: demo.id,
                      title: demo.title,
                      cat: demo.cat,
                      desc: demo.subtitle,
                      dur: demo.dur,
                      lessons: demo.lessons,
                      level: demo.level,
                      progress: 0,
                      status: 'notStarted',
                      thumbnail: buildYouTubeThumbnailUrl(demo.videoId),
                      videoId: demo.videoId,
                    })}
                    style={{width:'100%',background:PU,color:W,border:'none',borderRadius:8,padding:'10px 12px',fontSize:13,fontWeight:600,cursor:'pointer'}}>
                    Watch demo
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{borderBottom:`1px solid ${BD}`,marginBottom:16,display:'flex',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              style={{background:'none',border:'none',padding:isMobile?'10px 14px':'10px 20px',cursor:'pointer',fontSize:14,fontWeight:activeTab===tab.id?500:400,color:activeTab===tab.id?PU:T2,borderBottom:activeTab===tab.id?`2px solid ${PU}`:'2px solid transparent',marginBottom:-1,transition:'color .12s',whiteSpace:'nowrap',flexShrink:0}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter pills + sort dropdown */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
          <div style={{display:'flex',gap:6,flexWrap:isMobile?'nowrap':'wrap',overflowX:isMobile?'auto':'visible',WebkitOverflowScrolling:'touch',paddingBottom:isMobile?4:0}}>
            {FILTERS.map(f => (
              <button key={f.id} onClick={()=>setActiveFilter(f.id)}
                style={{padding:'5px 12px',borderRadius:20,fontSize:13,cursor:'pointer',fontWeight:activeFilter===f.id?500:400,background:activeFilter===f.id?PUF:W,color:activeFilter===f.id?PU:T2,border:activeFilter===f.id?`1.5px solid ${PU}`:`1px solid ${BD}`,transition:'all .12s',whiteSpace:'nowrap',flexShrink:0}}>
                {f.label}
              </button>
            ))}
          </div>
          <div style={{position:'relative'}}>
            <button onClick={()=>setSortOpen(o=>!o)}
              style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:8,border:`1px solid ${BD}`,background:W,color:T2,fontSize:13,cursor:'pointer'}}>
              {SORTS.find(s=>s.id===sortBy)?.label}
              <Ico name="chevDown" size={13} color={T3} sw={1.5}/>
            </button>
            {sortOpen && (
              <>
                <div style={{position:'fixed',inset:0,zIndex:9}} onClick={()=>setSortOpen(false)}/>
                <div style={{position:'absolute',top:'calc(100% + 6px)',right:0,background:W,border:`1px solid ${BD}`,borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.1)',minWidth:130,overflow:'hidden',zIndex:10}}>
                  {SORTS.map(s => (
                    <div key={s.id} onClick={()=>{setSortBy(s.id);setSortOpen(false);}}
                      style={{padding:'10px 16px',cursor:'pointer',fontSize:13,color:sortBy===s.id?PU:T1,background:sortBy===s.id?PUF:'transparent',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      {s.label}
                      {sortBy===s.id && <Ico name="check" size={13} color={PU} sw={2.5}/>}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Count + grid/table toggle */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18}}>
          <span style={{fontSize:14,fontWeight:500,color:T1}}>All courses <span style={{color:T3,fontWeight:400}}>({courses.length})</span></span>
          <div style={{display:'flex',gap:2,background:'#F3F4F6',borderRadius:8,padding:3}}>
            {(['grid','list'] ).map(v => (
              <button key={v} onClick={()=>setCourseView(v)}
                style={{width:30,height:26,border:'none',borderRadius:5,cursor:'pointer',background:courseView===v?W:'transparent',boxShadow:courseView===v?'0 1px 3px rgba(0,0,0,.08)':'none',display:'flex',alignItems:'center',justifyContent:'center',transition:'all .12s'}}>
                <Ico name={v} size={14} color={courseView===v?PU:T3} sw={1.5}/>
              </button>
            ))}
          </div>
        </div>

        {/* Course content */}
        {filtered.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px 20px',background:W,border:`1px solid ${BD}`,borderRadius:14}}>
            <div style={{fontSize:36,marginBottom:12}}>📚</div>
            <h3 style={{fontSize:15,fontWeight:600,color:T1,margin:'0 0 6px'}}>No courses found</h3>
            <p style={{fontSize:13,color:T2,margin:'0 0 20px'}}>No courses match the selected filter.</p>
            <button onClick={()=>{setActiveTab('all');setActiveFilter('thisMonth');}}
              style={{background:PU,color:W,border:'none',borderRadius:8,padding:'10px 20px',fontSize:13,fontWeight:500,cursor:'pointer'}}>
              View all courses
            </button>
          </div>
        ) : courseView === 'grid' ? (
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':isTablet?'repeat(2,1fr)':'repeat(3,1fr)',gap:isMobile?14:20}}>
            {filtered.map(c => (
              <CourseCard key={c.id} course={c} onAction={onPlay} onOpenModal={setModalCourse}/>
            ))}
          </div>
        ) : (
          <div style={{overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
            <CourseTable courses={filtered} onOpenModal={setModalCourse}/>
          </div>
        )}

      </main>

      {/* Course detail modal */}
      {modalCourse && (
        <CourseModal
          course={modalCourse}
          onClose={() => setModalCourse(null)}
          onContinue={() => { onPlay(modalCourse); setModalCourse(null); }}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════ */
export default function App({ onBack, onToggleSidebar, isMobile, isTablet }) {
  const [screen,       setScreen]       = useState('hub');
  const [playerCourse, setPlayerCourse] = useState(null);

  function handlePlay(course) {
    setPlayerCourse(course);
    setScreen('player');
  }

  return (
    <div style={{flex: 1, display:'flex', height:'100%', background:BG, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize:14, overflow:'hidden', flexDirection:'column'}}>
      {screen === 'hub'
        ? <HubView
            onPlay={handlePlay}
            isMobile={isMobile}
            isTablet={isTablet}
            onMenuToggle={onToggleSidebar}
          />
        : <LessonPlayer
            course={playerCourse}
            onBack={() => setScreen('hub')}
            isMobile={isMobile}
            isTablet={isTablet}
            onMenuToggle={onToggleSidebar}
          />
      }
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
