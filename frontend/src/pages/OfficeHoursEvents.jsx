import React, { useState, useEffect, useMemo, useRef } from "react";
import { communityAPI, eventsAPI, notificationsAPI } from '../api/endpoints';

/* ─── DESIGN TOKENS ─── */
const C = {
  pu:'#6700A6', puf:'#FAF5FF', pul:'#7C3AED', pud:'#4C1D95',
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

const PLATFORM_ICONS = {
  'Google Meet': 'monitor',
  Slack: 'users',
  Zoom: 'clock',
  'Microsoft Teams': 'globe',
  Discord: 'bell',
};

function inferMeetingPlatform(platform, link) {
  const normalizedPlatform = String(platform || '').trim();
  const normalized = `${platform || ''} ${link || ''}`.toLowerCase();
  if (normalizedPlatform) return normalizedPlatform;
  if (normalized.includes('meet.google.com') || normalized.includes('google meet')) return 'Google Meet';
  if (normalized.includes('slack.com') || normalized.includes('slack')) return 'Slack';
  if (normalized.includes('zoom.us') || normalized.includes('zoom')) return 'Zoom';
  if (normalized.includes('teams.microsoft.com') || normalized.includes('microsoft teams') || normalized.includes('teams')) return 'Microsoft Teams';
  if (normalized.includes('discord.gg') || normalized.includes('discord')) return 'Discord';
  return '';
}

function buildMeetingHref(platform, link) {
  const value = `${link || ''}`.trim();
  const detectedPlatform = platform || inferMeetingPlatform(platform, link);

  if (!value) {
    if (detectedPlatform === 'Google Meet') return 'https://meet.google.com/new';
    return null;
  }

  if (/^https?:\/\//i.test(value)) return value;
  if (detectedPlatform === 'Google Meet') return `https://meet.google.com/${value.replace(/^\//, '')}`;
  if (detectedPlatform === 'Slack') return `https://slack.com/app_redirect?channel=${encodeURIComponent(value.replace(/^#/, ''))}`;
  if (detectedPlatform === 'Zoom') return `https://zoom.us/j/${encodeURIComponent(value)}`;
  if (detectedPlatform === 'Microsoft Teams') return `https://teams.microsoft.com/l/meetup-join/${encodeURIComponent(value)}`;
  if (detectedPlatform === 'Discord') return `https://discord.gg/${encodeURIComponent(value)}`;
  return value;
}

function normalizeDateInput(value) {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
    const [month, day, year] = value.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return '';
  const year = asDate.getFullYear();
  const month = String(asDate.getMonth() + 1).padStart(2, '0');
  const day = String(asDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeTimeInput(value) {
  if (!value) return '';
  if (typeof value !== 'string') return '';
  if (/^\d{1,2}:\d{2}$/.test(value)) {
    const [hours, minutes] = value.split(':');
    const normalizedHours = String(Number(hours)).padStart(2, '0');
    return `${normalizedHours}:${minutes}`;
  }
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) return '';
  const hours = String(asDate.getHours()).padStart(2, '0');
  const minutes = String(asDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function parseDurationMinutes(value) {
  const input = String(value || '').trim().toLowerCase();
  if (!input) return 90;

  const clockDuration = input.match(/^(\d+):([0-5]\d)$/);
  if (clockDuration) return Number(clockDuration[1]) * 60 + Number(clockDuration[2]);
  if (/^\d+(?:\.\d+)?$/.test(input)) return Math.round(Number(input));

  const unitPattern = /(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m)\b/g;
  let minutes = 0;
  let match;
  let remaining = input;
  while ((match = unitPattern.exec(input)) !== null) {
    const amount = Number(match[1]);
    const unit = match[2];
    minutes += /^(?:h|hr|hrs|hour|hours)$/.test(unit) ? amount * 60 : amount;
    remaining = remaining.replace(match[0], ' ');
  }

  if (remaining.replace(/[\s,+and]/g, '') || minutes <= 0 || !Number.isFinite(minutes)) return null;
  return Math.round(minutes);
}

function formatDateForGoogleCalendar(iso) {
  if (!iso) return '';
  return new Date(iso).toISOString().replace(/[-:]|\.\d{3}/g, '') + 'Z';
}

function buildGoogleCalendarLink(event) {
  if (!event?.startIso || !event?.endIso) return null;
  const title = encodeURIComponent(event.title || 'Tribes Capital event');
  const details = encodeURIComponent(`${event.desc || ''}\n\n${event.meetingInstructions || ''}`.trim());
  const location = encodeURIComponent(event.meetingLink || event.location || '');
  const dates = `${formatDateForGoogleCalendar(event.startIso)}/${formatDateForGoogleCalendar(event.endIso)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${dates}`;
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
  return { isMobile: w < 640 };
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
/* ═══════════════════════════════════════════
   EVENT CARD — responsive
═══════════════════════════════════════════ */
function EventCard({ ev, onOpen, onEdit, onDelete, onApprove, onRsvp, isMobile, isAdmin }) {
  const ec = EV_TYPES[ev.type]||{c:C.t2,b:C.bg,label:(ev.type||'EVENT').toUpperCase()};
  const meetingPlatform = inferMeetingPlatform(ev.meetingPlatform, ev.meetingLink || ev.meetingHandle);
  const joinHref = buildMeetingHref(ev.meetingPlatform, ev.meetingLink || ev.meetingHandle);
  return (
    <article className="oe-event-card">
      <div className="oe-date-tile"><span>{ev.month}</span><strong>{ev.day}</strong></div>
      <div className="oe-event-info">
        <div className="oe-event-topline">
          <span className="oe-type-pill" style={{ color: ec.c, background: ec.b }}>{ec.label}</span>
          {isAdmin && !ev.isPublished && <span className="oe-pending-pill">PENDING</span>}
          {isAdmin && <div className="oe-admin-actions">
            {!ev.isPublished && <button type="button" onClick={() => onApprove(ev)}>Approve</button>}
            <button type="button" onClick={() => onEdit(ev)}>Edit</button>
            <button type="button" onClick={() => onDelete(ev)}>Delete</button>
          </div>}
        </div>
        <button type="button" className="oe-event-title" onClick={() => onOpen(ev)}>{ev.title}</button>
        <p className="oe-event-host">Hosted by {ev.hostName}</p>
        <div className="oe-event-meta">
          <span><I k="clock" s={13} c={C.t3}/>{ev.dateShort}</span>
          <span><I k={ev.isVirtual ? 'globe' : 'monitor'} s={13} c={C.t3}/>{ev.isVirtual ? 'Online' : ev.location}</span>
          <span><I k="users" s={13} c={C.t3}/>{ev.rsvpCount} attending</span>
        </div>
        <div className="oe-event-actions">
          <span className="oe-spots">{ev.spotsLeft} spots left</span>
          <div>
            {joinHref && <button type="button" className="oe-secondary-action" onClick={() => window.open(joinHref, '_blank', 'noopener,noreferrer')}>Join</button>}
            {buildGoogleCalendarLink(ev) && <button type="button" className="oe-secondary-action" onClick={() => window.open(buildGoogleCalendarLink(ev), '_blank', 'noopener,noreferrer')}>Add to calendar</button>}
            <button type="button" className={`oe-rsvp-action${ev.rsvped ? ' registered' : ''}`} onClick={() => onRsvp(ev.id)}>{ev.rsvped ? 'Registered' : 'Register'}</button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ═══════════════════════════════════════════
   EVENT FORM MODAL — responsive width
═══════════════════════════════════════════ */
function EventFormModal({ title, initial, onClose, onSave, isMobile }) {
  const blank = {title:'',speakers:'',type:'',duration:'',date:'',time:'',maxCap:'',desc:'',agenda:[], location:'', isVirtual:false, registrationDeadline:'', meetingPlatform:'', meetingLink:'', meetingInstructions:''};
  const hydrateForm = (source) => {
    if (!source) return blank;
    const dateValue = normalizeDateInput(source.date || source.startIso || source.startDate || '');
    const timeValue = normalizeTimeInput(source.time || source.startIso || source.startDate || '');
    return {
      title: source.title || '',
      speakers: Array.isArray(source.speakers) ? source.speakers.map(({ name }) => name).join(', ') : '',
      type: source.type || source.eventType || '',
      duration: source.duration || source.dur || '',
      date: dateValue,
      time: timeValue,
      maxCap: source.maxCap ?? source.capacity ?? '',
      desc: source.desc || source.description || '',
      agenda: Array.isArray(source.agenda) ? source.agenda : [],
      location: source.location || '',
      isVirtual: Boolean(source.isVirtual),
      registrationDeadline: normalizeDateInput(source.registrationDeadline || ''),
      meetingPlatform: source.meetingPlatform || '',
      meetingLink: source.meetingLink || source.meetingHandle || '',
      meetingInstructions: source.meetingInstructions || '',
    };
  };
  const [f, setF] = useState(() => hydrateForm(initial));
  const [typeOpen, setTypeOpen] = useState(false);
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const setV = (k,v) => setF(p=>({...p,[k]:v}));
  const addAg = () => setF(p=>({...p,agenda:[...p.agenda,{t:'',d:''}]}));
  const setAg = (i,k,v) => setF(p=>({...p,agenda:p.agenda.map((a,j)=>j===i?{...a,[k]:v}:a)}));
  const delAg = i => setF(p=>({...p,agenda:p.agenda.filter((_,j)=>j!==i)}));
  const meetingPreviewHref = useMemo(() => {
    if (!f.meetingLink && !f.meetingPlatform) return null;
    return buildMeetingHref(f.meetingPlatform, f.meetingLink);
  }, [f.meetingLink, f.meetingPlatform]);
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
              <label htmlFor="event-date" style={LB}>Date <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <input id="event-date" name="date" type="date" value={f.date} onChange={set('date')} style={{...IN,paddingRight:36}}/>
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><I k="cal" s={14} c={C.t3}/></span>
              </div>
            </div>
            <div>
              <label htmlFor="event-time" style={LB}>Time (GMT) <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <input id="event-time" name="time" type="time" value={f.time} onChange={set('time')} style={{...IN,paddingRight:36}}/>
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><I k="clock" s={14} c={C.t3}/></span>
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:12,...GP}}>
            <div>
              <label htmlFor="event-max-cap" style={LB}>Max capacity</label>
              <input id="event-max-cap" name="maxCap" type="number" min="1" step="1" value={f.maxCap} onChange={set('maxCap')} placeholder="e.g. 25" style={IN}/>
              <div style={{marginTop:6,fontSize:12,color:C.t3}}>This value is fixed, and each RSVP reduces the remaining spots by one attendee.</div>
            </div>
          </div>
          <div style={GP}><label htmlFor="event-description" style={LB}>Description <span style={{color:'#EF4444'}}>*</span></label><textarea id="event-description" name="desc" value={f.desc} onChange={set('desc')} placeholder="write something here..." rows={4} style={{...IN,resize:'vertical',lineHeight:1.6}}/></div>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:12,...GP}}>
            <div>
              <label htmlFor="event-location" style={LB}>Location</label>
              <input id="event-location" name="location" value={f.location} onChange={set('location')} placeholder="e.g. Virtual, NYC HQ, or a partner venue" style={IN}/>
            </div>
            <div>
              <label htmlFor="event-registration-deadline" style={LB}>Registration deadline</label>
              <input id="event-registration-deadline" name="registrationDeadline" type="date" value={f.registrationDeadline || ''} onChange={e=>setV('registrationDeadline', e.target.value)} style={IN}/>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:10,...GP}}>
            <input id="event-is-virtual" type="checkbox" checked={Boolean(f.isVirtual)} onChange={e=>setV('isVirtual', e.target.checked)} style={{width:15,height:15}}/>
            <label htmlFor="event-is-virtual" style={{fontSize:13,color:C.t1,cursor:'pointer'}}>Mark this as a virtual session</label>
          </div>
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
              <input id="event-meeting-link" name="meetingLink" value={f.meetingLink} onChange={set('meetingLink')} placeholder={f.meetingPlatform === 'Google Meet' ? 'Paste the Google Meet link or leave blank to create one' : (MEETING_PLATFORMS.find(option => option.value === f.meetingPlatform)?.placeholder || 'Paste a direct join link or handle')} style={IN}/>
              {meetingPreviewHref && (
                <div style={{marginTop:10,padding:'10px 12px',border:`1px solid ${C.bd}`,borderRadius:10,background:C.bg}}>
                  <div style={{fontSize:11,fontWeight:700,color:C.t2,marginBottom:4,textTransform:'uppercase',letterSpacing:0.4}}>Link preview</div>
                  <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:4}}>{f.meetingPlatform || inferMeetingPlatform(f.meetingPlatform, f.meetingLink) || 'Meeting link'}</div>
                  <div style={{fontSize:12,color:C.t2,wordBreak:'break-all',marginBottom:8}}>{meetingPreviewHref}</div>
                  <a href={meetingPreviewHref} target="_blank" rel="noreferrer noopener" style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 10px',borderRadius:8,background:C.pu,color:C.w,fontSize:12,fontWeight:600,textDecoration:'none'}}>
                    Open preview
                  </a>
                </div>
              )}
              {f.meetingPlatform === 'Google Meet' && (
                <div style={{marginTop:8,fontSize:12,color:C.t2,lineHeight:1.5}}>
                  Google Meet creation is currently unavailable in this workspace. You can still save the event and add a manual link later.
                </div>
              )}
            </div>
          </div>
          <div style={GP}><label htmlFor="event-meeting-instructions" style={LB}>Meeting instructions <span style={{fontSize:12,fontWeight:400,color:C.t3}}>(optional)</span></label><textarea id="event-meeting-instructions" name="meetingInstructions" value={f.meetingInstructions} onChange={set('meetingInstructions')} placeholder="Share access notes, passwords, or Slack channel details" rows={3} style={{...IN,resize:'vertical',lineHeight:1.6}}/></div>
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
function DetailModal({ ev, onClose, onRsvp, isMobile }) {
  const ec = EV_TYPES[ev.type]||{c:C.t2,b:C.bg};
  const meetingPlatform = inferMeetingPlatform(ev.meetingPlatform, ev.meetingLink || ev.meetingHandle);
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
              <div style={{fontSize:13,fontWeight:600,color:C.t1,marginBottom:4}}>{meetingPlatform || ev.meetingPlatform || 'Meeting link'}</div>
              <div style={{fontSize:12,color:C.t2,marginBottom:10,wordBreak:'break-all'}}>{ev.meetingLink || ev.meetingHandle}</div>
              <button onClick={() => window.open(buildMeetingHref(ev.meetingPlatform, ev.meetingLink || ev.meetingHandle), '_blank', 'noopener,noreferrer')} style={{padding:'8px 12px',borderRadius:8,border:'none',background:C.pu,color:C.w,fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                Open {meetingPlatform || ev.meetingPlatform || 'meeting'}
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
          <h3 style={{fontSize:14,fontWeight:700,color:C.t1,margin:'0 0 12px'}}>Speaker notes</h3>
          {ev.speakers?.length ? ev.speakers.map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
              <div style={{width:34,height:34,borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700,color:s.color,flexShrink:0}}>{s.initials}</div>
              <div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{s.name}</div><div style={{fontSize:12,color:C.t3}}>{s.role}</div></div>
            </div>
          )) : <div style={{fontSize:13,color:C.t2,marginBottom:14}}>The session host will share details and introductions before the event begins.</div>}
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
          <div style={{display:'grid',gap:10}}>
            {buildGoogleCalendarLink(ev) && (
              <button onClick={() => window.open(buildGoogleCalendarLink(ev), '_blank', 'noopener,noreferrer')}
                style={{width:'100%',padding:'12px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',background:C.bg,color:C.t1,border:`1px solid ${C.bd}`}}>
                <I k="cal" s={16} c={C.t2}/> Add to Google Calendar
              </button>
            )}
            <button onClick={()=>onRsvp(ev.id)}
              style={{width:'100%',padding:'12px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:ev.rsvped?C.pu:C.w,color:ev.rsvped?C.w:C.pu,border:ev.rsvped?'none':`1.5px solid ${C.pu}`}}>
              {ev.rsvped&&<I k="check" s={16} c={C.w} sw={2.5}/>}{ev.rsvped?'RSVPed':'RSVP now'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════
   DELETE MODAL — responsive width
═══════════════════════════════════════════ */
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
function ViewAllModal({ events, onClose, onOpen, onEdit, onDelete, onApprove, onRsvp, isMobile, isAdmin }) {
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
              onDelete={e=>{onClose();onDelete(e);}} onApprove={e=>{onClose();onApprove(e);}} onRsvp={onRsvp} isAdmin={isAdmin}/>
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

function normalizeEventType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'Office hours';
  if (['office hours', 'office-hours', 'office_hours', 'officehour', 'office hour'].includes(raw)) return 'Office hours';
  if (['member circle', 'member-circle', 'member_circle', 'membercircle'].includes(raw)) return 'Member circle';
  if (['workshop', 'workshops'].includes(raw)) return 'Workshop';
  if (['webinar', 'webinars'].includes(raw)) return 'Webinar';
  if (['replay', 'replays'].includes(raw)) return 'Replay';
  if (['podcast', 'podcasts'].includes(raw)) return 'Podcast';
  return raw.split(/[_-]/).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
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
  const type = normalizeEventType(event.eventType);
  const meetingPlatform = inferMeetingPlatform(event.meetingPlatform, event.meetingLink || event.meetingHandle);
  const meetingLink = event.meetingLink || event.meetingHandle || '';
  const spotsLeft = Math.max(0, (event.capacity || 0) - (event.rsvpCount || 0));

  return {
    id: event.id,
    isPublished: event.isPublished !== false,
    title: event.title,
    desc: event.description || 'Join this live session with the Tribes Capital team.',
    dateLabel,
    dateShort,
    time,
    dur: `${durationMinutes} min`,
    format: meetingPlatform ? `Live ${meetingPlatform}` : (event.isVirtual ? 'Live virtual session' : 'In person'),
    month,
    day: String(day),
    weekday,
    calDay: start.getDate(),
    calMonth: start.getMonth(),
    calYear: start.getFullYear(),
    sortTs: start.getTime(),
    startIso: start.toISOString(),
    endIso: end.toISOString(),
    spotsLeft,
    totalSpots: event.capacity || 0,
    rsvped: false,
    type,
    speakers: [],
    agenda: [],
    meetingPlatform,
    meetingLink,
    meetingInstructions: event.meetingInstructions || '',
    location: event.location || (event.isVirtual ? 'Virtual' : 'TBD'),
    isVirtual: Boolean(event.isVirtual),
    registrationDeadline: event.registrationDeadline || '',
  };
}

function unwrapApiData(response) {
  const body = response?.data ?? response;
  return body?.data ?? body;
}

function isStoredAdmin() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const roles = Array.isArray(user?.roles) ? user.roles : [];
    return Boolean(user?.isAdmin || user?.role === 'admin' || roles.includes('admin') || roles.includes('super-admin'));
  } catch (error) {
    return false;
  }
}

/* ═══════════════════════════════════════════
   MAIN
═══════════════════════════════════════════ */
export default function OfficeHoursEvents({ isMobile: isMobileProp, isMobileParam }) {
  const bp = useBreakpoint();
  const isMobile = isMobileProp ?? isMobileParam ?? bp.isMobile;
  const [events,      setEvents]      = useState([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [hosts, setHosts] = useState([]);
  const [activeFilter,setFilter]      = useState('all');
  const [showCreate,  setCreate]      = useState(false);
  const [editEv,      setEdit]        = useState(null);
  const [deleteEv,    setDel]         = useState(null);
  const [detailEv,    setDetail]      = useState(null);
  const [viewAll,     setViewAll]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [notifyLoading, setNotifyLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => isStoredAdmin());

  useEffect(() => {
    let isMounted = true;
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    const loadEvents = async () => {
      try {
        const response = await eventsAPI.list({ skip: 0, take: 20 });
        const eventItems = unwrapApiData(response);
        let mapped = (Array.isArray(eventItems) ? eventItems : []).map(formatEventForUi);

        if (isAdmin) {
          try {
            const pendingResponse = await eventsAPI.listPending();
            const pendingEvents = unwrapApiData(pendingResponse);
            const pendingMapped = (Array.isArray(pendingEvents) ? pendingEvents : []).map(formatEventForUi);
            mapped = [...pendingMapped, ...mapped.filter(event => event.isPublished)];
          } catch (error) {
            // The public event list remains usable if the admin queue is unavailable.
          }
        }

        if (isMounted) {
          setEvents(mapped);
          setEventsError(null);
        }

        if (authToken && mapped.length > 0) {
          const statuses = await Promise.allSettled(mapped.map(async (event) => {
            const resp = await eventsAPI.getRSVPStatus(event.id);
            return { id: event.id, attending: Boolean(resp.data?.attending) };
          }));

          const statusMap = new Map(statuses
            .filter(result => result.status === 'fulfilled')
            .map(result => result.status === 'fulfilled' ? [result.value.id, result.value.attending] : []));

          if (isMounted) {
            setEvents((prev) => prev.map((event) => ({ ...event, rsvped: statusMap.get(event.id) || event.rsvped })));
          }
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

  useEffect(() => {
    let isMounted = true;
    communityAPI.listMembers({ take: 3 }).then((response) => {
      const payload = unwrapApiData(response);
      const members = Array.isArray(payload) ? payload : payload?.data || [];
      if (isMounted) setHosts(members.slice(0, 3));
    }).catch(() => {
      if (isMounted) setHosts([]);
    });
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const refreshAdminStatus = () => setIsAdmin(isStoredAdmin());
    window.addEventListener('storage', refreshAdminStatus);
    window.addEventListener('tribes:auth-updated', refreshAdminStatus);
    return () => {
      window.removeEventListener('storage', refreshAdminStatus);
      window.removeEventListener('tribes:auth-updated', refreshAdminStatus);
    };
  }, []);

  const showToast = msg => setToast(msg);

  const handleToggleHostFollow = async (member) => {
    try {
      const response = await communityAPI.toggleFollow(member.id);
      const result = unwrapApiData(response);
      setHosts((current) => current.map((host) => host.id === member.id ? { ...host, isFollowedByMe: result.following } : host));
    } catch (error) {
      showToast(error?.response?.data?.message || 'Unable to update this follow right now.');
    }
  };

  const handleNotifyMe = async () => {
    if (notifyLoading) return;
    setNotifyLoading(true);

    try {
      await notificationsAPI.create({
        type: 'event-notification',
        title: 'Upcoming events alert enabled',
        message: 'You will receive notifications for future events and office hours updates.',
      });
      try {
        window.dispatchEvent(new CustomEvent('tribes:notifications-update', { detail: { type: 'notifications-updated' } }));
      } catch (e) {
        // ignore
      }
      showToast('You are now subscribed to event updates.');
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to subscribe to event updates right now.';
      showToast(`Notification failed: ${message}`);
    } finally {
      setNotifyLoading(false);
    }
  };

  const handleRsvp = async id => {
    const event = events.find(e => e.id === id);
    if (!event) return;

    try {
      if (!event.rsvped) {
        await eventsAPI.rsvp(id, 1);
      } else {
        await eventsAPI.cancelRSVP(id);
      }

      const nextRsvpCount = event.rsvped ? Math.max(0, (event.rsvpCount || 0) - 1) : (event.rsvpCount || 0) + 1;
      const totalSpots = event.totalSpots || event.capacity || 0;

      setEvents(p => p.map(e => e.id === id ? {
        ...e,
        rsvped: !e.rsvped,
        rsvpCount: nextRsvpCount,
        spotsLeft: Math.max(0, totalSpots - nextRsvpCount),
        totalSpots,
      } : e));
      if (detailEv?.id === id) setDetail(p => ({ ...p, rsvped: !p.rsvped, rsvpCount: nextRsvpCount, spotsLeft: Math.max(0, (p.totalSpots || p.capacity || 0) - nextRsvpCount), totalSpots: p.totalSpots || p.capacity || 0 }));
      try {
        window.dispatchEvent(new CustomEvent('tribes:data-update', { detail: { type: 'events-updated', id } }));
        window.dispatchEvent(new CustomEvent('tribes:notifications-update', { detail: { type: 'events-updated', id } }));
      } catch (e) {
        // ignore
      }
      showToast(event.rsvped ? 'RSVP cancelled.' : 'RSVP confirmed.');
    } catch (error) {
      showToast('Unable to update your RSVP right now.');
    }
  };

  const handleApprove = async event => {
    try {
      const response = await eventsAPI.approve(event.id);
      const approved = formatEventForUi(unwrapApiData(response));
      setEvents(previous => previous.map(item => item.id === event.id ? { ...approved, rsvped: item.rsvped } : item));
      showToast('Office hours approved and published.');
    } catch (error) {
      showToast(`Unable to approve event: ${error?.response?.data?.message || error?.message || 'Please try again.'}`);
    }
  };

  const handleSave = async form => {
    const title = String(form.title || '').trim();
    const normalizedDate = normalizeDateInput(form.date || '');
    const time = String(form.time || '').trim();
    const durationMinutes = parseDurationMinutes(form.duration);
    const dateString = normalizedDate
      ? `${normalizedDate}T${time || '00:00'}:00`
      : '';
    const startDate = dateString ? new Date(dateString) : new Date();
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    const registrationDeadline = form.registrationDeadline
      ? new Date(`${normalizeDateInput(form.registrationDeadline)}T00:00:00`)
      : null;
    const parsedCapacity = Number.parseInt(String(form.maxCap ?? ''), 10);
    const normalizedCapacity = Number.isInteger(parsedCapacity) && parsedCapacity >= 1 ? parsedCapacity : 100;

    if (!title || !form.date || !time || Number.isNaN(startDate.getTime())) {
      showToast('Please provide a valid title, date, and time for this event.');
      return;
    }

    if (!durationMinutes || Number.isNaN(durationMinutes)) {
      showToast('Enter a valid duration, such as 90 min or 1 hour 30 min.');
      return;
    }

    if (form.registrationDeadline && Number.isNaN(registrationDeadline.getTime())) {
      showToast('Please provide a valid registration deadline date.');
      return;
    }

    const meetingLinkValue = String(form.meetingLink || '').trim();
    const payload = {
      title,
      description: String(form.desc || '').trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      location: String(form.location || '').trim() || ((form.isVirtual || form.meetingPlatform || meetingLinkValue) ? 'Virtual' : 'TBD'),
      isVirtual: !!form.isVirtual || !!form.meetingPlatform || !!meetingLinkValue,
      capacity: normalizedCapacity,
      eventType: String(form.type || 'Office hours'),
      meetingPlatform: inferMeetingPlatform(form.meetingPlatform, meetingLinkValue),
      meetingLink: meetingLinkValue || undefined,
      meetingHandle: meetingLinkValue || undefined,
      meetingInstructions: String(form.meetingInstructions || '').trim() || undefined,
      registrationDeadline: registrationDeadline ? registrationDeadline.toISOString() : undefined,
    };

    try {
      if (editEv) {
        const response = await eventsAPI.update(editEv.id, payload);
        const updated = formatEventForUi(unwrapApiData(response));
        setEvents(p => p.map(e => e.id === editEv.id ? { ...updated, rsvped: e.rsvped } : e));
        setEdit(null);
        showToast('Event updated successfully');
      } else {
        const response = await eventsAPI.create(payload);
        const created = formatEventForUi(unwrapApiData(response));

        if (!created?.id) {
          throw new Error('Server did not return a valid event payload.');
        }

        if (isAdmin) {
          setEvents(p => [created, ...p]);
        }
        setCreate(false);
        try {
          window.dispatchEvent(new CustomEvent('tribes:data-update', { detail: { type: 'events-updated', id: created.id } }));
          window.dispatchEvent(new CustomEvent('tribes:notifications-update', { detail: { type: 'events-updated', id: created.id } }));
        } catch (e) {
          // ignore
        }
        showToast('Event created successfully');
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Unable to save this event right now.';
      showToast(`Unable to save event: ${message}`);
    }
  };

  const FILTERS = [
    { id: 'all', l: 'All events' },
    { id: 'oh', l: 'Office hours', type: 'Office hours' },
    { id: 'mc', l: 'Member circles', type: 'Member circle' },
    { id: 'ws', l: 'Workshops', type: 'Workshop' },
    { id: 'wb', l: 'Webinars', type: 'Webinar' },
    { id: 'rp', l: 'Replays', type: 'Replay' },
  ];
  const filteredEvents = useMemo(() => {
    const selectedFilter = FILTERS.find((filter) => filter.id === activeFilter);
    return events
      .filter((event) => !selectedFilter?.type || normalizeEventType(event.type) === selectedFilter.type)
      .sort((a, b) => a.sortTs - b.sortTs);
  }, [events, activeFilter]);
  const displayEvents = filteredEvents;
  const rsvpedEvents = useMemo(() => events.filter(e => e.rsvped).slice(0, 3), [events]);
  const featuredEvent = displayEvents[0] || null;
  const remainingEvents = featuredEvent ? displayEvents.slice(1) : [];

  const pageGrid = isMobile ? '1fr' : 'minmax(0, 1fr) 300px';
  const mainPad = isMobile
    ? '24px var(--tc-page-gutter-x, 18px) 60px'
    : '32px var(--tc-page-gutter-x, 32px) 60px';

  return (
    <div className="oe-page" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <main className="oe-page-content" style={{ flex: 1, overflowY: 'auto', padding: mainPad }}>
        <header className="oe-page-header">
          <div><h1>Office Hours &amp; Events</h1><p>Join live sessions, workshops and Q&amp;As with contractors and energy experts.</p></div>
          <div className="oe-page-actions">
            <button type="button" className="oe-notify-button" onClick={handleNotifyMe} disabled={notifyLoading}>{notifyLoading ? 'Subscribing…' : 'Notify me'}</button>
            <button type="button" className="oe-create-button" onClick={() => setCreate(true)}><I k="plus" s={15} c="#fff" sw={2}/>Create event</button>
          </div>
        </header>

        <section className="oe-nextup" aria-live="polite">
          {loadingEvents ? <div><span className="oe-eyebrow">NEXT UP</span><h2>Loading sessions…</h2></div> : featuredEvent ? <>
            <div className="oe-nextup-copy">
              <span className="oe-eyebrow">NEXT UP · {featuredEvent.type.toUpperCase()}</span>
              <h2>{featuredEvent.title}</h2>
              <p>{featuredEvent.dateShort} · {featuredEvent.isVirtual ? 'Online' : featuredEvent.location} · Hosted by {featuredEvent.hostName || 'Tribes Capital'}</p>
            </div>
            <div className="oe-nextup-actions">
              <button type="button" className="oe-nextup-primary" onClick={() => handleRsvp(featuredEvent.id)}>{featuredEvent.rsvped ? 'Registered' : 'Register'}</button>
              <button type="button" className="oe-nextup-secondary" onClick={() => setDetail(featuredEvent)}>View details</button>
            </div>
          </> : <div><span className="oe-eyebrow">COMMUNITY CALENDAR</span><h2>{eventsError ? 'Events are temporarily unavailable' : 'No upcoming events right now'}</h2><p>{eventsError || 'New sessions with contractors and energy experts are added regularly.'}</p></div>}
        </section>

        <div className="oe-filter-row" role="group" aria-label="Filter events by type">
          {FILTERS.map((filter) => <button type="button" key={filter.id} className={`oe-filter${activeFilter === filter.id ? ' active' : ''}`} aria-pressed={activeFilter === filter.id} onClick={() => setFilter(filter.id)}>{filter.l}</button>)}
        </div>

        <div className="oe-layout" style={{ gridTemplateColumns: pageGrid }}>
          <section className="oe-main-list" aria-labelledby="oe-upcoming-title">
            <div className="oe-list-heading"><h2 id="oe-upcoming-title">Upcoming events <span>({displayEvents.length})</span></h2><button type="button" onClick={() => setViewAll(true)}>View all <I k="arr" s={14} c="#6700A6"/></button></div>
            {loadingEvents && <div className="oe-list-empty" role="status">Loading events…</div>}
            {!loadingEvents && displayEvents.length === 0 && <div className="oe-list-empty"><h3>{eventsError ? 'Could not load events' : 'No events in this category yet'}</h3><p>{eventsError || 'Try another category or get notified when a new session is scheduled.'}</p><button type="button" onClick={handleNotifyMe} disabled={notifyLoading}>Notify me about new events</button></div>}
            {!loadingEvents && displayEvents.length > 0 && remainingEvents.length === 0 && <div className="oe-list-empty"><h3>Your next session is featured above</h3><p>More sessions will appear here as they are scheduled.</p></div>}
            {remainingEvents.map((event) => <EventCard key={event.id} ev={event} isMobile={isMobile} onOpen={setDetail} onEdit={setEdit} onDelete={setDel} onApprove={handleApprove} onRsvp={handleRsvp} isAdmin={isAdmin}/>)}
          </section>

          <aside className="oe-sidebar">
            <section className="oe-side-panel">
              <div className="oe-side-heading"><h2>Your registrations</h2>{rsvpedEvents.length > 0 && <button type="button" onClick={() => setViewAll(true)}>View all</button>}</div>
              {rsvpedEvents.length ? rsvpedEvents.map((event) => <button type="button" className="oe-registration" key={event.id} onClick={() => setDetail(event)}><span className="oe-small-date"><b>{event.month}</b><strong>{event.day}</strong></span><span className="oe-registration-copy"><b>{event.title}</b><small>{event.dateShort}</small></span><span className="oe-rsvped">Registered</span></button>) : <p className="oe-side-empty">You haven't registered for any upcoming events yet.</p>}
            </section>
            <section className="oe-side-panel">
              <div className="oe-side-heading"><h2>Hosts to follow</h2></div>
              {hosts.length ? hosts.map((host) => { const name = [host.firstName, host.lastName].filter(Boolean).join(' ') || host.displayName || 'Member'; return <div className="oe-host-row" key={host.id}><span className="oe-host-avatar">{name.slice(0, 1).toUpperCase()}</span><span className="oe-host-copy"><b>{name}</b><small>{host.occupation || 'Community member'}</small></span><button type="button" className="oe-follow-button" onClick={() => void handleToggleHostFollow(host)}>{host.isFollowedByMe ? 'Following' : 'Follow'}</button></div>; }) : <p className="oe-side-empty">Community hosts will appear here.</p>}
            </section>
            <section className="oe-side-panel oe-recordings-panel"><h2>Missed a session?</h2><p>Recordings from past webinars and workshops are available to watch on demand.</p><button type="button" onClick={() => setFilter('rp')}>Browse replays <I k="arr" s={13} c="#6700A6"/></button></section>
          </aside>
        </div>
      </main>

      {/* ── MODALS ── */}
      {showCreate && <EventFormModal title="Create event" onClose={()=>setCreate(false)} onSave={handleSave} isMobile={isMobile}/>}
      {editEv     && <EventFormModal title="Edit event" initial={editEv} onClose={()=>setEdit(null)} onSave={handleSave} isMobile={isMobile}/>}
      {deleteEv   && <DeleteModal ev={deleteEv} isMobile={isMobile} onClose={()=>setDel(null)} onConfirm={async ()=>{
        try {
          await eventsAPI.delete(deleteEv.id);
          setEvents(p=>p.filter(e=>e.id!==deleteEv.id));
          setDel(null);
          showToast('Event deleted successfully');
          window.dispatchEvent(new CustomEvent('tribes:data-update',{detail:{type:'events-updated', id:deleteEv.id}}));
        } catch (error) {
          showToast(`Unable to delete event: ${error?.response?.data?.message || error?.message || 'Please try again.'}`);
        }
      }}/>
      }
      {detailEv   && <DetailModal ev={detailEv} isMobile={isMobile} onClose={()=>setDetail(null)} onRsvp={handleRsvp}/>}
      {viewAll    && <ViewAllModal events={displayEvents} isMobile={isMobile} isAdmin={isAdmin} onClose={()=>setViewAll(false)} onOpen={setDetail} onEdit={setEdit} onDelete={setDel} onApprove={handleApprove} onRsvp={handleRsvp}/>}
      {toast      && <Toast msg={toast} onDone={()=>setToast(null)}/>}

      <style>{`
        *{box-sizing:border-box;}
        button,input,select,textarea{font-family:inherit;}
        ::-webkit-scrollbar{width:4px;height:4px;}
        ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:10px;}
        @media(max-width:639px){
          .hide-mobile{display:none!important;}
        }
          .tc-events-nextup{display:flex;align-items:center;justify-content:space-between;gap:28px;min-height:172px;margin-bottom:22px;padding:26px 30px;border-radius:12px;background:linear-gradient(100deg,#6700A6 0%,#8A22C8 100%);color:#fff;}
          .tc-events-empty{display:flex;min-height:310px;flex-direction:column;align-items:center;justify-content:center;padding:28px;text-align:center;border:1px solid #ECECF0;border-radius:12px;background:#fff;}
          .tc-events-empty-icon{display:grid;place-items:center;width:52px;height:52px;margin-bottom:16px;border-radius:50%;background:#FAF5FF;}
          .tc-events-empty h3{margin:0 0 8px;color:#1A1A1A;font-size:18px;font-weight:600;}
          .tc-events-empty p{max-width:460px;margin:0;color:#7A7A85;font-size:13px;line-height:1.6;}
          .tc-events-empty-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin-top:18px;}
          .tc-events-button-solid,.tc-events-button-quiet{min-height:38px;padding:0 16px;border-radius:6px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;}
          .tc-events-button-solid{border:1px solid #6700A6;background:#6700A6;color:#fff;}
          .tc-events-button-quiet{border:1px solid #D9D9E0;background:#fff;color:#6700A6;}
          .tc-events-nextup-copy{min-width:0;max-width:760px;}
          .tc-events-kicker{display:block;margin-bottom:8px;color:#F1E4FA;font-size:11px;font-weight:700;letter-spacing:.5px;}
          .tc-events-nextup h2{margin:0 0 6px;color:#fff;font-size:24px;line-height:1.3;font-weight:600;}
          .tc-events-nextup p{margin:0 0 12px;color:#F1E4FA;font-size:13px;line-height:1.55;}
          .tc-events-nextup-meta{display:flex;flex-wrap:wrap;gap:8px 18px;color:#F1E4FA;font-size:12px;}
          .tc-events-nextup-meta span{display:inline-flex;align-items:center;gap:6px;}
          .tc-events-nextup-actions{display:flex;flex:none;flex-wrap:wrap;align-items:center;gap:10px;}
          .tc-events-button-light,.tc-events-button-outline{min-height:40px;padding:0 18px;border-radius:6px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;}
          .tc-events-button-light{border:1px solid #fff;background:#fff;color:#6700A6;}
          .tc-events-button-outline{border:1px solid rgba(255,255,255,.65);background:transparent;color:#fff;}
          .tc-events-calendar-link{width:100%;padding:4px;border:0;background:transparent;color:#F1E4FA;font-family:inherit;font-size:12px;font-weight:500;text-align:center;cursor:pointer;}
          .tc-events-sidebar{display:grid;gap:16px;min-width:0;}
          .tc-events-side-card{padding:20px;border:1px solid #ECECF0;border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(17,17,20,.04);}
          .tc-events-side-card h3{margin:0;color:#1A1A1A;font-size:15px;line-height:20px;font-weight:500;}
          .tc-events-side-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;}
          .tc-events-side-heading button,.tc-events-info-card button{display:inline-flex;align-items:center;gap:6px;padding:0;border:0;background:none;color:#6700A6;font:500 12px inherit;cursor:pointer;}
          .tc-events-registration{display:flex;align-items:center;gap:12px;width:100%;margin-bottom:12px;padding:0;border:0;background:none;text-align:left;cursor:pointer;}
          .tc-events-registration:last-child{margin-bottom:0;}
          .tc-events-registration-date{display:flex;flex:none;flex-direction:column;align-items:center;justify-content:center;width:46px;height:43px;border:1px solid #E6D6F2;border-radius:6px;background:#FAF5FF;}
          .tc-events-registration-date b{color:#6700A6;font-size:9px;font-weight:500;line-height:11px;}
          .tc-events-registration-date strong{color:#1A1A1A;font-size:17px;font-weight:600;line-height:20px;}
          .tc-events-registration-copy{display:grid;flex:1;min-width:0;gap:3px;}
          .tc-events-registration-copy b{overflow:hidden;color:#1A1A1A;font-size:12px;font-weight:500;text-overflow:ellipsis;white-space:nowrap;}
          .tc-events-registration-copy small{color:#8A8A93;font-size:11px;}
          .tc-events-rsvped{padding:3px 7px;border-radius:6px;background:#DDF6E8;color:#0F8A5F;font-size:10px;font-weight:500;}
          .tc-events-empty-registration,.tc-events-info-card p{margin:12px 0 0;color:#8A8A93;font-size:12px;line-height:1.55;}
          .tc-events-info-card{background:#FAF5FF;border-color:#E9D5FF;}
          .tc-events-info-card h3{color:#6700A6;font-size:13px;}
          .tc-events-info-card button{margin-top:14px;font-size:12px;}
          .tc-events-expect-card ul{display:grid;gap:14px;margin:14px 0 0;padding:0;list-style:none;}
          .tc-events-expect-card li{display:flex;align-items:flex-start;gap:10px;}
          .tc-events-expect-card li>span:last-child{display:grid;gap:3px;}
          .tc-events-expect-card li b{color:#1A1A1A;font-size:12px;font-weight:500;}
          .tc-events-expect-card li small{color:#8A8A93;font-size:11px;line-height:1.5;}
          .tc-events-dot{width:8px;height:8px;margin-top:4px;border-radius:50%;background:#6700A6;flex:none;}
          .tc-events-dot.green{background:#16A34A;}.tc-events-dot.amber{background:#D97706;}
          @media(max-width:760px){.tc-events-nextup{align-items:flex-start;flex-direction:column;gap:18px;padding:22px 20px}.tc-events-nextup h2{font-size:20px}.tc-events-nextup-actions{width:100%}.tc-events-button-light,.tc-events-button-outline{flex:1}.tc-events-calendar-link{width:auto}.tc-event-card{gap:12px!important;padding:12px!important}.tc-event-date{width:48px!important;min-width:48px!important;height:62px!important}.tc-events-registration{align-items:flex-start}.tc-events-rsvped{margin-top:4px}.tc-events-empty{min-height:260px;padding:22px 16px}.tc-events-empty-actions{width:100%;flex-direction:column}.tc-events-empty-actions button{width:100%}}
        .oe-page{background:#F7F7F8;color:#1F2937;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:14px}
        .oe-page-content{max-width:1240px;width:100%;margin:0 auto}
        .oe-page-header{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:22px}
        .oe-page-header h1{margin:0 0 4px;color:#1F2937;font-size:24px;line-height:32px;font-weight:600}
        .oe-page-header p{max-width:700px;margin:0;color:#6B6B76;font-size:14px;line-height:20px}
        .oe-page-actions{display:flex;flex:none;gap:10px}
        .oe-notify-button,.oe-create-button{display:inline-flex;min-height:40px;align-items:center;justify-content:center;gap:7px;padding:0 16px;border-radius:6px;font-family:inherit;font-size:13px;font-weight:500;white-space:nowrap;cursor:pointer}
        .oe-notify-button{border:1px solid #DCDCE2;background:#fff;color:#4A4A55}.oe-create-button{border:1px solid #6700A6;background:#6700A6;color:#fff}
        .oe-nextup{display:flex;align-items:center;justify-content:space-between;gap:28px;min-height:148px;margin-bottom:22px;padding:24px 28px;border-radius:12px;background:linear-gradient(100deg,#6700A6 0%,#8A22C8 100%);color:#fff}
        .oe-nextup-copy{min-width:0;max-width:760px}.oe-eyebrow{display:block;margin-bottom:8px;color:#F1E4FA;font-size:11px;font-weight:600;letter-spacing:.04em}
        .oe-nextup h2{margin:0 0 5px;color:#fff;font-size:22px;line-height:30px;font-weight:600}.oe-nextup p{margin:0;color:#F1E4FA;font-size:13px;line-height:18px}
        .oe-nextup-actions{display:flex;flex:none;align-items:center;gap:10px}.oe-nextup-primary,.oe-nextup-secondary{min-height:40px;padding:0 18px;border-radius:6px;font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;white-space:nowrap}
        .oe-nextup-primary{border:1px solid #fff;background:#fff;color:#6700A6}.oe-nextup-secondary{border:1px solid rgba(255,255,255,.6);background:transparent;color:#fff}
        .oe-filter-row{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:20px}.oe-filter{min-height:32px;padding:0 13px;border:1px solid #DCDCE2;border-radius:999px;background:#fff;color:#4A4A55;font-family:inherit;font-size:12px;cursor:pointer}.oe-filter.active{border-color:#6700A6;background:#6700A6;color:#fff}
        .oe-layout{display:grid;align-items:start;gap:20px}.oe-main-list{min-width:0}.oe-list-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:13px}
        .oe-list-heading h2{margin:0;color:#1A1A1A;font-size:15px;font-weight:500}.oe-list-heading h2 span{color:#8A8A93;font-size:13px;font-weight:400}
        .oe-list-heading button,.oe-recordings-panel button{display:inline-flex;align-items:center;gap:6px;padding:0;border:0;background:none;color:#6700A6;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer}
        .oe-event-card{display:flex;align-items:flex-start;gap:16px;margin-bottom:14px;padding:17px 20px;border:1px solid #ECECF0;border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(17,17,20,.05)}
        .oe-date-tile{display:flex;width:58px;height:66px;flex:none;flex-direction:column;align-items:center;justify-content:center;border:1px solid #E6D6F2;border-radius:8px;background:#FAF5FF}.oe-date-tile span{color:#6700A6;font-size:11px;line-height:14px;text-transform:uppercase}.oe-date-tile strong{color:#1A1A1A;font-size:22px;line-height:28px;font-weight:600}
        .oe-event-info{flex:1;min-width:0}.oe-event-topline{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin-bottom:5px}.oe-type-pill,.oe-pending-pill{padding:3px 8px;border-radius:6px;font-size:10px;line-height:14px;font-weight:500}.oe-pending-pill{background:#FEF3C7;color:#B45309}
        .oe-admin-actions{display:flex;flex-wrap:wrap;gap:5px;margin-left:auto}.oe-admin-actions button{padding:4px 8px;border:1px solid #E5E7EB;border-radius:5px;background:#fff;color:#475467;font-size:10px;cursor:pointer}
        .oe-event-title{display:block;padding:0;border:0;background:none;color:#1A1A1A;text-align:left;font-family:inherit;font-size:16px;line-height:23px;font-weight:500;cursor:pointer}.oe-event-host{margin:2px 0 8px;color:#7A7A85;font-size:12px}
        .oe-event-meta{display:flex;flex-wrap:wrap;gap:8px 16px;color:#8A8A93;font-size:12px;line-height:18px}.oe-event-meta span{display:inline-flex;align-items:center;gap:6px}
        .oe-event-actions{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:12px;padding-top:10px;border-top:1px solid #ECECF0}.oe-event-actions>div{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:7px}.oe-spots{color:#6700A6;font-size:11px;font-weight:500}
        .oe-secondary-action,.oe-rsvp-action{min-height:32px;padding:0 11px;border-radius:6px;font-family:inherit;font-size:11px;font-weight:500;cursor:pointer}.oe-secondary-action{border:1px solid #D9C2EC;background:#fff;color:#6700A6}.oe-rsvp-action{border:1px solid #6700A6;background:#6700A6;color:#fff}.oe-rsvp-action.registered{border-color:#D9C2EC;background:#fff;color:#6700A6}
        .oe-list-empty{display:grid;min-height:220px;place-content:center;justify-items:center;gap:9px;padding:24px;border:1px solid #ECECF0;border-radius:12px;background:#fff;text-align:center}.oe-list-empty h3{margin:0;color:#1A1A1A;font-size:16px;font-weight:500}.oe-list-empty p{max-width:460px;margin:0;color:#7A7A85;font-size:12px;line-height:1.6}.oe-list-empty button{min-height:36px;margin-top:5px;padding:0 14px;border:1px solid #6700A6;border-radius:6px;background:#6700A6;color:#fff;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer}
        .oe-sidebar{display:grid;min-width:0;gap:18px}.oe-side-panel{padding:20px;border:1px solid #ECECF0;border-radius:12px;background:#fff;box-shadow:0 1px 3px rgba(17,17,20,.04)}.oe-side-heading{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.oe-side-panel h2{margin:0;color:#1A1A1A;font-size:15px;line-height:20px;font-weight:500}.oe-side-heading button{padding:0;border:0;background:none;color:#6700A6;font-family:inherit;font-size:12px;font-weight:500;cursor:pointer}
        .oe-registration{display:flex;width:100%;align-items:center;gap:10px;margin-bottom:12px;padding:0;border:0;background:none;text-align:left;cursor:pointer}.oe-small-date{display:flex;width:46px;height:43px;flex:none;flex-direction:column;align-items:center;justify-content:center;border:1px solid #E6D6F2;border-radius:6px;background:#FAF5FF}.oe-small-date b{color:#6700A6;font-size:9px;line-height:11px;font-weight:500}.oe-small-date strong{color:#1A1A1A;font-size:17px;line-height:20px}
        .oe-registration-copy,.oe-host-copy{display:grid;flex:1;min-width:0;gap:3px}.oe-registration-copy b,.oe-host-copy b{overflow:hidden;color:#1A1A1A;font-size:12px;font-weight:500;text-overflow:ellipsis;white-space:nowrap}.oe-registration-copy small,.oe-host-copy small{color:#8A8A93;font-size:11px}.oe-rsvped{padding:3px 7px;border-radius:6px;background:#DDF6E8;color:#0F8A5F;font-size:10px}.oe-side-empty{margin:0;color:#8A8A93;font-size:12px;line-height:1.55}
        .oe-host-row{display:flex;align-items:center;gap:10px;margin-bottom:12px}.oe-host-row:last-child{margin-bottom:0}.oe-host-avatar{display:grid;width:36px;height:36px;flex:none;place-items:center;border-radius:50%;background:#FAF5FF;color:#6700A6;font-size:13px;font-weight:600}.oe-follow-button{min-height:25px;padding:0 10px;border:0;border-radius:6px;background:#F3E8FF;color:#6700A6;font-size:10px;cursor:pointer}
        .oe-recordings-panel{border-color:#E9D5FF;background:#FAF5FF}.oe-recordings-panel h2{color:#6700A6;font-size:13px}.oe-recordings-panel p{margin:10px 0;color:#8A8A93;font-size:12px;line-height:1.55}
        @media(max-width:960px){.oe-layout{grid-template-columns:1fr!important}.oe-sidebar{grid-template-columns:repeat(2,minmax(0,1fr))}.oe-recordings-panel{grid-column:1/-1}}
        @media(max-width:640px){.oe-page-header{align-items:flex-start;flex-direction:column}.oe-page-header h1{font-size:22px}.oe-page-actions{width:100%}.oe-page-actions button{flex:1}.oe-nextup{align-items:flex-start;flex-direction:column;gap:16px;padding:22px 20px}.oe-nextup-actions{width:100%}.oe-nextup-actions button{flex:1}.oe-layout{gap:16px}.oe-sidebar{grid-template-columns:1fr}.oe-recordings-panel{grid-column:auto}.oe-event-card{gap:12px;padding:13px}.oe-date-tile{width:48px;height:62px}.oe-event-actions{align-items:flex-start;flex-direction:column}.oe-event-actions>div{width:100%;justify-content:flex-start}.oe-spots{padding-top:2px}}
      `}</style>
    </div>
  );
}
