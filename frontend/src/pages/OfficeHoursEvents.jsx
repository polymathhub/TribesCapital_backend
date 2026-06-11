import React, { useState, useEffect, useRef } from "react";

/* ─── NOTIFICATION & CALENDAR UTILITIES ─── */
const NotificationManager = {
  // Request notification permissions
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.log('Browser does not support notifications');
      return false;
    }
    if (Notification.permission === 'granted') {
      return true;
    }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  },

  // Send system notification with click handler
  notify: (title, options = {}) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%235B21B6"/><circle cx="35" cy="35" r="8" fill="white"/><path d="M35 50 L50 65 L70 35" stroke="white" stroke-width="4" fill="none" stroke-linecap="round"/></svg>',
        badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%235B21B6"/></svg>',
        tag: options.tag || 'notification',
        requireInteraction: true,
        ...options
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return notification;
    }
  },

  // Schedule notification for event (persistent with local storage)
  scheduleEventNotification: (event, minutesBefore = 15) => {
    try {
      const [month, day, year] = [event.calMonth + 1, event.calDay, event.calYear];
      const [hours, minutes] = event.time.split(':').map(t => {
        const num = parseInt(t);
        return t.includes('PM') && num !== 12 ? num + 12 : t.includes('AM') && num === 12 ? 0 : num;
      });
      
      const eventTime = new Date(year, month - 1, day, hours || 0, minutes || 0);
      const now = new Date();
      const notificationTime = new Date(eventTime.getTime() - minutesBefore * 60000);
      const delay = notificationTime.getTime() - now.getTime();

      // Save to local storage for persistence
      const scheduled = JSON.parse(localStorage.getItem('scheduledNotifications') || '{}');
      scheduled[`event-${event.id}`] = {
        title: event.title,
        eventId: event.id,
        notificationTime: notificationTime.toISOString(),
        minutesBefore
      };
      localStorage.setItem('scheduledNotifications', JSON.stringify(scheduled));

      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          NotificationManager.notify(`Upcoming: ${event.title}`, {
            body: `Starting in ${minutesBefore} minutes\n${event.time} GMT`,
            tag: `event-${event.id}`,
            requireInteraction: true
          });
          NotificationManager.playAlertSound();
          // Store that notification was sent
          const sent = JSON.parse(localStorage.getItem('sentNotifications') || '{}');
          sent[`event-${event.id}`] = new Date().toISOString();
          localStorage.setItem('sentNotifications', JSON.stringify(sent));
        }, delay);
        
        // Store timeout ID for potential clearing
        const timeouts = JSON.parse(localStorage.getItem('notificationTimeouts') || '{}');
        timeouts[`event-${event.id}`] = timeoutId;
        localStorage.setItem('notificationTimeouts', JSON.stringify(timeouts));
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return false;
    }
  },

  // Play alert sound with multiple tones
  playAlertSound: () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create multiple oscillators for a more noticeable alert
      const frequencies = [800, 600, 800];
      const duration = 0.3;
      
      frequencies.forEach((freq, idx) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        oscillator.connect(gain);
        gain.connect(audioContext.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + (idx * 0.1);
        gain.gain.setValueAtTime(0.3, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (e) {
      console.error('Error playing alert sound:', e);
    }
  },

  // Generate iCal format for calendar export
  generateICalEvent: (event) => {
    const [month, day, year] = [event.calMonth + 1, event.calDay, event.calYear];
    const [hours, minutes] = event.time.split(':').map(t => {
      const num = parseInt(t);
      return t.includes('PM') && num !== 12 ? num + 12 : t.includes('AM') && num === 12 ? 0 : num;
    });

    const startDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
    const durationMins = parseInt(event.dur) || 90;
    const endDate = new Date(startDate.getTime() + durationMins * 60000);

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const mins = String(date.getMinutes()).padStart(2, '0');
      const secs = String(date.getSeconds()).padStart(2, '0');
      return `${year}${month}${day}T${hours}${mins}${secs}Z`;
    };

    const iCal = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TribesCapital//Events//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:event-${event.id}@tribescapital.com
DTSTAMP:${formatDateTime(new Date())}
DTSTART:${formatDateTime(startDate)}
DTEND:${formatDateTime(endDate)}
SUMMARY:${event.title}
DESCRIPTION:${event.desc}\n\nType: ${event.type}\nFormat: ${event.format}\nSpeakers: ${event.speakers.map(s => s.name).join(', ')}
LOCATION:${event.format.includes('Zoom') ? 'Zoom' : 'TBD'}
CATEGORIES:${event.type}
ATTENDEE:mailto:user@tribescapital.com
BEGIN:VALARM
TRIGGER:-PT15M
DESCRIPTION:Reminder: ${event.title}
ACTION:DISPLAY
END:VALARM
END:VEVENT
END:VCALENDAR`;

    return iCal;
  },

  // Generate Google Calendar URL
  generateGoogleCalendarUrl: (event) => {
    const [month, day, year] = [event.calMonth + 1, event.calDay, event.calYear];
    const [hours, minutes] = event.time.split(':').map(t => {
      const num = parseInt(t);
      return t.includes('PM') && num !== 12 ? num + 12 : t.includes('AM') && num === 12 ? 0 : num;
    });

    const startDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
    const durationMins = parseInt(event.dur) || 90;
    const endDate = new Date(startDate.getTime() + durationMins * 60000);

    const formatGoogleDate = (date) => date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: event.title,
      details: `${event.desc}\n\nType: ${event.type}\nSpeakers: ${event.speakers.map(s => s.name).join(', ')}`,
      location: event.format.includes('Zoom') ? 'Zoom' : 'TBD',
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  },

  // Generate Outlook Calendar URL
  generateOutlookCalendarUrl: (event) => {
    const [month, day, year] = [event.calMonth + 1, event.calDay, event.calYear];
    const [hours, minutes] = event.time.split(':').map(t => {
      const num = parseInt(t);
      return t.includes('PM') && num !== 12 ? num + 12 : t.includes('AM') && num === 12 ? 0 : num;
    });

    const startDate = new Date(year, month - 1, day, hours || 0, minutes || 0);
    const durationMins = parseInt(event.dur) || 90;
    const endDate = new Date(startDate.getTime() + durationMins * 60000);

    const formatOutlookDate = (date) => date.toISOString();
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      startdt: formatOutlookDate(startDate),
      enddt: formatOutlookDate(endDate),
      subject: event.title,
      body: `${event.desc}\n\nType: ${event.type}\nSpeakers: ${event.speakers.map(s => s.name).join(', ')}`,
      location: event.format.includes('Zoom') ? 'Zoom' : 'TBD'
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  },

  // Download calendar file
  downloadCalendarFile: (event) => {
    const iCal = NotificationManager.generateICalEvent(event);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(iCal));
    element.setAttribute('download', `${event.id}-event.ics`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  },

  // Open Google Calendar in new tab
  openGoogleCalendar: (event) => {
    const url = NotificationManager.generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  },

  // Open Outlook Calendar in new tab
  openOutlookCalendar: (event) => {
    const url = NotificationManager.generateOutlookCalendarUrl(event);
    window.open(url, '_blank');
  }
};

/* ─── DESIGN TOKENS (exact from screenshots) ─── */
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
  grid    :<><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  list    :<><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  calplus :<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="12" y1="15" x2="12" y2="19"/><line x1="10" y1="17" x2="14" y2="17"/></>,
};
function I({ k, s=16, c=C.t2, sw=1.5, fill='none' }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>{IK[k]}</svg>;
}

/* ─── INITIAL DATA ─── */
const SPK = {
  KA:{ initials:'KA', name:'Kwame Asante', role:'Lead Investment Analyst', color:C.pu, bg:C.puf },
  RA:{ initials:'RA', name:'Ria Adeyemi',  role:'Legal Counsel',           color:C.am, bg:C.amb },
  NF:{ initials:'NF', name:'Ngozi Fakoya', role:'ESG & Policy Lead',       color:C.tl, bg:C.tlb },
};
const BASE_EVENT = {
  title:'Project Financing Deep Dive: Structuring Your First Deal',
  desc :'Join our lead investment analyst for a live walkthrough of a real $2.4M C&I solar deal — from term sheet to financial close. Bring your questions.',
  dateLabel:'Thursday, May 8, 2026', dateShort:'Thursday, May 8 · 3:00 PM GMT',
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

/* ─── SIDEBAR ─── */
const NAV = [
  {l:'Home',k:'home'},{l:'Learning Hub',k:'book'},{l:'Due Diligence Vault',k:'folder'},
  {l:'Project Pipeline',k:'activity'},{l:'Reporting Library',k:'file'},
  {l:'Office Hours & Events',k:'cal',active:true},null,
  {l:'Member Circles',k:'users'},{l:'Toolkits & Templates',k:'monitor'},{l:'Partner Marketplace',k:'globe'},
  null,{l:'Announcements & Feedback',k:'bell'},{l:'Help',k:'help'},
];

/* ─── CALENDAR WIDGET ─── */
function CalWidget({ eventDays, onDayClick }) {
  const [yr, setYr] = useState(2026);
  const [mo, setMo] = useState(4);
  const MNAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const fd = new Date(yr, mo, 1).getDay(); const sc = (fd+6)%7;
  const dim = new Date(yr, mo+1, 0).getDate(); const pd = new Date(yr, mo, 0).getDate();
  const cells = [];
  for (let i=0; i<sc; i++) cells.push({d:pd-sc+1+i, ov:true});
  for (let d=1; d<=dim; d++) cells.push({d, ov:false});
  const r=(7-cells.length%7)%7; for (let i=1;i<=r;i++) cells.push({d:i,ov:true});
  const weeks=[]; for (let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  const prev=()=>{if(mo===0){setMo(11);setYr(y=>y-1);}else setMo(m=>m-1);};
  const nxt =()=>{if(mo===11){setMo(0);setYr(y=>y+1);}else setMo(m=>m+1);};
  const hasEv = (d,ov) => !ov && eventDays.some(e=>e.day===d&&e.month===mo&&e.year===yr);
  return (
    <div style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,padding:'14px',marginBottom:14}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
        <button onClick={prev} style={{background:'none',border:'none',cursor:'pointer',padding:3,display:'flex'}}><I k="chl" s={14} c={C.t3}/></button>
        <span style={{fontSize:13,fontWeight:600,color:C.t1}}>{MNAMES[mo]}-{yr}</span>
        <button onClick={nxt}  style={{background:'none',border:'none',cursor:'pointer',padding:3,display:'flex'}}><I k="chr" s={14} c={C.t3}/></button>
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

/* ─── EVENT CARD (grid view) ─── */
function EventCard({ ev, onOpen, onEdit, onDelete, onRsvp }) {
  const ec = EV_TYPES[ev.type]||{c:C.t2,b:C.bg,label:ev.type.toUpperCase()};
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [reminderSet, setReminderSet] = useState(false);

  const handleAddToGoogleCalendar = (e) => {
    e.stopPropagation();
    NotificationManager.openGoogleCalendar(ev);
    setCalendarOpen(false);
  };

  const handleAddToOutlookCalendar = (e) => {
    e.stopPropagation();
    NotificationManager.openOutlookCalendar(ev);
    setCalendarOpen(false);
  };

  const handleDownloadCalendarFile = (e) => {
    e.stopPropagation();
    NotificationManager.downloadCalendarFile(ev);
    setCalendarOpen(false);
  };

  const handleSetReminder = async (e) => {
    e.stopPropagation();
    const hasPermission = await NotificationManager.requestPermission();
    if (hasPermission) {
      const scheduled = NotificationManager.scheduleEventNotification(ev, 15);
      if (scheduled) {
        setReminderSet(true);
        setTimeout(() => setReminderSet(false), 2000);
      }
    }
  };

  return (
    <div style={{display:'flex',background:C.w,border:`1px solid ${C.bd}`,borderRadius:12,overflow:'hidden',marginBottom:12}}>
      {/* Purple date block */}
      <div style={{width:64,background:C.pu,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 8px',flexShrink:0}}>
        <span style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,.7)',letterSpacing:1,textTransform:'uppercase',lineHeight:1.6}}>{ev.month}</span>
        <span style={{fontSize:28,fontWeight:800,color:C.w,lineHeight:1}}>{ev.day}</span>
        <span style={{fontSize:9,fontWeight:600,color:'rgba(255,255,255,.65)',letterSpacing:.5,lineHeight:1.6}}>{ev.weekday}</span>
      </div>
      {/* Content */}
      <div style={{flex:1,padding:'13px 16px',minWidth:0}}>
        {/* Row 1: badge + edit/delete */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:7}}>
          <span style={{fontSize:10,fontWeight:600,color:ec.c,padding:'3px 10px',background:ec.b,borderRadius:20,letterSpacing:.3}}>{ec.label}</span>
          <div style={{display:'flex',gap:6}}>
            <button onClick={e=>{e.stopPropagation();onEdit(ev);}} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',border:`1px solid ${C.bd}`,borderRadius:7,background:C.w,color:C.t2,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
              <I k="edit" s={12} c={C.t2}/>Edit
            </button>
            <button onClick={e=>{e.stopPropagation();onDelete(ev);}} style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',border:`1px solid ${C.bd}`,borderRadius:7,background:C.w,color:C.t2,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
              <I k="trash" s={12} c={C.t2}/>Delete
            </button>
          </div>
        </div>
        {/* Row 2: title */}
        <div onClick={()=>onOpen(ev)} style={{fontSize:14,fontWeight:700,color:C.t1,marginBottom:5,lineHeight:1.35,cursor:'pointer'}}>{ev.title}</div>
        {/* Row 3: desc */}
        <p style={{fontSize:12,color:C.t2,margin:'0 0 10px',lineHeight:1.65,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>{ev.desc}</p>
        {/* Row 4: meta + avatars (avatars at RIGHT end of meta row) */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:0}}>
          <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.t2}}><I k="cal" s={12} c={C.t3}/>{ev.dateShort}</span>
            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.t2}}><I k="users" s={12} c={C.t3}/>{ev.speakers.length} speakers</span>
            <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:C.t2}}><I k="clock" s={12} c={C.t3}/>{ev.dur}</span>
          </div>
          <div style={{display:'flex',alignItems:'center',marginLeft:8}}>
            {ev.speakers.map((s,i)=>(
              <div key={i} style={{width:24,height:24,borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:8,fontWeight:700,color:s.color,border:`2px solid ${C.w}`,marginLeft:i>0?-6:0,zIndex:ev.speakers.length-i,flexShrink:0}}>{s.initials}</div>
            ))}
          </div>
        </div>
        {/* Separator line — exact design */}
        <div style={{height:1,background:C.bd,margin:'10px -16px'}}/>
        {/* Row 5: action buttons + RSVP */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8}}>
          <div style={{display:'flex',alignItems:'center',gap:6,flex:1,position:'relative'}}>
            {/* Add to calendar dropdown */}
            <button onClick={e=>{e.stopPropagation();setCalendarOpen(!calendarOpen);}}
              style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:6,fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:C.bg,color:C.t1,border:`1px solid ${C.bd}`,transition:'all 0.2s'}}>
              <I k="calplus" s={12} c={C.t1}/>Calendar
            </button>
            {calendarOpen&&(
              <>
                <div style={{position:'fixed',inset:0,zIndex:49}} onClick={()=>setCalendarOpen(false)}/>
                <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,background:C.w,border:`1px solid ${C.bd}`,borderRadius:7,zIndex:50,overflow:'hidden',boxShadow:'0 4px 12px rgba(0,0,0,.08)',minWidth:140}}>
                  <button onClick={handleAddToGoogleCalendar} style={{width:'100%',padding:'10px 12px',fontSize:11,color:C.t1,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:6,transition:'background 0.2s'}}
                    onMouseEnter={(e)=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <I k="globe" s={12} c={C.pu}/>Google
                  </button>
                  <div style={{height:1,background:C.bd}}/>
                  <button onClick={handleAddToOutlookCalendar} style={{width:'100%',padding:'10px 12px',fontSize:11,color:C.t1,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:6,transition:'background 0.2s'}}
                    onMouseEnter={(e)=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <I k="monitor" s={12} c={C.am}/>Outlook
                  </button>
                  <div style={{height:1,background:C.bd}}/>
                  <button onClick={handleDownloadCalendarFile} style={{width:'100%',padding:'10px 12px',fontSize:11,color:C.t1,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:6,transition:'background 0.2s'}}
                    onMouseEnter={(e)=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <I k="file" s={12} c={C.gr}/>.ics
                  </button>
                </div>
              </>
            )}
            {/* Set reminder button */}
            <button onClick={handleSetReminder}
              style={{display:'flex',alignItems:'center',gap:4,padding:'6px 10px',borderRadius:6,fontSize:11,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:reminderSet?C.grb:C.bg,color:reminderSet?C.gr:C.t1,border:reminderSet?`1px solid ${C.gr}`:`1px solid ${C.bd}`,transition:'all 0.2s'}}>
              <I k="bell" s={12} c={reminderSet?C.gr:C.t1}/>
              {reminderSet?'Set':'Reminder'}
            </button>
          </div>
          {/* RSVP button */}
          <button onClick={e=>{e.stopPropagation();onRsvp(ev.id);}}
            style={{display:'flex',alignItems:'center',gap:5,padding:'6px 14px',borderRadius:7,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:ev.rsvped?C.w:C.pu,color:ev.rsvped?C.gr:C.w,border:ev.rsvped?`1px solid ${C.gr}`:'none',flexShrink:0}}>
            {ev.rsvped&&<I k="check" s={11} c={C.gr} sw={2.5}/>}{ev.rsvped?'RSVPed':'RSVP'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── EVENT FORM MODAL (Create / Edit) — exact Design 22 ─── */
function EventFormModal({ title, initial, onClose, onSave }) {
  const blank = {title:'',speakers:'',type:'',duration:'',date:'',time:'',maxCap:'',avail:'',desc:'',agenda:[]};
  const [f, setF] = useState(initial||blank);
  const [typeOpen, setTypeOpen] = useState(false);
  const set = k => e => setF(p=>({...p,[k]:e.target.value}));
  const setV = (k,v) => setF(p=>({...p,[k]:v}));
  const addAg = () => setF(p=>({...p,agenda:[...p.agenda,{t:'',d:''}]}));
  const setAg = (i,k,v) => setF(p=>({...p,agenda:p.agenda.map((a,j)=>j===i?{...a,[k]:v}:a)}));
  const delAg = i => setF(p=>({...p,agenda:p.agenda.filter((_,j)=>j!==i)}));
  const IN = {width:'100%',padding:'10px 12px',border:`1px solid ${C.bd}`,borderRadius:8,fontSize:13,color:C.t1,outline:'none',fontFamily:'inherit',boxSizing:'border-box',background:C.w};
  const LB = {fontSize:13,fontWeight:500,color:C.t1,display:'block',marginBottom:5};
  const GP = {marginBottom:16};
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:380,height:'100%',background:C.w,zIndex:101,display:'flex',flexDirection:'column',boxShadow:'-4px 0 30px rgba(0,0,0,.12)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
          <h2 style={{fontSize:18,fontWeight:700,color:C.t1,margin:0}}>{title}</h2>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.w,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><I k="x" s={14} c={C.t2} sw={2}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
          <div style={GP}><label style={LB}>Event title <span style={{color:'#EF4444'}}>*</span></label><input value={f.title} onChange={set('title')} placeholder="Enter your full name" style={IN}/></div>
          <div style={GP}><label style={LB}>Speaker name(s)</label><input value={f.speakers} onChange={set('speakers')} placeholder="Enter your full name" style={IN}/></div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,...GP}}>
            <div>
              <label style={LB}>Event type <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <button onClick={()=>setTypeOpen(o=>!o)} style={{...IN,display:'flex',alignItems:'center',justifyContent:'space-between',cursor:'pointer',color:f.type?C.t1:C.t3,padding:'10px 12px'}}>
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
            <div><label style={LB}>Duration</label><input value={f.duration} onChange={set('duration')} placeholder="Select your role" style={IN}/></div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,...GP}}>
            <div>
              <label style={LB}>Date <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <input value={f.date} onChange={set('date')} placeholder="mm/dd/yyyy" style={{...IN,paddingRight:36}}/>
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><I k="cal" s={14} c={C.t3}/></span>
              </div>
            </div>
            <div>
              <label style={LB}>Time (GMT) <span style={{color:'#EF4444'}}>*</span></label>
              <div style={{position:'relative'}}>
                <input value={f.time} onChange={set('time')} placeholder="00:00" style={{...IN,paddingRight:36}}/>
                <span style={{position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><I k="clock" s={14} c={C.t3}/></span>
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,...GP}}>
            <div><label style={LB}>Max capacity</label><input type="number" value={f.maxCap} onChange={set('maxCap')} placeholder="0" style={IN}/></div>
            <div><label style={LB}>Available spots</label><input type="number" value={f.avail} onChange={set('avail')} placeholder="0" style={IN}/></div>
          </div>
          <div style={GP}><label style={LB}>Description <span style={{color:'#EF4444'}}>*</span></label><textarea value={f.desc} onChange={set('desc')} placeholder="write something here..." rows={4} style={{...IN,resize:'vertical',lineHeight:1.6}}/></div>
          <div style={GP}>
            <label style={LB}>Agenda items <span style={{fontSize:12,fontWeight:400,color:C.t3}}>(optional)</span></label>
            {f.agenda.map((a,i)=>(
              <div key={i} style={{display:'flex',gap:8,marginBottom:8,alignItems:'center'}}>
                <input value={a.t} onChange={e=>setAg(i,'t',e.target.value)} placeholder="Time" style={{...IN,width:68,flexShrink:0,padding:'9px 10px'}}/>
                <input value={a.d} onChange={e=>setAg(i,'d',e.target.value)} placeholder="Agenda item description" style={{...IN,flex:1}}/>
                <button onClick={()=>delAg(i)} style={{background:'none',border:'none',cursor:'pointer',padding:4,flexShrink:0,display:'flex'}}><I k="x" s={16} c={C.t3} sw={2}/></button>
              </div>
            ))}
            <div onClick={addAg} style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'11px',border:`1.5px dashed ${C.bd}`,borderRadius:8,cursor:'pointer',fontSize:13,color:C.t3}}>
              <I k="plus" s={14} c={C.t3}/>Add agenda item
            </div>
          </div>
        </div>
        <div style={{padding:'14px 24px',borderTop:`1px solid ${C.bd}`,display:'flex',gap:10,justifyContent:'flex-end',flexShrink:0}}>
          <button onClick={onClose} style={{padding:'9px 18px',borderRadius:8,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Cancel</button>
          <button onClick={()=>onSave(f)} style={{padding:'9px 22px',borderRadius:8,border:'none',background:C.pu,color:C.w,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Save changes</button>
        </div>
      </div>
    </>
  );
}

/* ─── EVENT DETAIL MODAL — exact Design 21 ─── */
function DetailModal({ ev, onClose, onRsvp, onNotifyMe }) {
  const ec = EV_TYPES[ev.type]||{c:C.t2,b:C.bg};
  const [reminderSet, setReminderSet] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const handleAddToGoogleCalendar = () => {
    NotificationManager.openGoogleCalendar(ev);
  };

  const handleAddToOutlookCalendar = () => {
    NotificationManager.openOutlookCalendar(ev);
  };

  const handleDownloadCalendarFile = () => {
    NotificationManager.downloadCalendarFile(ev);
  };

  const handleSetReminder = async () => {
    const hasPermission = await NotificationManager.requestPermission();
    if (hasPermission) {
      const scheduled = NotificationManager.scheduleEventNotification(ev, 15);
      if (scheduled) {
        setReminderSet(true);
        setTimeout(() => setReminderSet(false), 2000);
      }
    }
  };

  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:380,height:'100%',background:C.w,zIndex:101,display:'flex',flexDirection:'column',boxShadow:'-4px 0 30px rgba(0,0,0,.12)'}}>
        <div style={{display:'flex',justifyContent:'flex-end',padding:'16px 20px 0',flexShrink:0}}>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.w,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><I k="x" s={14} c={C.t2} sw={2}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'8px 24px 20px'}}>
          {/* Type pill */}
          <span style={{display:'inline-block',fontSize:11,fontWeight:700,color:ec.c,padding:'3px 10px',background:ec.b,borderRadius:20,marginBottom:14}}>
            {ev.type.charAt(0).toUpperCase()+ev.type.slice(1)}
          </span>
          <h2 style={{fontSize:17,fontWeight:700,color:C.t1,margin:'0 0 10px',lineHeight:1.4}}>{ev.title}</h2>
          <p style={{fontSize:13,color:C.t2,margin:'0 0 20px',lineHeight:1.7}}>{ev.desc}</p>
          {/* Info grid — light gray bg boxes (Design 21) */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:22}}>
            {[{l:'Date',v:ev.dateLabel},{l:'Time',v:ev.time},{l:'Duration',v:ev.dur},{l:'Format',v:ev.format}].map(it=>(
              <div key={it.l} style={{padding:'12px 14px',background:C.bg,border:`1px solid ${C.bd}`,borderRadius:10}}>
                <div style={{fontSize:11,color:C.t3,marginBottom:4,fontWeight:500}}>{it.l}</div>
                <div style={{fontSize:13,fontWeight:600,color:C.t1}}>{it.v}</div>
              </div>
            ))}
          </div>
          {/* Speakers */}
          <h3 style={{fontSize:14,fontWeight:700,color:C.t1,margin:'0 0 14px'}}>Speakers</h3>
          {ev.speakers.map((s,i)=>(
            <div key={i} style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
              <div style={{width:36,height:36,borderRadius:'50%',background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,color:s.color,flexShrink:0}}>{s.initials}</div>
              <div><div style={{fontSize:13,fontWeight:600,color:C.t1}}>{s.name}</div><div style={{fontSize:12,color:C.t3}}>{s.role}</div></div>
            </div>
          ))}
          {/* Agenda */}
          {ev.agenda&&ev.agenda.length>0&&<>
            <h3 style={{fontSize:14,fontWeight:700,color:C.t1,margin:'16px 0 12px'}}>Agenda</h3>
            {ev.agenda.map((a,i)=>(
              <div key={i} style={{display:'flex',gap:16,marginBottom:10,alignItems:'baseline'}}>
                <span style={{fontSize:12,fontWeight:600,color:C.t3,flexShrink:0,width:30}}>{a.t}</span>
                <span style={{fontSize:13,color:C.t1,lineHeight:1.4}}>{a.d}</span>
              </div>
            ))}
          </>}
        </div>
        {/* Footer — Design 21: action buttons (Calendar, Reminder, RSVP) */}
        <div style={{padding:'14px 24px 20px',borderTop:`1px solid ${C.bd}`,flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:12}}>
            <span style={{fontSize:13,color:C.t2}}>{ev.spotsLeft} spots remaining</span>
          </div>
          {/* Calendar selector dropdown */}
          <div style={{position:'relative',marginBottom:12}}>
            <button onClick={()=>setCalendarOpen(!calendarOpen)}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:6,padding:'10px 14px',borderRadius:9,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:C.bg,color:C.t1,border:`1px solid ${C.bd}`,transition:'all 0.2s'}}>
              <span style={{display:'flex',alignItems:'center',gap:6}}><I k="calplus" s={14} c={C.t1}/>Add to calendar</span>
              <I k={calendarOpen?'chd':'chr'} s={12} c={C.t3}/>
            </button>
            {calendarOpen&&(
              <>
                <div style={{position:'fixed',inset:0,zIndex:49}} onClick={()=>setCalendarOpen(false)}/>
                <div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,background:C.w,border:`1px solid ${C.bd}`,borderRadius:8,zIndex:50,overflow:'hidden',boxShadow:'0 4px 14px rgba(0,0,0,.1)'}}>
                  <button onClick={()=>{handleAddToGoogleCalendar();setCalendarOpen(false);}} style={{width:'100%',padding:'12px 14px',fontSize:12,color:C.t1,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:8,transition:'background 0.2s'}}
                    onMouseEnter={(e)=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <I k="globe" s={14} c={C.pu}/>Google Calendar
                  </button>
                  <div style={{height:1,background:C.bd}}/>
                  <button onClick={()=>{handleAddToOutlookCalendar();setCalendarOpen(false);}} style={{width:'100%',padding:'12px 14px',fontSize:12,color:C.t1,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:8,transition:'background 0.2s'}}
                    onMouseEnter={(e)=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <I k="monitor" s={14} c={C.am}/>Outlook Calendar
                  </button>
                  <div style={{height:1,background:C.bd}}/>
                  <button onClick={()=>{handleDownloadCalendarFile();setCalendarOpen(false);}} style={{width:'100%',padding:'12px 14px',fontSize:12,color:C.t1,background:'transparent',border:'none',cursor:'pointer',fontFamily:'inherit',textAlign:'left',display:'flex',alignItems:'center',gap:8,transition:'background 0.2s'}}
                    onMouseEnter={(e)=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={(e)=>e.currentTarget.style.background='transparent'}>
                    <I k="file" s={14} c={C.gr}/>Download .ics file
                  </button>
                </div>
              </>
            )}
          </div>
          {/* Set reminder button */}
          <button onClick={handleSetReminder}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 14px',borderRadius:9,fontSize:12,fontWeight:500,cursor:'pointer',fontFamily:'inherit',background:reminderSet?C.grb:C.bg,color:reminderSet?C.gr:C.t1,border:reminderSet?`1px solid ${C.gr}`:`1px solid ${C.bd}`,transition:'all 0.2s',marginBottom:12}}>
            <I k="bell" s={14} c={reminderSet?C.gr:C.t1}/>
            {reminderSet?'✓ Reminder set for 15 min before':'Set alarm reminder (15 min before)'}
          </button>
          {/* Full-width RSVP button */}
          <button onClick={()=>onRsvp(ev.id)}
            style={{width:'100%',padding:'13px',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer',fontFamily:'inherit',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:ev.rsvped?C.pu:C.w,color:ev.rsvped?C.w:C.pu,border:ev.rsvped?'none':`1.5px solid ${C.pu}`}}>
            {ev.rsvped&&<I k="check" s={16} c={C.w} sw={2.5}/>}{ev.rsvped?'RSVPed':'RSVP now'}
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── DELETE MODAL ─── */
function DeleteModal({ ev, onClose, onConfirm }) {
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.35)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',width:400,background:C.w,borderRadius:16,zIndex:101,boxShadow:'0 24px 64px rgba(0,0,0,.2)',overflow:'hidden'}}>
        <div style={{display:'flex',justifyContent:'flex-end',padding:'14px 18px 0'}}>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',padding:4,display:'flex'}}><I k="x" s={16} c={C.t3} sw={2}/></button>
        </div>
        <div style={{padding:'8px 32px 28px',textAlign:'center'}}>
          <div style={{width:52,height:52,borderRadius:'50%',background:C.rdb,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 18px'}}><I k="trash" s={22} c={C.rd} sw={1.5}/></div>
          <h3 style={{fontSize:17,fontWeight:700,color:C.t1,margin:'0 0 12px'}}>Delete this event?</h3>
          <p style={{fontSize:13,color:C.t2,lineHeight:1.7,margin:'0 0 24px'}}>You're about to delete <strong>"{ev.title}"</strong>. This action cannot be undone and attendees will not be notified automatically.</p>
          <div style={{display:'flex',gap:12}}>
            <button onClick={onClose} style={{flex:1,padding:'11px',borderRadius:9,border:`1px solid ${C.bd}`,background:C.w,color:C.t1,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>Keep it</button>
            <button onClick={onConfirm} style={{flex:1,padding:'11px',borderRadius:9,border:'none',background:C.rd,color:C.w,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>Yes, delete</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─── VIEW ALL MODAL — right-side drawer (consistent with all other modals) ─── */
function ViewAllModal({ events, onClose, onOpen, onEdit, onDelete, onRsvp }) {
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.25)',zIndex:100}} onClick={onClose}/>
      <div style={{position:'fixed',top:0,right:0,width:480,height:'100%',background:C.w,zIndex:101,display:'flex',flexDirection:'column',boxShadow:'-4px 0 30px rgba(0,0,0,.12)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:`1px solid ${C.bd}`,flexShrink:0}}>
          <h2 style={{fontSize:18,fontWeight:700,color:C.t1,margin:0}}>Upcoming Events <span style={{color:C.t3,fontWeight:400,fontSize:14}}>({events.length})</span></h2>
          <button onClick={onClose} style={{width:28,height:28,borderRadius:'50%',border:`1px solid ${C.bd}`,background:C.w,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><I k="x" s={14} c={C.t2} sw={2}/></button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
          {events.map(ev=>(
            <EventCard key={ev.id} ev={ev} onOpen={e=>{onClose();onOpen(e);}} onEdit={e=>{onClose();onEdit(e);}} onDelete={e=>{onClose();onDelete(e);}} onRsvp={onRsvp}/>
          ))}
        </div>
      </div>
    </>
  );
}

/* ─── TOAST ─── */
function Toast({ msg, onDone }) {
  useEffect(()=>{const t=setTimeout(onDone,2800);return()=>clearTimeout(t);},[]);
  return (
    <div style={{position:'fixed',top:16,right:16,background:'#1F2937',color:C.w,fontSize:13,fontWeight:500,padding:'10px 18px',borderRadius:10,display:'flex',alignItems:'center',gap:8,zIndex:200,boxShadow:'0 8px 24px rgba(0,0,0,.2)'}}>
      <I k="check" s={14} c='#34D399' sw={2.5}/>{msg}
    </div>
  );
}

/* ─── MAIN COMPONENT ─── */
export default function OfficeHoursEvents() {
  const [events, setEvents]       = useState(INIT_EVENTS);
  const [activeTab, setTab]       = useState('upcoming');
  const [activeFilter, setFilter] = useState('all');
  const [sortBy, setSort]         = useState('soonest');
  const [sortOpen, setSortOpen]   = useState(false);
  const [showCreate, setCreate]   = useState(false);
  const [editEv, setEdit]         = useState(null);
  const [deleteEv, setDel]        = useState(null);
  const [detailEv, setDetail]     = useState(null);
  const [viewAll, setViewAll]     = useState(false);
  const [toast, setToast]         = useState(null);
  const [calEvDays, setCalEvDays] = useState([{day:8,month:4,year:2026}]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  const showToast = msg => setToast(msg);

  // Handle "Notify me" button - request permissions and set up notifications for all events
  const handleNotifyMe = async () => {
    const hasPermission = await NotificationManager.requestPermission();
    if (hasPermission) {
      let scheduled = 0;
      events.forEach(event => {
        if (NotificationManager.scheduleEventNotification(event, 15)) {
          scheduled++;
        }
      });
      setNotificationsEnabled(true);
      showToast(`✓ Notifications enabled for ${scheduled} events! You'll get alerts 15 minutes before each event.`);
    } else {
      showToast('Please enable notifications to get event reminders');
    }
  };

  // RSVP toggle
  const handleRsvp = id => {
    setEvents(p=>p.map(e=>e.id===id?{...e,rsvped:!e.rsvped}:e));
    // Also update detail if open
    if (detailEv?.id===id) setDetail(p=>({...p,rsvped:!p.rsvped}));
  };

  // Save (create or edit)
  const handleSave = form => {
    const parsedDate = form.date ? form.date.split('/') : [];
    const calDay   = parsedDate[1] ? parseInt(parsedDate[1]) : 8;
    const calMonth = parsedDate[0] ? parseInt(parsedDate[0])-1 : 4;
    const calYear  = parsedDate[2] ? parseInt(parsedDate[2]) : 2026;
    if (editEv) {
      setEvents(p=>p.map(e=>e.id===editEv.id?{...e,...form,dur:form.duration||e.dur,dateLabel:form.date||e.dateLabel,calDay,calMonth,calYear}:e));
      setEdit(null); showToast('Event updated successfully');
    } else {
      const ne = {
        ...form, id:Date.now(), month:parsedDate[0]||'MAY', day:String(calDay), weekday:'THU',
        dateLabel:form.date||'TBD', dateShort:`${form.date||'TBD'} · ${form.time||'TBD'}`,
        time:form.time||'TBD', dur:form.duration||'TBD', format:'Live Zoom · Recorded',
        calDay, calMonth, calYear,
        spotsLeft:parseInt(form.avail)||0, totalSpots:parseInt(form.maxCap)||0,
        rsvped:false, speakers:[SPK.KA], agenda:form.agenda||[],
      };
      setEvents(p=>[...p,ne]);
      setCalEvDays(p=>[...p,{day:calDay,month:calMonth,year:calYear}]);
      setCreate(false); showToast('Event created successfully');
    }
  };

  // Add to calendar (live banner button)
  const addLiveToCalendar = () => {
    const already = calEvDays.some(e=>e.day===8&&e.month===4&&e.year===2026);
    if (!already) setCalEvDays(p=>[...p,{day:8,month:4,year:2026}]);
    showToast('Added to your calendar!');
  };

  // Calendar day click → find event for that day
  const handleCalDayClick = (day,month,year) => {
    const found = events.find(e=>e.calDay===day&&e.calMonth===month&&e.calYear===year);
    if (found) setDetail(found);
  };

  const TABS    = [{id:'upcoming',l:'Upcoming',n:events.length},{id:'rsvps',l:'My RSVPs',n:events.filter(e=>e.rsvped).length},{id:'replays',l:'Replays',n:24}];
  const FILTERS = [{id:'all',l:'All types'},{id:'oh',l:'Office Hours'},{id:'mc',l:'Member Circles'},{id:'ws',l:'Workshops'},{id:'wb',l:'Webinars'}];
  const SORTS   = [{id:'soonest',l:'Soonest first'},{id:'latest',l:'Latest first'},{id:'popular',l:'Most popular'}];
  const RSVPS   = [{dot:C.pu,title:'Project Financing Deep Dive',dt:'Thu, May 8 · 3:00 PM GMT'},{dot:C.gr,title:'Project Financing Deep Dive',dt:'Thu, May 8 · 3:00 PM GMT'},{dot:C.pu,title:'Project Financing Deep Dive',dt:'Thu, May 8 · 3:00 PM GMT'}];
  const HOSTS   = [{dot:C.pu,n:'Kwame Asante',r:'Lead Investment Analyst',s:'8 sessions'},{dot:C.gr,n:'Ngozi Fakoya',r:'ESG & Policy Lead',s:'8 sessions'},{dot:C.am,n:'Bola Oladele',r:'Risk & FX Specialist',s:'8 sessions'}];

  const displayEvents = events.filter(e => {
    if (activeTab==='rsvps') return e.rsvped;
    return true;
  });

  return (
    <div style={{display:'flex',height:'100vh',background:C.bg,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',fontSize:14,overflow:'hidden'}}>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>
        <main style={{flex:1,overflowY:'auto',padding:'24px 28px 60px'}}>

          {/* Page header */}
          <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22,gap:16}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:700,color:C.t1,margin:'0 0 5px',letterSpacing:-.4}}>Office Hours &amp; Events</h1>
              <p style={{fontSize:13,color:C.t2,margin:0}}>Live sessions, workshops, and replays from the Tribes Capital team and network</p>
            </div>
            <div style={{display:'flex',gap:10,flexShrink:0}}>
              <button onClick={handleNotifyMe} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 16px',border:notificationsEnabled?'none':`1px solid ${C.bd}`,borderRadius:9,background:notificationsEnabled?C.grb:C.w,color:notificationsEnabled?C.gr:C.t1,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>
                <I k="bell" s={14} c={notificationsEnabled?C.gr:C.t2}/>
                {notificationsEnabled?'Notifications on':'Notify me'}
              </button>
              <button onClick={()=>setCreate(true)} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',border:'none',borderRadius:9,background:C.pu,color:C.w,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>
                <I k="plus" s={14} c={C.w} sw={2}/>Create event
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:22}}>
            {[{l:'Upcoming events',v:String(events.length),badge:'This month',bc:C.pu,bb:C.puf},{l:"You're RSVPed to",v:String(events.filter(e=>e.rsvped).length),badge:'Confirmed',bc:C.gr,bb:C.grb},{l:'Replays available',v:'00.0',badge:'All time',bc:C.tl,bb:C.tlb},{l:'Sessions attended',v:'0',badge:'Your record',bc:C.am,bb:C.amb}].map(s=>(
              <div key={s.l} style={{background:C.w,border:`1px solid ${C.bd}`,borderRadius:10,padding:'14px 18px'}}>
                <div style={{fontSize:12,color:C.t2,marginBottom:6}}>{s.l}</div>
                <div style={{fontSize:26,fontWeight:700,color:C.t1,marginBottom:8,letterSpacing:-.8}}>{s.v}</div>
                <span style={{background:s.bb,color:s.bc,fontSize:11,fontWeight:500,padding:'2px 10px',borderRadius:20}}>{s.badge}</span>
              </div>
            ))}
          </div>

          {/* Live banner */}
          <div style={{background:`linear-gradient(135deg,${C.pud},${C.pu} 55%,${C.pul})`,borderRadius:14,padding:'22px 28px',marginBottom:24}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:7,background:'rgba(255,255,255,.15)',border:'1px solid rgba(255,255,255,.3)',borderRadius:20,padding:'4px 12px',marginBottom:14}}>
              <div style={{width:8,height:8,borderRadius:'50%',background:'#FCD34D'}}/>
              <span style={{fontSize:11,fontWeight:700,color:C.w,letterSpacing:.7}}>LIVE THIS THURSDAY</span>
            </div>
            <h2 style={{fontSize:20,fontWeight:700,color:C.w,margin:'0 0 8px',lineHeight:1.3}}>Project Financing Deep Dive: Structuring Your First Deal</h2>
            <p style={{fontSize:13,color:'rgba(255,255,255,.8)',margin:'0 0 16px',lineHeight:1.6,maxWidth:580}}>Join our lead investment analyst as he walks through a real $2.4M C&I solar deal step-by-step — from term sheet to financial close.</p>
            <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:18,flexWrap:'wrap'}}>
              {[{k:'cal',t:'Thursday, May 8 · 3:00 PM GMT'},{k:'users',t:'Office Hours'},{k:'clock',t:'90 min'}].map(m=>(
                <span key={m.t} style={{display:'flex',alignItems:'center',gap:5,fontSize:13,color:'rgba(255,255,255,.85)'}}><I k={m.k} s={13} c='rgba(255,255,255,.65)'/>{m.t}</span>
              ))}
            </div>
            <div style={{display:'flex',gap:10,marginBottom:12}}>
              <button onClick={()=>showToast('RSVP confirmed! See you Thursday.')} style={{padding:'8px 18px',borderRadius:8,border:'1.5px solid rgba(255,255,255,.5)',background:'rgba(255,255,255,.15)',color:C.w,fontSize:13,fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>RSVP now</button>
              <button onClick={addLiveToCalendar} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:8,border:'1.5px solid rgba(255,255,255,.35)',background:'rgba(255,255,255,.08)',color:C.w,fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'inherit'}}>
                <I k="plus" s={13} c={C.w} sw={2}/>Add to calendar
              </button>
            </div>
            <p style={{fontSize:12,color:'rgba(255,255,255,.6)',margin:0}}>14 spots remaining out of 40</p>
          </div>

          {/* Tabs */}
          <div style={{borderBottom:`1px solid ${C.bd}`,marginBottom:16,display:'flex'}}>
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setTab(tab.id)}
                style={{background:'none',border:'none',padding:'10px 22px',cursor:'pointer',fontSize:14,fontWeight:activeTab===tab.id?500:400,color:activeTab===tab.id?C.pu:C.t2,borderBottom:activeTab===tab.id?`2px solid ${C.pu}`:'2px solid transparent',marginBottom:-1,fontFamily:'inherit'}}>
                {tab.l} ({tab.n})
              </button>
            ))}
          </div>

          {/* Filters + Sort */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {FILTERS.map(f=>(
                <button key={f.id} onClick={()=>setFilter(f.id)}
                  style={{padding:'6px 14px',borderRadius:20,fontSize:13,cursor:'pointer',fontWeight:activeFilter===f.id?500:400,background:activeFilter===f.id?C.puf:C.w,color:activeFilter===f.id?C.pu:C.t2,border:activeFilter===f.id?`1.5px solid ${C.pu}`:`1px solid ${C.bd}`,fontFamily:'inherit'}}>
                  {f.l}
                </button>
              ))}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              {/* Sort dropdown */}
              <div style={{position:'relative'}}>
                <button onClick={()=>setSortOpen(o=>!o)} style={{display:'flex',alignItems:'center',gap:7,padding:'7px 14px',borderRadius:8,border:`1px solid ${C.bd}`,background:C.w,color:C.t2,fontSize:13,cursor:'pointer',fontFamily:'inherit'}}>
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
          </div>

          {/* Two-column layout */}
          <div style={{display:'grid',gridTemplateColumns:'1fr 285px',gap:24,alignItems:'start'}}>

            {/* LEFT — event list */}
            <div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                <span style={{fontSize:15,fontWeight:600,color:C.t1}}>Upcoming events <span style={{color:C.t3,fontWeight:400,fontSize:14}}>({displayEvents.length})</span></span>
                <button onClick={()=>setViewAll(true)} style={{fontSize:13,color:C.pu,background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:4,fontFamily:'inherit',fontWeight:500}}>
                  View all <I k="arr" s={13} c={C.pu}/>
                </button>
              </div>
              {displayEvents.map(ev=><EventCard key={ev.id} ev={ev} onOpen={setDetail} onEdit={setEdit} onDelete={setDel} onRsvp={handleRsvp}/>)}
            </div>

            {/* RIGHT — calendar + widgets */}
            <div>
              <CalWidget eventDays={calEvDays} onDayClick={handleCalDayClick}/>
              {/* Upcoming RSVPs */}
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
              {/* Regular hosts */}
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
      </div>

      {/* Modals */}
      {showCreate && <EventFormModal title="Create event" onClose={()=>setCreate(false)} onSave={handleSave}/>}
      {editEv     && <EventFormModal title="Edit event" initial={editEv} onClose={()=>setEdit(null)} onSave={handleSave}/>}
      {deleteEv   && <DeleteModal ev={deleteEv} onClose={()=>setDel(null)} onConfirm={()=>{setEvents(p=>p.filter(e=>e.id!==deleteEv.id));setDel(null);showToast('Event deleted successfully');}}/>}
      {detailEv   && <DetailModal ev={detailEv} onClose={()=>setDetail(null)} onRsvp={handleRsvp}/>}
      {viewAll    && <ViewAllModal events={displayEvents} onClose={()=>setViewAll(false)} onOpen={setDetail} onEdit={setEdit} onDelete={setDel} onRsvp={handleRsvp}/>}
      {toast      && <Toast msg={toast} onDone={()=>setToast(null)}/>}

      <style>{`*{box-sizing:border-box;}button,input,select,textarea{font-family:inherit;}::-webkit-scrollbar{width:5px;}::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:10px;}`}</style>
    </div>
  );
}
