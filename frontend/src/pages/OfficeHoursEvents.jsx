import React, { useState, useEffect, useRef } from "react";
import { eventsAPI } from '../api/endpoints';

/* ─── DESIGN TOKENS ─── */
const C = {
  pu:'#5B21B6', puf:'#EDE9FE', pul:'#7C3AED', pud:'#4C1D95',
  gr:'#16A34A', grb:'#DCFCE7', am:'#D97706', amb:'#FEF3C7',
  tl:'#0D9488', tlb:'#CCFBF1', rd:'#DC2626', rdb:'#FEF2F2',
  t1:'#111827', t2:'#6B7280', t3:'#9CA3AF',
  bd:'#E5E7EB', bg:'#F9FAFB', w:'#FFFFFF',
};
const EV_TYPES = {
  'Office hours' : { c:'#7C3AED', b:'#EDE9FE', label:'OFFICE HOURS'  },
  'Member circle': { c:'#7C3AED', b:'#F5F3FF', label:'MEMBER CIRCLE' },
  'Workshop'     : { c:'#2563EB', b:'#EFF6FF', label:'WORKSHOP'      },
  'Webinar'      : { c:'#0D9488', b:'#F0FDFA', label:'WEBINAR'       },
  'Replay'       : { c:'#16A34A', b:'#DCFCE7', label:'REPLAY'        },
  'Podcast'      : { c:'#DB2777', b:'#FDF2F8', label:'PODCAST'       },
};
const EV_OPTS = Object.keys(EV_TYPES);
const MEETING_PLATFORMS = [
  { value: 'Google Meet', label: 'Google Meet', placeholder: 'meet.google.com/abc-defg-hij' },
  { value: 'Slack', label: 'Slack', placeholder: '#community-ops or your channel link' },
  { value: 'Zoom', label: 'Zoom', placeholder: 'https://zoom.us/j/123456789' },
  { value: 'Microsoft Teams', label: 'Microsoft Teams', placeholder: 'https://teams.microsoft.com/...' },
  { value: 'Discord', label: 'Discord', placeholder: 'https://discord.gg/abc123' },
  { value: 'Other', label: 'Other', placeholder: 'Paste a direct join link or handle' },
];

function inferMeetingPlatform(platform, link) {
  const normalized = `${platform || ''} ${link || ''}`.toLowerCase();
  const selectedPlatform = `${platform || ''}`.trim().toLowerCase();

  if (selectedPlatform === 'google meet' || selectedPlatform === 'meet' || selectedPlatform === 'google') return 'Google Meet';
  if (selectedPlatform === 'slack') return 'Slack';
  if (selectedPlatform === 'zoom') return 'Zoom';
  if (selectedPlatform === 'microsoft teams' || selectedPlatform === 'teams') return 'Microsoft Teams';
  if (selectedPlatform === 'discord') return 'Discord';

  if (normalized.includes('meet.google.com') || normalized.includes('google meet') || normalized.includes('join.google') || normalized.includes('meet.google')) return 'Google Meet';
  if (normalized.includes('slack')) return 'Slack';
  if (normalized.includes('zoom')) return 'Zoom';
  if (normalized.includes('teams.microsoft') || normalized.includes('microsoft teams')) return 'Microsoft Teams';
  if (normalized.includes('discord')) return 'Discord';
  return '';
}

function buildMeetingHref(platform, link) {
  const value = `${link || ''}`.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  if (platform === 'Google Meet') return `https://meet.google.com/${value.replace(/^\//, '')}`;
  if (platform === 'Slack') return `https://slack.com/app_redirect?channel=${encodeURIComponent(value.replace(/^#/, ''))}`;
  if (platform === 'Zoom') return `https://zoom.us/j/${encodeURIComponent(value)}`;
  if (platform === 'Microsoft Teams') return `https://teams.microsoft.com/l/meetup-join/${encodeURIComponent(value)}`;
  if (platform === 'Discord') return `https://discord.gg/${encodeURIComponent(value)}`;
  return value;
}

function getMeetingPreviewMeta(platform, link) {
  const resolvedPlatform = inferMeetingPlatform(platform, link);
  const href = buildMeetingHref(resolvedPlatform, link);
  const value = `${link || ''}`.trim();
  const createSvg = (fill, icon) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'><rect width='96' height='96' rx='24' fill='${fill}'/><text x='48' y='56' text-anchor='middle' font-size='34' font-family='Arial, sans-serif' font-weight='700' fill='white'>${icon}</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const presets = {
    'google meet': { label: 'Google Meet', color: '#1E8E3E', image: createSvg('#1E8E3E', 'G') },
    slack: { label: 'Slack', color: '#4A154B', image: createSvg('#4A154B', 'S') },
    zoom: { label: 'Zoom', color: '#2D8CFF', image: createSvg('#2D8CFF', 'Z') },
    'microsoft teams': { label: 'Microsoft Teams', color: '#6264A7', image: createSvg('#6264A7', 'T') },
    discord: { label: 'Discord', color: '#5865F2', image: createSvg('#5865F2', 'D') },
  };

  const preset = presets[(resolvedPlatform || '').toLowerCase()] || { label: resolvedPlatform || 'Meeting', color: C.pu, image: createSvg(C.pu, 'M') };
  return { ...preset, href, link: value, platform: resolvedPlatform || 'Meeting' };
}

/* ─── BREAKPOINT HOOK ─── */
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

/* ─── SVG ICONS ─── */
const IK = {
  home    :<><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
  book    :<><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  folder  :<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>,
  activity:<polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>,
  file    :<><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="12" y2="17"/></>,
  cal     :<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  users   :<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></>,
  monitor :<><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></>,
  globe   :<><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15 15 0 014 10 15 15 0 01-4 10 15 15 0 01-4-10 15 15 0 014-10z"/></>,
  bell    :<><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  help    :<><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  search  :<><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  clock   :<><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></>,
  x       :<><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  check   :<polyline points="20,6 9,17 4,12"/>,
  plus    :<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  chd     :<polyline points="6,9 12,15 18,9"/>,
  chl     :<polyline points="15,18 9,12 15,6"/>,
  chr     :<polyline points="9,18 15,12 9,6"/>,
  edit    :<><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  trash   :<><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
  arr     :<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12,5 19,12 12,19"/></>,
  menu    :<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
};
function I({ k, s=16, c=C.t2, sw=1.5, fill='none' }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {IK[k]}
    </svg>
  );
}

/* ─── DATA ─── */
const SPK = {
  KA:{ initials:'KA', name:'Kwame Asante', role:'Lead Investment Analyst', color:C.pu, bg:C.puf },
  RA:{ initials:'RA', name:'Ria Adeyemi',  role:'Legal Counsel',           color:C.am, bg:C.amb },
  NF:{ initials:'NF', name:'Ngozi Fakoya', role:'ESG & Policy Lead',       color:C.tl, bg:C.tlb },
};
const BASE_EVENT = {
  title:'Project Financing Deep Dive: Structuring Your First Deal',
  desc:'Join our lead investment analyst for a live walkthrough of a real $2.4M C&I solar deal — from term sheet to financial close. Bring your questions.',
  dateLabel:'Thursday, May 8, 2026', dateShort:'Thu, May 8 · 3:00 PM GMT',
  time:'3:00 PM GMT', dur:'90 min', format:'Live Zoom · Recorded',
  month:'MAY', day:'8', weekday:'THU', calDay:8, calMonth:4, calYear:2026,
  spotsLeft:14, totalSpots:40, rsvped:true, type:'Office hours',
  speakers:[SPK.KA, SPK.RA],
  agenda:[
    {t:'3:00', d:'Welcome & housekeeping'},
    {t:'3:05', d:'Deal overview: the $2.4M C&I solar project'},
    {t:'3:20', d:'Term sheet walkthrough'},
    {t:'3:45', d:'Financial model deep dive'},
    {t:'4:10', d:'Q&A with the team'},
  ],
};
const INIT_EVENTS = [
  { ...BASE_EVENT, id:1, speakers:[SPK.KA,SPK.RA] },
  { ...BASE_EVENT, id:2, speakers:[SPK.KA,SPK.RA] },
  { ...BASE_EVENT, id:3, speakers:[SPK.KA,SPK.NF] },
  { ...BASE_EVENT, id:4, speakers:[SPK.KA,SPK.RA] },
];
const NAV = [
  {l:'Home',k:'home'},{l:'Learning Hub',k:'book'},{l:'Due Diligence Vault',k:'folder'},
  {l:'Project Pipeline',k:'activity'},{l:'Reporting Library',k:'file'},
  {l:'Office Hours & Events',k:'cal',active:true},null,
  {l:'Member Circles',k:'users'},{l:'Toolkits & Templates',k:'monitor'},{l:'Partner Marketplace',k:'globe'},
  null,{l:'Announcements & Feedback',k:'bell'},{l:'Help',k:'help'},
];

/* ═══════════════════════════════════════════
   SIDEBAR — collapsible on mobile/tablet
═══════════════════════════════════════════ */
function Sidebar({ open, onClose, isMobile, isTablet }) {
  const isOverlay = isMobile || isTablet;
  if (isOverlay && !open) return null;
  return (
    <>
      {/* Backdrop for mobile/tablet */}
      {isOverlay && (
        <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',zIndex:200}}/>
      )}
      <aside style={{
        width:195, minWidth:195, background:C.w, borderRight:`1px solid ${C.bd}`,
        display:'flex', flexDirection:'column', overflowY:'auto', flexShrink:0,
        ...(isOverlay ? { position:'fixed', top:0, left:0, height:'100%', zIndex:201, boxShadow:'4px 0 24px rgba(0,0,0,.18)' } : {}),
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'15px 16px',borderBottom:`1px solid ${C.bd}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:26,height:26,borderRadius:'50%',background:C.pu,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>
            </div>
            <span style={{fontSize:11,fontWeight:700,color:C.t1,letterSpacing:1,textTransform:'uppercase'}}>Tribes Capital</span>
          </div>
          {isOverlay && (
            <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',color:C.t2}}><I k="x" s={16} c={C.t2} sw={2}/></button>
          )}
        </div>
        <nav style={{flex:1,padding:'6px 0'}}>
          {NAV.map((item,i) => {
            if (!item) return <div key={i} style={{height:1,background:C.bd,margin:'5px 14px'}}/>;
            return (
              <div key={i} onClick={isOverlay?onClose:undefined} style={{display:'flex',alignItems:'center',gap:9,padding:'8px 14px',margin:'1px 6px',borderRadius:8,cursor:'pointer',background:item.active?C.puf:'transparent',color:item.active?C.pu:C.t2,fontSize:13,fontWeight:item.active?500:400,borderLeft:item.active?`3px solid ${C.pu}`:'3px solid transparent'}}>
                <I k={item.k} s={15} c={item.active?C.pu:C.t3} sw={item.active?2:1.5}/>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{item.l}</span>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

/* ═══════════════════════════════════════════
   TOPBAR — hamburger on mobile/tablet
═══════════════════════════════════════════ */
function TopBar({ onMenuToggle, isMobile, isTablet }) {
  const showHamburger = isMobile || isTablet;
  return (
    <header style={{height:54,background:C.w,borderBottom:`1px solid ${C.bd}`,display:'flex',alignItems:'center',padding:`0 ${isMobile?14:24}px`,justifyContent:'space-between',flexShrink:0,gap:12}}>
      {/* Left: hamburger OR search */}
      <div style={{display:'flex',alignItems:'center',gap:12,flex:1,minWidth:0}}>
        {showHamburger && (
          <button onClick={onMenuToggle} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex',flexShrink:0}}>
            <I k="menu" s={20} c={C.t1}/>
          </button>
        )}
        {/* Search bar — full on desktop, icon-only on mobile */}
        {!isMobile && (
          <div style={{flex:1,maxWidth:400,background:C.bg,border:`1px solid ${C.bd}`,borderRadius:8,height:36,display:'flex',alignItems:'center',gap:8,padding:'0 12px'}}>
            <I k="search" s={14} c={C.t3}/>
            <span style={{fontSize:13,color:C.t3,whiteSpace:'nowrap',overflow:'hidden'}}>Search topics, documents, people, events…</span>
          </div>
        )}
        {isMobile && (
          <span style={{fontSize:14,fontWeight:600,color:C.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>Office Hours & Events</span>
        )}
      </div>
      {/* Right: search icon (mobile) + bell + avatar */}
      <div style={{display:'flex',alignItems:'center',gap:isMobile?8:12,flexShrink:0}}>
        {isMobile && (
          <button style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex'}}>
            <I k="search" s={18} c={C.t2}/>
          </button>
        )}
        <div style={{width:34,height:34,border:`1px solid ${C.bd}`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',position:'relative',cursor:'pointer',flexShrink:0}}>
          <I k="bell" s={16} c={C.t2}/>
          <div style={{width:7,height:7,background:'#EF4444',borderRadius:'50%',border:'1.5px solid #fff',position:'absolute',top:6,right:6}}/>
        </div>
        <div style={{width:34,height:34,background:C.pu,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:C.w,fontSize:13,fontWeight:600,flexShrink:0}}>A</div>
      </div>
    </header>
  );
}

/* ═══════════════════════════════════════════
   CALENDAR WIDGET
═══════════════════════════════════════════ */
function CalWidget({ eventDays, onDayClick }) {
  const [yr, setYr] = useState(2026);
  const [mo, setMo] = useState(4);
  const MNAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const fd = new Date(yr,mo,1).getDay(); const sc=(fd+6)%7;
  const dim = new Date(yr,mo+1,0).getDate(); const pd=new Date(yr,mo,0).getDate();
  const cells=[];
  for(let i=0;i<sc;i++) cells.push({d:pd-sc+1+i,ov:true});
  for(let d=1;d<=dim;d++) cells.push({d,ov:false});
  const r=(7-cells.length%7)%7; for(let i=1;i<=r;i++) cells.push({d:i,ov:true});
  const weeks=[]; for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  const prev=()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);};
  const nxt =()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);};
  const hasEv=(d,ov)=>!ov&&eventDays.some(e=>e.day===d&&e.month===mo&&e.year===yr);
  return (
    <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,padding:'14px',marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <button onClick={prev} style={{background:'none',border:'none',cursor:'pointer',padding:3,display:'flex'}}><I k="chl" s={14} c={C.t3}/></button>
        <span style={{fontSize:13,fontWeight:600,color:C.t1}}>{MNAMES[mo]}-{yr}</span>
        <button onClick={nxt} style={{background:'none',border:'none',cursor:'pointer',padding:3,display:'flex'}}><I k="chr" s={14} c={C.t3}/></button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:2}}>
        {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d=><div key={d} style={{textAlign:'center',fontSize:11,fontWeight:600,color:C.t3,padding:'2px 0'}}>{d}</div>)}
      </div>
      {weeks.map((wk,wi)=>(
        <div key={wi} style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)'}}>
          {wk.map((cell,di)=>{
            const ev=hasEv(cell.d,cell.ov);
            return (
              <div key={di} style={{textAlign:'center',padding:'2px 0',cursor:cell.ov?'default':ev?'pointer':'default'}}
                onClick={()=>!cell.ov&&ev&&onDayClick(cell.d,mo,yr)}>
                <span style={{display:'inline-flex',flexDirection:'column',alignItems:'center',justifyContent:'center',width:26,height:26,borderRadius:'50%',background:ev?C.pu:'transparent',color:cell.ov?C.t3:ev?C.w:C.t1,fontSize:12,fontWeight:ev?700:400}}>
                  {cell.d}
                </span>
                {ev&&!cell.ov&&<div style={{width:4,height:4,borderRadius:'50%',background:C.pu,margin:'1px auto 0'}}/>}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   EVENT CARD — responsive
═══════════════════════════════════════════ */
function EventCard({ ev, onOpen, onEdit, onDelete, onRsvp, onJoinMeeting, isMobile }) {
  const ec = EV_TYPES[ev.type]||{c:C.t2,b:C.bg,label:ev.type.toUpperCase()};
  const meetingPreview = getMeetingPreviewMeta(ev.meetingPlatform, ev.meetingLink || ev.meetingHandle);
  return (
    <div style={{display:'flex',background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,overflow:'hidden',marginBottom:12}}>
      {/* Purple date block */}
      <div style={{width:isMobile?56:64,background:C.pu,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 6px',flexShrink:0}}>
        <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.7)',letterSpacing:1,textTransform:'uppercase',lineHeight:1.6}}>{ev.month}</span>
        <span style={{fontSize:isMobile?22:28,fontWeight:800,color:C.w,lineHeight:1}}>{ev.day}</span>
        <span style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,.65)',letterSpacing:.5,lineHeight:1.6}}>{ev.weekday}</span>
      </div>
      {/* Content */}
      <div style={{flex:1,padding:isMobile?'10px 12px':'13px 16px',minWidth:0}}>
        {/* Row 1: badge + edit/delete */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:6,flexWrap:'wrap',gap:4}}>
          <span style={{fontSize:10,fontWeight:600,color:ec.c,padding:'2px 9px',background:ec.b,borderRadius:20,letterSpacing:.3}}>{ec.label}</span>
          <div style={{display:'flex',gap:5}}>
            <button onClick={e=>{e.stopPropagation();onEdit(ev);}} style={{display:'flex',alignItems:'center',gap:3,padding:isMobile?'4px 8px':'4px 10px',border:`1px solid ${C.bd}`,borderRadius:7,background:C.w,color:C.t2,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
              <I k="edit" s={11} c={C.t2}/>Edit
            </button>
            <button onClick={e=>{e.stopPropagation();onDelete(ev);}} style={{display:'flex',alignItems:'center',gap:3,padding:isMobile?'4px 8px':'4px 10px',border:`1px solid ${C.bd}`,borderRadius:7,background:C.w,color:C.t2,fontSize:11,cursor:'pointer',fontFamily:'inherit'}}>
              <I k="trash" s={11} c={C.t2}/>Delete
            </button>
          </div>
        </div>
        {/* Title */}
        <div onClick={()=>onOpen(ev)} style={{fontSize:isMobile?13:14,fontWeight:700,color:C.t1,marginBottom:4,lineHeight:1.35,cursor:'pointer'}}>{ev.title}</div>
        {/* Desc */}
        <p style={{fontSize:12,color:C.t2,margin:'0 0 8px',lineHeight:1.6,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ev.desc}</p>
        {/* Meta + avatars */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:0,flexWrap:'wrap',gap:4}}>
          <div style={{display:'flex',alignItems:'center',gap:isMobile?8:12,flexWrap:'wrap'}}>
            {!isMobile && <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.t2}}><I k="cal" s={12} c={C.t3}/>{ev.dateShort}</span>}
            {isMobile  && <span style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:C.t2}}><I k="cal" s={11} c={C.t3}/>Thu, May 8</span>}
            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:isMobile?11:12,color:C.t2}}><I k="users" s={11} c={C.t3}/>{ev.speakers.length} speakers</span>
            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:isMobile?11:12,color:C.t2}}><I k="clock" s={11} c={C.t3}/>{ev.dur}</span>
          </div>
          <div style={{display:'flex',alignItems:'center'}}>
            {ev.speakers.map((s,i)=>(
              <div key={i} style={{width:22,height:22,borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:7,fontWeight:700,color:s.color,border:`2px solid ${C.w}`,marginLeft:i>0?-5:0,zIndex:ev.speakers.length-i,flexShrink:0}}>{s.initials}</div>
            ))}
          </div>
        </div>
        {/* Separator */}
        <div style={{height:1,background:C.bd,margin:isMobile?'8px -12px':'10px -16px'}}/>
        {/* Spots + RSVP */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}}>
          <span style={{fontSize:12,color:C.pu,fontWeight:500}}>{ev.spotsLeft} spots left</span>
          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
            {meetingPreview.href && (
              <button onClick={(e)=>{e.stopPropagation(); onJoinMeeting(ev);}}
                style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:7,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:C.puf,color:C.pu,border:`1px solid ${C.pu}`}}>
                <I k="monitor" s={11} c={C.pu}/>Join
              </button>
            )}
            <button onClick={()=>onRsvp(ev.id)}
              style={{display:'flex',alignItems:'center',gap:5,padding:'5px 12px',borderRadius:7,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:ev.rsvped?C.w:C.pu,color:ev.rsvped?C.gr:C.w,border:ev.rsvped?`1px solid ${C.gr}`:'none'}}>
              {ev.rsvped&&<I k="check" s={11} c={C.gr} sw={2.5}/>}{ev.rsvped?'RSVPed':'RSVP'}
            </button>
          </div>
        </div>
        {meetingPreview.href && (
          <div onClick={(e)=>{e.stopPropagation(); onJoinMeeting(ev);}} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1px solid ${C.bd}`,background:C.bg,marginTop:10,cursor:'pointer'}}>
            <img src={meetingPreview.image} alt='' style={{width:40,height:40,borderRadius:10,objectFit:'cover',flexShrink:0}} />
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:C.t1}}>{meetingPreview.label}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   EVENT FORM MODAL — responsive width
═══════════════════════════════════════════ */
function EventFormModal({ title, initial, onClose, onSave, isMobile }) {
  const blank = {title:'',speakers:'',type:'',duration:'',date:'',time:'',maxCap:'',avail:'',desc:'',agenda:[], meetingPlatform:'', meetingLink:'', meetingInstructions:''};
  const [f, setF] = useState(initial||blank);
  const meetingPreview = getMeetingPreviewMeta(f.meetingPlatform, f.meetingLink);
  const [typeOpen, setTypeOpen] = useState(false);
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const setV = (k,v) => setF(p=>({...p,[k]:v}));
  const addAg = () => setF(p=>({...p,agenda:[...p.agenda,{t:'',d:''}]}));
  const setAg = (i,k,v) => setF(p=>({...p,agenda:p.agenda.map((a,j)=>j===i?{...a,[k]:v}:a)}));
  const delAg = i => setF(p=>({...p,agenda:p.agenda.filter((_,j)=>j!==i)}));
  const IN = {width:'100%',padding:'10px 12px',border:`1px solid ${C.bd}`,borderRadius:8,fontSize:13,color:C.t1,outline:'none',fontFamily:'inherit',boxSizing:'border-box',background:C.w};
  const LB = {fontSize:13,fontWeight:500,color:C.t1,display:'block',marginBottom:5};
  const GP = {marginBottom:16};
  const modalW = isMobile ? '100%' : 380;
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:modalW,height:'100%',background:C.w,zIndex:101,display:'flex',flexDirection:'column',boxShadow:'-4px 0 30px rgba(0,0,0,.12)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px',borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
          <h2 style={{fontSize:17,fontWeight:700,color:C.t1,margin:0}}>{title}</h2>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.w,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><I k="x" s={14} c={C.t2} sw={2}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'18px 20px'}}>
          <div style={GP}><label htmlFor="event-title" style={LB}>Event title <span style={{color:'#EF4444'}}>*</span></label><input id="event-title" name="title" value={f.title} onChange={set('title')} placeholder="Enter event title" style={IN}/></div>
          <div style={GP}><label htmlFor="event-speakers" style={LB}>Speaker name(s)</label><input id="event-speakers" name="speakers" value={f.speakers} onChange={set('speakers')} placeholder="Enter speaker names" style={IN}/></div>
          {/* Type + Duration — stack on mobile */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,...GP}}>
            <div>
              <label htmlFor="event-type" style={LB}>Event type <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <button id="event-type" name="type" onClick={()=>setTypeOpen(o=>!o)} style={{...IN,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',color:f.type?C.t1:C.t3,padding:'10px 12px'}}>
                  <span>{f.type||'Select your role'}</span><I k="chd" s={14} c={C.t3}/>
                </button>
                {typeOpen&&(
                  <><div style={{position:'fixed',inset:0,zIndex:49}} onClick={()=>setTypeOpen(false)}/>
                  <div style={{position:'absolute',top:'calc(100% + 2px)',left:0,right:0,background:C.w,border:`1px solid ${C.bd}`,borderRadius:8,zIndex:50,overflow:'hidden',boxShadow:'0 4px 14px rgba(0,0,0,.1)'}}>
                    {EV_OPTS.map(opt=>(
                      <div key={opt} onClick={()=>{setV('type',opt);setTypeOpen(false);}} style={{padding:'10px 14px',fontSize:13,cursor:'pointer',background:f.type===opt?C.pu:'transparent',color:f.type===opt?C.w:C.t1}}>{opt}</div>
                    ))}
                  </div></>
                )}
              </div>
            </div>
            <div><label htmlFor="event-duration" style={LB}>Duration</label><input id="event-duration" name="duration" value={f.duration} onChange={set('duration')} placeholder="e.g. 90 min" style={IN}/></div>
          </div>
          {/* Date + Time — stack on mobile */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,...GP}}>
            <div>
              <label style={LB}>Date <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <input id="event-date" name="date" value={f.date} onChange={set('date')} placeholder="mm/dd/yyyy" style={{...IN,paddingRight:36}}/>
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><I k="cal" s={14} c={C.t3}/></span>
              </div>
            </div>
            <div>
              <label style={LB}>Time (GMT) <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <input id="event-time" name="time" value={f.time} onChange={set('time')} placeholder="00:00" style={{...IN,paddingRight:36}}/>
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><I k="clock" s={14} c={C.t3}/></span>
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,...GP}}>
            <div><label htmlFor="event-max-cap" style={LB}>Max capacity</label><input id="event-max-cap" name="maxCap" type="number" value={f.maxCap} onChange={set('maxCap')} placeholder="0" style={IN}/></div>
            <div><label htmlFor="event-avail" style={LB}>Available spots</label><input id="event-avail" name="avail" type="number" value={f.avail} onChange={set('avail')} placeholder="0" style={IN}/></div>
          </div>
          <div style={GP}><label htmlFor="event-description" style={LB}>Description <span style={{color:'#EF4444'}}>*</span></label><textarea id="event-description" name="desc" value={f.desc} onChange={set('desc')} placeholder="write something here..." rows={4} style={{...IN,resize:'vertical',lineHeight:1.6}}/></div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,...GP}}>
            <div>
              <label htmlFor="event-meeting-platform" style={LB}>Meeting platform</label>
              <select id="event-meeting-platform" name="meetingPlatform" value={f.meetingPlatform} onChange={set('meetingPlatform')} style={IN}>
                <option value="">Select a platform</option>
                {MEETING_PLATFORMS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="event-meeting-link" style={LB}>Meeting link / handle</label>
              <input id="event-meeting-link" name="meetingLink" value={f.meetingLink} onChange={set('meetingLink')} placeholder={MEETING_PLATFORMS.find(option => option.value === f.meetingPlatform)?.placeholder || 'Paste a direct join link or handle'} style={IN}/>
            </div>
          </div>
          <div style={GP}><label htmlFor="event-meeting-instructions" style={LB}>Meeting instructions <span style={{fontSize:12,fontWeight:400,color:C.t3}}>(optional)</span></label><textarea id="event-meeting-instructions" name="meetingInstructions" value={f.meetingInstructions} onChange={set('meetingInstructions')} placeholder="Share access notes, passwords, or Slack channel details" rows={3} style={{...IN,resize:'vertical',lineHeight:1.6}}/></div>
          {meetingPreview.href && (
            <div style={{...GP,display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:`1px solid ${C.bd}`,borderRadius:12,background:C.bg}}>
              <img src={meetingPreview.image} alt='' style={{width:46,height:46,borderRadius:12,objectFit:'cover',flexShrink:0}} />
              <div style={{minWidth:0}}>
                <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:2}}>{meetingPreview.label} preview</div>
                <div style={{fontSize:12,color:C.t2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{meetingPreview.link || 'Meeting link preview will appear here'}</div>
              </div>
            </div>
          )}
          <div style={GP}>
            <label style={LB}>Agenda items <span style={{fontSize:12,fontWeight:400,color:C.t3}}>(optional)</span></label>
            {f.agenda.map((a,i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                <label htmlFor={`agenda-time-${i}`} style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0 0 0 0)',whiteSpace:'nowrap'}}>{`Agenda time ${i + 1}`}</label>
                <input id={`agenda-time-${i}`} name={`agenda-time-${i}`} value={a.t} onChange={e=>setAg(i,'t',e.target.value)} placeholder="Time" style={{...IN,width:65,flexShrink:0,padding:'9px 8px'}}/>
                <label htmlFor={`agenda-description-${i}`} style={{position:'absolute',width:1,height:1,overflow:'hidden',clip:'rect(0 0 0 0)',whiteSpace:'nowrap'}}>{`Agenda description ${i + 1}`}</label>
                <input id={`agenda-description-${i}`} name={`agenda-description-${i}`} value={a.d} onChange={e=>setAg(i,'d',e.target.value)} placeholder="Agenda item description" style={{...IN,flex:1}}/>
                <button onClick={()=>delAg(i)} style={{background:'none',border:'none',cursor:'pointer',padding:4,flexShrink:0,display:'flex'}}><I k="x" s={16} c={C.t3} sw={2}/></button>
              </div>
            ))}
            <div onClick={addAg} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px',border:`1.5px dashed ${C.bd}`,borderRadius:8,cursor:'pointer',fontSize:13,color:C.t3}}>
              <I k="plus" s={14} c={C.t3}/>Add agenda item
            </div>
          </div>
        </div>
        <div style={{padding:'14px 20px',borderTop:`1px solid ${C.bd}`,display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0}}>
          <button onClick={onClose} style={{padding:'9px 16px',borderRadius:8,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          <button onClick={()=>onSave(f)} style={{padding:'9px 20px',borderRadius:8,border:'none',background:C.pu,color:C.w,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Save changes</button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   DETAIL MODAL — responsive width
═══════════════════════════════════════════ */
function DetailModal({ ev, onClose, onRsvp, onJoinMeeting, isMobile }) {
  const ec = EV_TYPES[ev.type]||{c:C.t2,b:C.bg};
  const meetingPreview = getMeetingPreviewMeta(ev.meetingPlatform, ev.meetingLink || ev.meetingHandle);
  const modalW = isMobile ? '100%' : 380;
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:modalW,height:'100%',background:C.w,zIndex:101,display:'flex',flexDirection:'column',boxShadow:'-4px 0 30px rgba(0,0,0,.12)'}}>
        <div style={{display:'flex',justifyContent:'flex-end',padding:'16px 20px 0',flexShrink:0}}>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.w,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><I k="x" s={14} c={C.t2} sw={2}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'8px 20px 20px'}}>
          <span style={{display:'inline-block',fontSize:11,fontWeight:700,color:ec.c,padding:'3px 10px',background:ec.b,borderRadius:20,marginBottom:12}}>
            {ev.type.charAt(0).toUpperCase()+ev.type.slice(1)}
          </span>
          {(ev.meetingPlatform || ev.meetingLink) && (
            <div style={{background:C.puf,border:`1px solid ${C.pu}`,borderRadius:10,padding:'12px 14px',marginBottom:14}}>
              <div style={{fontSize:11,fontWeight:700,color:C.pu,marginBottom:4}}>Join session</div>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:4}}>{ev.meetingPlatform || 'Meeting link'}</div>
              <div style={{fontSize:12,color:C.t2,marginBottom:10,wordBreak:'break-all'}}>{ev.meetingLink || ev.meetingHandle}</div>
              <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,border:`1px solid ${C.bd}`,background:C.w,marginBottom:10}}>
                <img src={meetingPreview.image} alt='' style={{width:40,height:40,borderRadius:10,objectFit:'cover',flexShrink:0}} />
                <div style={{minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:2}}>{meetingPreview.label} preview</div>
                  <div style={{fontSize:12,color:C.t2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{meetingPreview.link || 'Tap to open inside the portal'}</div>
                </div>
              </div>
              <button onClick={() => onJoinMeeting(ev)} style={{padding:'8px 12px',borderRadius:8,border:'none',background:C.pu,color:C.w,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                Open {ev.meetingPlatform || 'meeting'} in portal
              </button>
            </div>
          )}
          <h2 style={{fontSize:16,fontWeight:700,color:C.t1,margin:'0 0 10px',lineHeight:1.4}}>{ev.title}</h2>
          <p style={{fontSize:13,color:C.t2,margin:'0 0 18px',lineHeight:1.7}}>{ev.desc}</p>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:20}}>
            {[{l:'Date',v:ev.dateLabel},{l:'Time',v:ev.time},{l:'Duration',v:ev.dur},{l:'Format',v:ev.format}].map(it=>(
              <div key={it.l} style={{padding:'11px 12px',background:C.bg,border:`1px solid ${C.bd}`,borderRadius:10}}>
                <div style={{fontSize:11,color:C.t3,marginBottom:3,fontWeight:500}}>{it.l}</div>
                <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{it.v}</div>
              </div>
            ))}
          </div>
          <h3 style={{fontSize:14,fontWeight:700,color:C.t1,margin:'0 0 12px'}}>Speakers</h3>
          {ev.speakers.map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:s.color,flexShrink:0}}>{s.initials}</div>
              <div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{s.name}</div><div style={{fontSize:12,color:C.t3}}>{s.role}</div></div>
            </div>
          ))}
          {ev.agenda&&ev.agenda.length>0&&<>
            <h3 style={{fontSize:14,fontWeight:700,color:C.t1,margin:'14px 0 10px'}}>Agenda</h3>
            {ev.agenda.map((a,i)=>(
              <div key={i} style={{display:'flex',gap:14,marginBottom:9,alignItems:'baseline'}}>
                <span style={{fontSize:12,fontWeight:600,color:C.t3,flexShrink:0,width:30}}>{a.t}</span>
                <span style={{fontSize:13,color:C.t1,lineHeight:1.4}}>{a.d}</span>
              </div>
            ))}
          </>}
        </div>
        <div style={{padding:'14px 20px 18px',borderTop:`1px solid ${C.bd}`,flexShrink:0}}>
          <div style={{fontSize:13,color:C.t2,marginBottom:10}}>{ev.spotsLeft} spots remaining</div>
          <button onClick={()=>onRsvp(ev.id)}
            style={{width:'100%',padding:'12px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:ev.rsvped?C.pu:C.w,color:ev.rsvped?C.w:C.pu,border:ev.rsvped?'none':`1.5px solid ${C.pu}`}}>
            {ev.rsvped&&<I k="check" s={16} c={C.w} sw={2.5}/>}{ev.rsvped?'RSVPed':'RSVP now'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   MEETING PREVIEW MODAL — portal-native preview
═══════════════════════════════════════════ */
function MeetingPreviewModal({ meeting, onClose, isMobile }) {
  const meta = getMeetingPreviewMeta(meeting?.meetingPlatform, meeting?.meetingLink || meeting?.meetingHandle);
  const modalW = isMobile ? '100%' : 420;
  const openExternal = () => {
    if (meta.href) window.open(meta.href, '_blank', 'noopener,noreferrer');
  };
  const copyLink = async () => {
    if (!meta.href) return;
    try { await navigator.clipboard.writeText(meta.href); } catch (error) { /* noop */ }
  };

  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.28)',zIndex:120}} onClick={onClose}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:modalW,maxWidth:'92vw',maxHeight:'90vh',overflowY:'auto',background:C.w,borderRadius:16,zIndex:121,boxShadow:'0 24px 64px rgba(0,0,0,.2)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 18px',borderBottom:`1px solid ${C.bd}`}}>
          <div>
            <div style={{fontSize:11,fontWeight:700,color:C.pu,letterSpacing:1,textTransform:'uppercase',marginBottom:3}}>Meeting preview</div>
            <h3 style={{fontSize:17,fontWeight:700,color:C.t1,margin:0}}>{meeting?.title || 'Live session'}</h3>
          </div>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.w,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><I k="x" s={14} c={C.t2} sw={2}/></button>
        </div>
        <div style={{padding:'18px 18px 20px'}}>
          <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:12,border:`1px solid ${C.bd}`,background:C.bg,marginBottom:14}}>
            <img src={meta.image} alt='' style={{width:54,height:54,borderRadius:14,objectFit:'cover',flexShrink:0}} />
            <div style={{minWidth:0}}>
              <div style={{fontSize:12,fontWeight:700,color:C.t1,marginBottom:2}}>{meta.label} preview</div>
              <div style={{fontSize:12,color:C.t2,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{meta.link || 'Meeting details will appear here'}</div>
            </div>
          </div>
          <div style={{fontSize:13,color:C.t2,marginBottom:12,lineHeight:1.7}}>{meeting?.meetingInstructions || 'Use this preview to review the meeting details before joining.'}</div>
          <div style={{display:'grid',gap:8}}>
            <div style={{padding:'10px 12px',background:C.bg,border:`1px solid ${C.bd}`,borderRadius:10}}>
              <div style={{fontSize:11,color:C.t3,marginBottom:3,fontWeight:600}}>Platform</div>
              <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{meta.platform}</div>
            </div>
            <div style={{padding:'10px 12px',background:C.bg,border:`1px solid ${C.bd}`,borderRadius:10}}>
              <div style={{fontSize:11,color:C.t3,marginBottom:3,fontWeight:600}}>Join link</div>
              <div style={{fontSize:13,fontWeight:600,color:C.t1,wordBreak:'break-all'}}>{meta.link || 'No link provided yet'}</div>
            </div>
          </div>
          <div style={{display:'flex',gap:10,marginTop:16,flexWrap:'wrap'}}>
            <button onClick={copyLink} style={{flex:1,padding:'10px 12px',borderRadius:10,border:`1px solid ${C.bd}`,background:C.w,color:C.t1,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Copy link</button>
            <button onClick={openExternal} style={{flex:1,padding:'10px 12px',borderRadius:10,border:'none',background:C.pu,color:C.w,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Open link</button>
          </div>
        </div>
      </div>
    </>
  );
}

function DeleteModal({ ev, onClose, onConfirm, isMobile }) {
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:isMobile?'92vw':400,background:C.w,borderRadius:16,zIndex:101,boxShadow:'0 24px 64px rgba(0,0,0,.2)',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'flex-end',padding:'14px 18px 0'}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex'}}><I k="x" s={16} c={C.t3} sw={2}/></button>
        </div>
        <div style={{padding:'8px 28px 28px',textAlign:'center'}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:C.rdb,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px'}}><I k="trash" s={22} c={C.rd} sw={1.5}/></div>
          <h3 style={{fontSize:17,fontWeight:700,color:C.t1,margin:'0 0 10px'}}>Delete this event?</h3>
          <p style={{fontSize:13,color:C.t2,lineHeight:1.7,margin:'0 0 22px'}}>You're about to delete <strong>"{ev.title}"</strong>. This action cannot be undone.</p>
          <div style={{display:'flex',gap:12}}>
            <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:9,border:`1px solid ${C.bd}`,background:C.w,color:C.t1,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Keep it</button>
            <button onClick={onConfirm} style={{flex:1,padding:'11px',borderRadius:9,border:'none',background:C.rd,color:C.w,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Yes, delete</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   VIEW ALL MODAL — responsive width
═══════════════════════════════════════════ */
function ViewAllModal({ events, onClose, onOpen, onEdit, onDelete, onRsvp, onJoinMeeting, isMobile }) {
  const modalW = isMobile ? '100%' : 480;
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:modalW,height:'100%',background:C.w,zIndex:101,display:'flex',flexDirection:'column',boxShadow:'-4px 0 30px rgba(0,0,0,.12)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 20px',borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
          <h2 style={{fontSize:17,fontWeight:700,color:C.t1,margin:0}}>Upcoming Events <span style={{color:C.t3,fontWeight:400,fontSize:14}}>({events.length})</span></h2>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.w,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><I k="x" s={14} c={C.t2} sw={2}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'16px 16px'}}>
          {events.map(ev=>(
            <EventCard key={ev.id} ev={ev} isMobile={isMobile}
              onOpen={e=>{onClose();onOpen(e);}} onEdit={e=>{onClose();onEdit(e);}}
              onDelete={e=>{onClose();onDelete(e);}} onRsvp={onRsvp} onJoinMeeting={onJoinMeeting}/>
          ))}
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   TOAST
═══════════════════════════════════════════ */
function Toast({ msg, onDone }) {
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return (
    <div style={{position:'fixed',top:16,right:16,background:'#1F2937',color:C.w,fontSize:13,fontWeight:500,padding:'10px 18px',borderRadius:10,display:'flex',alignItems:'center',gap:8,zIndex:200,boxShadow:'0 8px 24px rgba(0,0,0,.2)',maxWidth:'90vw'}}>
      <I k="check" s={14} c='#34D399' sw={2.5}/>{msg}
    </div>
  );
}

function formatEventForUi(event) {
  const start = event.startDate ? new Date(event.startDate) : new Date();
  const end = event.endDate ? new Date(event.endDate) : new Date(start.getTime() + 90 * 60000);
  const durationMinutes = Math.max(30, Math.round((end.getTime() - start.getTime()) / 60000));
  const month = start.toLocaleDateString('en', { month: 'short' }).toUpperCase();
  const day = start.getDate();
  const weekday = start.toLocaleDateString('en', { weekday: 'short' }).toUpperCase();
  const time = start.toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dateLabel = start.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const dateShort = start.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }) + ` · ${time}`;
  const type = event.eventType || 'Office hours';
  const meetingPlatform = inferMeetingPlatform(event.meetingPlatform, event.meetingLink || event.meetingHandle);
  const meetingLink = event.meetingLink || event.meetingHandle || '';
  const spotsLeft = Math.max(0, (event.capacity || 0) - (event.rsvpCount || 0));

  return {
    id: event.id,
    title: event.title,
    desc: event.description || 'Join this live session with the Tribes Capital team.',
    dateLabel,
    dateShort,
    time,
    dur: `${durationMinutes} min`,
    format: meetingPlatform ? `Live ${meetingPlatform}` : (event.isVirtual ? 'Live Zoom · Recorded' : 'In person'),
    month,
    day: String(day),
    weekday,
    calDay: start.getDate(),
    calMonth: start.getMonth(),
    calYear: start.getFullYear(),
    spotsLeft,
    totalSpots: event.capacity || 0,
    rsvped: false,
    type,
    speakers: [SPK.KA],
    agenda: [],
    meetingPlatform,
    meetingLink,
    meetingInstructions: event.meetingInstructions || '',
  };
}

/* ═══════════════════════════════════════════
   MAIN
═══════════════════════════════════════════ */
export default function OfficeHoursEvents({ onBack, onToggleSidebar, isMobileParam, isTabletParam }) {
  const bp = useBreakpoint();
  const isMobile = isMobileParam !== undefined ? isMobileParam : bp.isMobile;
  const isTablet = isTabletParam !== undefined ? isTabletParam : bp.isTablet;
  const isDesktop = bp.isDesktop;
  const [events,      setEvents]      = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [activeTab,   setTab]         = useState('upcoming');
  const [activeFilter,setFilter]      = useState('all');
  const [sortBy,      setSort]        = useState('soonest');
  const [sortOpen,    setSortOpen]    = useState(false);
  const [showCreate,  setCreate]      = useState(false);
  const [editEv,      setEdit]        = useState(null);
  const [deleteEv,    setDel]         = useState(null);
  const [detailEv,    setDetail]      = useState(null);
  const [viewAll,     setViewAll]     = useState(false);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [toast,       setToast]       = useState(null);
  const [calEvDays,   setCalEvDays]   = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadEvents = async () => {
      try {
        const response = await eventsAPI.list({ skip: 0, take: 20 });
        const mapped = (response.data || []).map(formatEventForUi);
        if (isMounted) {
          setEvents(mapped);
          setCalEvDays(mapped.map(event => ({ day: event.calDay, month: event.calMonth, year: event.calYear })));
          setEventsError(null);
        }
      } catch (error) {
        if (isMounted) {
          setEvents([]);
          setEventsError('Unable to load events from the server right now.');
        }
      } finally {
        if (isMounted) {
          setLoadingEvents(false);
        }
      }
    };

    loadEvents();
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = msg => setToast(msg);

  const handleRsvp = async id => {
    const event = events.find(e => e.id === id);
    if (!event) return;

    try {
      if (!event.rsvped) {
        await eventsAPI.rsvp(id);
      } else {
        await eventsAPI.cancelRSVP(id);
      }

      setEvents(p => p.map(e => e.id === id ? { ...e, rsvped: !e.rsvped } : e));
      if (detailEv?.id === id) setDetail(p => ({ ...p, rsvped: !p.rsvped }));
      showToast(event.rsvped ? 'RSVP cancelled.' : 'RSVP confirmed.');
    } catch (error) {
      showToast('Unable to update your RSVP right now.');
    }
  };

  const handleSave = async form => {
    const parts = form.date ? form.date.split('/') : [];
    const startDate = parts[2] && parts[0] && parts[1]
      ? new Date(`${parts[2]}-${parts[0]}-${parts[1]}T${form.time || '00:00'}`)
      : new Date();
    const endDate = new Date(startDate.getTime() + 90 * 60000);
    const payload = {
      title: form.title,
      description: form.desc || '',
      slug: (form.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: form.meetingPlatform ? 'Virtual' : 'TBD',
      isVirtual: Boolean(form.meetingPlatform || form.meetingLink),
      capacity: parseInt(form.maxCap, 10) || 100,
      eventType: form.type || 'Office hours',
      meetingPlatform: inferMeetingPlatform(form.meetingPlatform, form.meetingLink),
      meetingLink: form.meetingLink || '',
      meetingHandle: form.meetingLink || '',
      meetingInstructions: form.meetingInstructions || '',
    };

    try {
      if (editEv) {
        const response = await eventsAPI.update(editEv.id, payload);
        const updated = formatEventForUi(response.data || response);
        setEvents(p => p.map(e => e.id === editEv.id ? { ...updated, rsvped: e.rsvped } : e));
        setEdit(null);
        showToast('Event updated successfully');
      } else {
        const response = await eventsAPI.create(payload);
        const created = formatEventForUi(response.data || response);
        setEvents(p => [created, ...p]);
        setCalEvDays(p => [...p, { day: created.calDay, month: created.calMonth, year: created.calYear }]);
        setCreate(false);
        showToast('Event created successfully');
      }
    } catch (error) {
      showToast('Unable to save this event right now.');
    }
  };

  const addLiveToCalendar = () => {
    if (!calEvDays.some(e=>e.day===8&&e.month===4&&e.year===2026)) setCalEvDays(p=>[...p,{day:8,month:4,year:2026}]);
    showToast('Added to your calendar!');
  };

  const handleCalDayClick = (day,month,year) => {
    const found = events.find(e=>e.calDay===day&&e.calMonth===month&&e.calYear===year);
    if (found) setDetail(found);
  };

  const TABS    = [{id:'upcoming',l:'Upcoming',n:events.length},{id:'rsvps',l:'My RSVPs',n:events.filter(e=>e.rsvped).length},{id:'replays',l:'Replays',n:0}];
  const FILTERS = [{id:'all',l:'All types'},{id:'oh',l:'Office Hours'},{id:'mc',l:'Member Circles'},{id:'ws',l:'Workshops'},{id:'wb',l:'Webinars'}];
  const SORTS   = [{id:'soonest',l:'Soonest first'},{id:'latest',l:'Latest first'},{id:'popular',l:'Most popular'}];
  const RSVPS   = [{dot:C.pu,title:'Project Financing Deep Dive',dt:'Thu, May 8 · 3:00 PM GMT'},{dot:C.gr,title:'Project Financing Deep Dive',dt:'Thu, May 8 · 3:00 PM GMT'},{dot:C.pu,title:'Project Financing Deep Dive',dt:'Thu, May 8 · 3:00 PM GMT'}];
  const HOSTS   = [{dot:C.gr,n:'Fatai',r:'Chief MO',s:'8 sessions'},{dot:C.pu,n:'David O',r:'Lead Investment Analyst',s:'8 sessions'},{dot:C.am,n:'Olatunde',r:'CTO',s:'8 sessions'}];
  const displayEvents = activeTab==='rsvps' ? events.filter(e=>e.rsvped) : events;

  /* Right-column width responsive */
  const rightColW = isDesktop ? 285 : isTablet ? 240 : '100%';
  const twoColGrid = (isMobile) ? '1fr' : isTablet ? `1fr ${rightColW}px` : `1fr ${rightColW}px`;
  const mainPad = isMobile ? '16px 14px 60px' : '24px 28px 60px';

  return (
    <div style={{display:'flex',flexDirection:'column',height:'100%',minHeight:0,background:C.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',fontSize:14,overflow:'hidden'}}>
      <main style={{flex:1,overflowY:'auto',padding:mainPad}}>

          {/* ── Page header ── */}
          <div style={{display:'flex',alignItems:isMobile?'flex-start':'center',justifyContent:'space-between',marginBottom:20,gap:12,flexDirection:isMobile?'column':'row'}}>
            <div>
              {!isMobile && <h1 style={{fontSize:22,fontWeight:700,color:C.t1,margin:'0 0 4px',letterSpacing:-.4}}>Office Hours &amp; Events</h1>}
              <p style={{fontSize:13,color:C.t2,margin:0,lineHeight:1.5}}>Live sessions, workshops, and replays from the Tribes Capital team and network</p>
            </div>
            <div style={{display:'flex',gap:8,flexShrink:0,width:isMobile?'100%':'auto'}}>
              <button onClick={()=>showToast("You'll be notified about upcoming events!")}
                style={{flex:isMobile?1:0,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 14px',border:`1px solid ${C.bd}`,borderRadius:9,background:C.w,color:C.t1,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                <I k="bell" s={14} c={C.t2}/>Notify me
              </button>
              <button onClick={()=>setCreate(true)}
                style={{flex:isMobile?1:0,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'8px 14px',border:'none',borderRadius:9,background:C.pu,color:C.w,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                <I k="plus" s={14} c={C.w} sw={2}/>Create event
              </button>
            </div>
          </div>

          {/* ── Stats row — 2-col on mobile, 4-col on tablet/desktop ── */}
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'repeat(4,1fr)',gap:isMobile?10:16,marginBottom:20}}>
            {[{l:'Upcoming events',v:String(events.length),badge:'This month',bc:C.pu,bb:C.puf},{l:"You're RSVPed to",v:String(events.filter(e=>e.rsvped).length),badge:'Confirmed',bc:C.gr,bb:C.grb},{l:'Replays available',v:'00.0',badge:'All time',bc:C.tl,bb:C.tlb},{l:'Sessions attended',v:'0',badge:'Your record',bc:C.am,bb:C.amb}].map(s=>(
              <div key={s.l} style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:10,padding:isMobile?'12px 14px':'14px 18px'}}>
                <div style={{fontSize:11,color:C.t2,marginBottom:4}}>{s.l}</div>
                <div style={{fontSize:isMobile?22:26,fontWeight:700,color:C.t1,marginBottom:6,letterSpacing:-.8}}>{s.v}</div>
                <span style={{background:s.bb,color:s.bc,fontSize:11,fontWeight:500,padding:'2px 10px',borderRadius:20}}>{s.badge}</span>
              </div>
            ))}
          </div>

          {/* ── Live banner ── */}
          <div style={{background:`linear-gradient(135deg,${C.pud},${C.pu} 55%,${C.pul})`,borderRadius:14,padding:isMobile?'18px 16px':'22px 28px',marginBottom:22}}>
            {loadingEvents ? (
              <div style={{color:C.w,fontSize:13}}>Loading upcoming sessions…</div>
            ) : events.length > 0 ? (
              <>
                <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:20,padding:'4px 12px',marginBottom:12}}>
                  <div style={{width:8,height:8,borderRadius:'50%',background:'#FCD34D'}}/>
                  <span style={{fontSize:11,fontWeight:700,color:C.w,letterSpacing:.7}}>UPCOMING SESSION</span>
                </div>
                <h2 style={{fontSize:isMobile?16:20,fontWeight:700,color:C.w,margin:'0 0 8px',lineHeight:1.3}}>{events[0].title}</h2>
                <p style={{fontSize:13,color:'rgba(255,255,255,.8)',margin:'0 0 14px',lineHeight:1.6,maxWidth:580}}>{events[0].desc}</p>
                <div style={{display:'flex',alignItems:'center',gap:isMobile?10:16,marginBottom:14,flexWrap:'wrap'}}>
                  <span style={{display:'flex',alignItems:'center',gap:5,fontSize:isMobile?12:13,color:'rgba(255,255,255,.85)'}}><I k="cal" s={13} c='rgba(255,255,255,.65)'/>{events[0].dateShort}</span>
                  <span style={{display:'flex',alignItems:'center',gap:5,fontSize:isMobile?12:13,color:'rgba(255,255,255,.85)'}}><I k="users" s={13} c='rgba(255,255,255,.65)'/>{events[0].type}</span>
                  <span style={{display:'flex',alignItems:'center',gap:5,fontSize:isMobile?12:13,color:'rgba(255,255,255,.85)'}}><I k="clock" s={13} c='rgba(255,255,255,.65)'/>{events[0].dur}</span>
                </div>
                <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                  <button onClick={() => setDetail(events[0])} style={{padding:isMobile?'8px 14px':'8px 18px',borderRadius:8,border:'1.5px solid rgba(255,255,255,.5)',background:'rgba(255,255,255,.15)',color:C.w,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>View details</button>
                  <button onClick={() => handleRsvp(events[0].id)} style={{display:'flex',alignItems:'center',gap:6,padding:isMobile?'8px 12px':'8px 16px',borderRadius:8,border:'1.5px solid rgba(255,255,255,.35)',background:'rgba(255,255,255,.08)',color:C.w,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>
                    <I k="plus" s={13} c={C.w} sw={2}/>{events[0].rsvped ? 'Cancel RSVP' : 'RSVP now'}
                  </button>
                </div>
                <p style={{fontSize:12,color:'rgba(255,255,255,.6)',margin:'10px 0 0'}}>{events[0].spotsLeft} spots remaining out of {events[0].totalSpots || '∞'}</p>
              </>
            ) : (
              <div style={{color:C.w,fontSize:13}}>{eventsError || 'No sessions are available right now.'}</div>
            )}
          </div>

          {/* ── Tabs — horizontally scrollable on mobile ── */}
          <div style={{borderBottom:`1px solid ${C.bd}`,marginBottom:14,display:'flex',overflowX:'auto',WebkitOverflowScrolling:'touch'}}>
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setTab(tab.id)}
                style={{background:'none',border:'none',padding:isMobile?'10px 16px':'10px 22px',cursor:'pointer',fontSize:14,fontWeight:activeTab===tab.id?500:400,color:activeTab===tab.id?C.pu:C.t2,borderBottom:activeTab===tab.id?`2px solid ${C.pu}`:'2px solid transparent',marginBottom:-1,fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                {tab.l} ({tab.n})
              </button>
            ))}
          </div>

          {/* ── Filters + Sort ── */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14,flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',gap:6,flexWrap:'wrap',overflowX:isMobile?'auto':'visible',WebkitOverflowScrolling:'touch'}}>
              {FILTERS.map(f=>(
                <button key={f.id} onClick={()=>setFilter(f.id)}
                  style={{padding:'5px 12px',borderRadius:20,fontSize:12,cursor:'pointer',fontWeight:activeFilter===f.id?500:400,background:activeFilter===f.id?C.puf:C.w,color:activeFilter===f.id?C.pu:C.t2,border:activeFilter===f.id?`1.5px solid ${C.pu}`:`1px solid ${C.bd}`,fontFamily:'inherit',whiteSpace:'nowrap',flexShrink:0}}>
                  {f.l}
                </button>
              ))}
            </div>
            <div style={{position:'relative',flexShrink:0}}>
              <button onClick={()=>setSortOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:7,padding:'6px 12px',borderRadius:8,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
                {SORTS.find(s=>s.id===sortBy)?.l}<I k="chd" s={13} c={C.t3}/>
              </button>
              {sortOpen&&(
                <><div style={{position:'fixed',inset:0,zIndex:9}} onClick={()=>setSortOpen(false)}/>
                <div style={{position:'absolute',top:'calc(100% + 4px)',right:0,background:C.w,border:`1px solid ${C.bd}`,borderRadius:10,boxShadow:'0 8px 24px rgba(0,0,0,.1)',minWidth:150,overflow:'hidden',zIndex:10}}>
                  {SORTS.map(s=>(
                    <div key={s.id} onClick={()=>{setSort(s.id);setSortOpen(false);}}
                      style={{padding:'10px 16px',cursor:'pointer',fontSize:13,color:sortBy===s.id?C.pu:C.t1,background:sortBy===s.id?C.puf:'transparent',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      {s.l}{sortBy===s.id&&<I k="check" s={13} c={C.pu} sw={2.5}/>}
                    </div>
                  ))}
                </div></>
              )}
            </div>
          </div>

          {/* ── Two-column layout — stacks to single column on mobile ── */}
          <div style={{display:'grid',gridTemplateColumns:twoColGrid,gap:20,alignItems:'start'}}>

            {/* LEFT — event list */}
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
                <span style={{fontSize:14,fontWeight:600,color:C.t1}}>Upcoming events <span style={{color:C.t3,fontWeight:400,fontSize:13}}>({displayEvents.length})</span></span>
                <button onClick={()=>setViewAll(true)} style={{fontSize:13,color:C.pu,background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:'inherit',fontWeight:500}}>
                  View all <I k="arr" s={13} c={C.pu}/>
                </button>
              </div>
              {loadingEvents ? (
                <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,padding:'16px',color:C.t2}}>Loading sessions…</div>
              ) : displayEvents.length === 0 ? (
                <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,padding:'16px',color:C.t2}}>{eventsError || 'No sessions match the current filter.'}</div>
              ) : displayEvents.map(ev=>(
                <EventCard key={ev.id} ev={ev} isMobile={isMobile}
                  onOpen={setDetail} onEdit={setEdit} onDelete={setDel} onRsvp={handleRsvp} onJoinMeeting={setActiveMeeting}/>
              ))}
            </div>

            {/* RIGHT — calendar + widgets */}
            <div>
              <CalWidget eventDays={calEvDays} onDayClick={handleCalDayClick}/>
              {/* RSVPs */}
              <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,overflow:'hidden',marginBottom:14}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:`1px solid ${C.bd}`}}>
                  <span style={{fontSize:13,fontWeight:600,color:C.t1}}>Your upcoming RSVPs</span>
                  <button onClick={()=>setViewAll(true)} style={{fontSize:12,color:C.pu,background:'none',border:'none',cursor:'pointer',fontFamily:'inherit'}}>View all</button>
                </div>
                {RSVPS.map((r,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:i<RSVPS.length-1?`1px solid ${C.bd}`:'none'}}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:r.dot,flexShrink:0}}/>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:C.t1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title}</div>
                      <div style={{fontSize:11,color:C.t3}}>{r.dt}</div>
                    </div>
                    <span style={{background:C.puf,color:C.pu,fontSize:11,fontWeight:500,padding:'2px 8px',borderRadius:6,flexShrink:0}}>RSVPed</span>
                  </div>
                ))}
              </div>
              {/* Hosts */}
              <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,overflow:'hidden'}}>
                <div style={{padding:'12px 16px',borderBottom:`1px solid ${C.bd}`}}><span style={{fontSize:13,fontWeight:600,color:C.t1}}>Regular hosts</span></div>
                {HOSTS.map((h,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderBottom:i<HOSTS.length-1?`1px solid ${C.bd}`:'none'}}>
                    <div style={{width:30,height:30,borderRadius:'50%',background:h.dot===C.pu?C.puf:h.dot===C.gr?C.grb:C.amb,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                      <div style={{width:9,height:9,borderRadius:'50%',background:h.dot}}/>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:12,fontWeight:500,color:C.t1}}>{h.n}</div>
                      <div style={{fontSize:11,color:C.t3}}>{h.r}</div>
                    </div>
                    <span style={{fontSize:12,color:C.pu,fontWeight:500,flexShrink:0}}>{h.s}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

      {/* ── MODALS ── */}
      {showCreate && <EventFormModal title="Create event" onClose={()=>setCreate(false)} onSave={handleSave} isMobile={isMobile}/>}
      {editEv     && <EventFormModal title="Edit event" initial={editEv} onClose={()=>setEdit(null)} onSave={handleSave} isMobile={isMobile}/>}
      {deleteEv   && <DeleteModal ev={deleteEv} isMobile={isMobile} onClose={()=>setDel(null)} onConfirm={()=>{setEvents(p=>p.filter(e=>e.id!==deleteEv.id));setDel(null);showToast('Event deleted successfully');}}/>}
{detailEv   && <DetailModal ev={detailEv} isMobile={isMobile} onClose={()=>setDetail(null)} onRsvp={handleRsvp} onJoinMeeting={setActiveMeeting}/>} 
      {viewAll    && <ViewAllModal events={displayEvents} isMobile={isMobile} onClose={()=>setViewAll(false)} onOpen={setDetail} onEdit={setEdit} onDelete={setDel} onRsvp={handleRsvp} onJoinMeeting={setActiveMeeting}/>} 
      {activeMeeting && <MeetingPreviewModal meeting={activeMeeting} isMobile={isMobile} onClose={()=>setActiveMeeting(null)} />} 
      {toast      && <Toast msg={toast} onDone={()=>setToast(null)}/>}

      <style>{`
        *{box-sizing:border-box;}
        button,input,select,textarea{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:10px;}
        @media(max-width:639px){
          .hide-mobile{display:none!important;}
        }
      `}</style>
    </div>
  );
}
