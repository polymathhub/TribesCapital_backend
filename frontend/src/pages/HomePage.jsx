import { useState, useRef, useEffect, useCallback } from "react";
import LearningHub from "./LearningHub";
import OfficeHoursEvents from "./OfficeHoursEvents";
import Logo, { LogoMark, LogoFull } from "../components/Logo";

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
    desc:"You're now part of a community of clean energy investors and professionals across Africa. Let us show you around in 8 quick steps." },
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

/* ─── SIDEBAR NAV ────────────────────────────────────── */
const NAV = [
  { label:'Home',                    key:'home' },
  { label:'Learning Hub',            key:'learning' },
  { label:'Due Diligence Vault',     key:'vault' },
  { label:'Project Pipeline',        key:'pipeline' },
  { label:'Reporting Library',       key:'reporting' },
  { label:'Office Hours & Events',   key:'events' },
  null, // divider
  { label:'Member Circles',          key:'circles' },
  { label:'Toolkits & Templates',    key:'toolkits' },
  { label:'Partner Marketplace',     key:'marketplace' },
  null,
  { label:'Announcements & Feedback',key:'announcements' },
  { label:'Help',                    key:'help' },
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
    close:   <><line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/><line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="1.5" strokeLinecap="round"/></>,
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
function TutorialOverlay({ step, total, spotlight, tipPos, onNext, onBack, onSkip }) {
  const cur = STEPS[step];

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
          animation: 'pulse 2s ease-in-out infinite'
        }}/>
      ) : (
        <div style={{ 
          position:'fixed', 
          inset:0, 
          background:'rgba(17,24,39,0.68)', 
          zIndex:999, 
          pointerEvents:'none',
          backdropFilter: 'blur(2px)',
          WebkitBackdropFilter: 'blur(2px)'
        }}/>
      )}

      {/* Tooltip card */}
      <div style={{
        position:'fixed', ...tipPos,
        width:340, 
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius:14,
        boxShadow:'0 24px 64px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.1), 0 0 20px rgba(124, 58, 237, 0.15)',
        zIndex:1001, 
        overflow:'hidden',
        animation:'fadeInUp 0.4s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* Purple progress bar */}
        <div style={{ height:4, background:'#EDE9FE' }}>
          <div 
            style={{ 
              height:4, 
              background: `linear-gradient(90deg, ${P}, #5B21B6)`, 
              width:`${((step+1)/total)*100}%`, 
              transition:'width .35s cubic-bezier(0.34, 1.56, 0.64, 1)', 
              borderRadius:'0 2px 2px 0',
              boxShadow: `0 0 10px rgba(124, 58, 237, 0.4)`
            }}
          />
        </div>

        {/* Header row */}
        <div style={{ 
          display:'flex', 
          alignItems:'center', 
          justifyContent:'space-between', 
          padding:'14px 18px 8px',
          background: 'rgba(236, 233, 254, 0.2)',
          backdropFilter: 'blur(4px)'
        }}>
          <span style={{ 
            fontSize:10, 
            fontWeight:700, 
            color:P, 
            letterSpacing:.8, 
            textTransform:'uppercase' 
          }}>
            Step {step+1} of {total}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button 
              onClick={onSkip} 
              style={{
                ...btnStyle('none', 'none', T3, 12),
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.color = T2}
              onMouseLeave={(e) => e.target.style.color = T3}
            >
              Skip tour
            </button>
            <button 
              onClick={onSkip}
              style={{ 
                ...circleBtn, 
                background:'rgba(236, 233, 254, 0.6)', 
                border:'1px solid rgba(124, 58, 237, 0.2)', 
                color:T2, 
                fontSize:16, 
                lineHeight:1,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(236, 233, 254, 0.9)';
                e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(236, 233, 254, 0.6)';
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'2px 18px 18px' }}>
          <div style={{ 
            fontSize:30, 
            marginBottom:12, 
            lineHeight:1,
            animation: 'bounce 0.6s ease-in-out'
          }}>
            {cur.icon}
          </div>
          <h3 style={{ fontSize:16, fontWeight:700, color:T1, margin:'0 0 8px', letterSpacing:-.3 }}>
            {cur.title}
          </h3>
          <p style={{ fontSize:13, color:T2, lineHeight:1.65, margin:0 }}>
            {cur.desc}
          </p>
        </div>

        {/* Footer */}
        <div style={{ 
          display:'flex', 
          alignItems:'center', 
          justifyContent:'space-between',
          padding:'12px 18px', 
          borderTop:`1px solid rgba(229, 231, 235, 0.4)`, 
          background: 'rgba(249, 250, 251, 0.5)',
          backdropFilter: 'blur(4px)'
        }}>
          {/* Dot indicators */}
          <div style={{ display:'flex', gap:5, alignItems:'center' }}>
            {STEPS.map((_,i) => (
              <div 
                key={i} 
                style={{
                  height:6, 
                  width:i===step?18:6, 
                  borderRadius:3,
                  background:i===step ? `linear-gradient(90deg, ${P}, #5B21B6)` : '#E5E7EB', 
                  transition:'all .3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: i===step ? `0 0 8px rgba(124, 58, 237, 0.4)` : 'none'
                }}
              />
            ))}
          </div>
          {/* Buttons */}
          <div style={{ display:'flex', gap:8 }}>
            {step > 0 && (
              <button 
                onClick={onBack}
                style={{ 
                  ...btnStyle(`1px solid rgba(124, 58, 237, 0.2)`, 'rgba(255, 255, 255, 0.7)', T2, 13), 
                  padding:'8px 14px', 
                  borderRadius:8, 
                  fontWeight:500,
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(236, 233, 254, 0.6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                ← Back
              </button>
            )}
            <button 
              onClick={onNext}
              style={{ 
                ...btnStyle('none', `linear-gradient(135deg, ${P}, #5B21B6)`, W, 13), 
                padding:'8px 20px', 
                borderRadius:8, 
                fontWeight:500,
                boxShadow: `0 4px 12px rgba(124, 58, 237, 0.3)`,
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 8px 24px rgba(124, 58, 237, 0.4)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 12px rgba(124, 58, 237, 0.3)`;
              }}
            >
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
        @keyframes slideInDown {
          from { opacity:0; transform: translateY(-12px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity:0; transform: translateY(12px); }
          to   { opacity:1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
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
function CourseCard({ cat, title, meta, pct, btn, catColor = P, onContinue }) {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div 
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ 
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${isHovered ? P : 'rgba(255, 255, 255, 0.3)'}`,
        borderRadius: 12, 
        marginBottom: 12, 
        overflow: 'hidden',
        boxShadow: isHovered ? `0 12px 48px rgba(124, 58, 237, 0.2)` : '0 8px 32px rgba(0, 0, 0, 0.08)',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        cursor: 'pointer'
      }}>
      {/* Top progress stripe */}
      <div style={{ height: 3, background: '#F3F4F6' }}>
        <div 
          style={{ 
            height: 3, 
            width: `${pct}%`, 
            background: catColor === GR ? GR : P, 
            borderRadius: '0 3px 3px 0',
            transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        />
      </div>
      <div style={{ padding: '14px 18px 16px', display: 'flex', gap: 14 }}>
        {/* Doc icon with animation */}
        <div 
          style={{ 
            width: 36, 
            height: 44, 
            background: 'rgba(236, 233, 254, 0.6)',
            backdropFilter: 'blur(8px)',
            borderRadius: 8, 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'center', 
            flexShrink: 0, 
            color: P, 
            fontSize: 16,
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            transform: isHovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1) rotate(0)'
          }}>
          <Icon name="doc" size={18} color={P}/>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: catColor, letterSpacing: .6, textTransform: 'uppercase', margin: '0 0 5px' }}>{cat}</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: T1, margin: '0 0 4px', lineHeight: 1.35 }}>{title}</p>
          <p style={{ fontSize: 12, color: T2, margin: '0 0 14px' }}>{meta}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 160, height: 4, background: '#F3F4F6', borderRadius: 4 }}>
                <div 
                  style={{ 
                    width: `${pct}%`, 
                    height: 4, 
                    background: `linear-gradient(90deg, ${catColor === GR ? GR : P}, ${catColor === GR ? '#047857' : '#5B21B6'})`, 
                    borderRadius: 4,
                    transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    boxShadow: `0 0 8px ${catColor === GR ? 'rgba(5, 150, 105, 0.4)' : 'rgba(124, 58, 237, 0.4)'}`
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: T2 }}>{pct}% complete</span>
            </div>
            <button 
              onClick={onContinue}
              style={{ 
                background: `linear-gradient(135deg, ${P}, #5B21B6)`,
                border: 'none',
                color: W, 
                fontSize: 13, 
                padding: '8px 16px', 
                borderRadius: 8, 
                fontWeight: 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                transform: isHovered ? 'translateY(-2px)' : 'translateY(0)'
              }}>
              {btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── NOTIFICATIONS PANEL ────────────────────────────── */
function NotificationsPanel({ notifications, onClose, isOpen }) {
  if (!isOpen) return null;
  
  return (
    <>
      <div 
        style={{ 
          position:'fixed', 
          inset:0, 
          zIndex:499, 
          background:'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)'
        }} 
        onClick={onClose}
      />
      <div style={{
        position:'absolute', 
        top:54, 
        right:12,
        width:360, 
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius:12, 
        boxShadow:'0 12px 48px rgba(0,0,0,0.12), 0 8px 24px rgba(124, 58, 237, 0.1)',
        zIndex:500, 
        overflow:'hidden', 
        maxHeight:'500px', 
        overflowY:'auto',
        animation: 'slideInDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}>
        {/* Header */}
        <div style={{ 
          display:'flex', 
          justifyContent:'space-between', 
          alignItems:'center', 
          padding:'16px 18px', 
          borderBottom:`1px solid rgba(229, 231, 235, 0.5)`,
          background: 'rgba(236, 233, 254, 0.3)',
          backdropFilter: 'blur(8px)'
        }}>
          <h3 style={{ fontSize:15, fontWeight:600, color:T1, margin:0 }}>Notifications</h3>
          <button 
            onClick={onClose}
            style={{ 
              width:24, 
              height:24, 
              background:'none', 
              border:'none', 
              cursor:'pointer', 
              padding:0, 
              display:'flex', 
              alignItems:'center', 
              justifyContent:'center',
              transition: 'all 0.2s ease',
              borderRadius: 6
            }}
            onMouseEnter={(e) => e.target.style.background = 'rgba(123, 58, 237, 0.1)'}
            onMouseLeave={(e) => e.target.style.background = 'none'}
          >
            <Icon name="close" size={16} color={T2}/>
          </button>
        </div>
        
        {/* Notifications list */}
        {notifications.length === 0 ? (
          <div style={{ padding:'32px 16px', textAlign:'center' }}>
            <div style={{ fontSize:32, marginBottom:8, animation: 'float 3s ease-in-out infinite' }}>🔔</div>
            <p style={{ fontSize:13, color:T2, margin:0 }}>No new notifications</p>
          </div>
        ) : (
          notifications.map((notif, i) => (
            <div 
              key={notif.id} 
              style={{ 
                padding:'14px 16px', 
                borderBottom:i < notifications.length - 1 ? `1px solid rgba(229, 231, 235, 0.4)` : 'none', 
                cursor:'pointer', 
                transition:'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                background: 'transparent',
                ':hover': { background: 'rgba(236, 233, 254, 0.3)' }
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(236, 233, 254, 0.3)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ display:'flex', gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:T1, margin:'0 0 2px' }}>{notif.title}</p>
                  <p style={{ fontSize:12, color:T2, margin:'0 0 4px', lineHeight:1.4 }}>{notif.desc}</p>
                  <p style={{ fontSize:11, color:T3, margin:0 }}>{notif.time}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ─── MAIN APP ───────────────────────────────────────── */
export default function HomePage({ user, currentPage = 'home', onNavigate = () => {}, onLogout = () => {} }) {

  // Check if user is new — show tour only on first login
  const [tourStep,   setTourStep]   = useState(0);
  const [tourActive, setTourActive] = useState(() => {
    // Only show tour if user hasn't completed it before
    const hasCompletedTour = localStorage.getItem(`tourCompleted_${user?.email}`);
    return !hasCompletedTour;
  });
  const [spotlight,  setSpotlight]  = useState(null);
  const [tipPos,     setTipPos]     = useState({ top:'50%', left:'50%', transform:'translate(-50%,-50%)' });
  const [rsvpStatus, setRsvpStatus] = useState({ 0: false, 1: true, 2: false });
  const [showNotifications, setShowNotifications] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'New Office Hours', desc: 'Project Finance Deep Dive starts in 2 hours', time: '2 hours ago', icon: '📅', read: false },
    { id: 2, title: 'Course Milestone', desc: 'You completed Module 4!', time: '1 day ago', icon: '🎉', read: false },
    { id: 3, title: 'Event Reminder', desc: 'Workshop starts tomorrow at 2:00 PM', time: '1 day ago', icon: '🔔', read: false },
  ]);
  const [unreadCount, setUnreadCount] = useState(3);

  // Real-time notification polling
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate real-time notifications (30% chance)
      if (Math.random() > 0.7 && notifications.length < 10) {
        const sampleNotifs = [
          { title: 'New deal posted', desc: 'Solar project in Kenya now open for investment', icon: '☀️' },
          { title: 'Event starting soon', desc: 'Office Hours: Risk Management in 15 minutes', icon: '📢' },
          { title: 'Portfolio update', desc: 'Your monthly returns summary is ready', icon: '📈' },
          { title: 'Resource available', desc: 'New toolkit: Due Diligence Checklist', icon: '📋' },
          { title: 'Message from host', desc: 'New discussion in Member Circles', icon: '💬' },
        ];
        const newNotif = sampleNotifs[Math.floor(Math.random() * sampleNotifs.length)];
        const notif = {
          id: Math.max(...notifications.map(n=>n.id), 0) + 1,
          ...newNotif,
          time: 'just now',
          read: false
        };
        setNotifications(prev => [notif, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    }, 8000); // Check every 8 seconds
    return () => clearInterval(interval);
  }, [notifications]);

  /* Section refs */
  const sidebarRef  = useRef(null);
  const bannerRef   = useRef(null);
  const statsRef    = useRef(null);
  const resumeRef   = useRef(null);
  const learningRef = useRef(null);
  const eventsRef   = useRef(null);
  const notifRef    = useRef(null);
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

    const TW=340, TH=280, M=18, VP=14;
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
      setTourStep(s => s + 1);
    } else {
      // Tour completed - save to localStorage
      localStorage.setItem(`tourCompleted_${user?.email}`, 'true');
      setTourActive(false);
    }
  };
  const back  = () => tourStep > 0 && setTourStep(s => s - 1);
  const skip  = () => {
    // Tour skipped - save to localStorage
    localStorage.setItem(`tourCompleted_${user?.email}`, 'true');
    setTourActive(false);
  };
  
  /* Event handlers */
  const handleCourseClick = () => {
    onNavigate('learning');
  };
  
  const handleRSVP = (eventIndex) => {
    setRsvpStatus(prev => ({ ...prev, [eventIndex]: !prev[eventIndex] }));
  };
  
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) setUnreadCount(0);
  };
  
  const closeNotifications = () => {
    setShowNotifications(false);
  };
  
  const handleNavigateToLearning = (e) => {
    e.preventDefault();
    onNavigate('learning');
  };
  
  const handleNavigateToVault = (e) => {
    e.preventDefault();
    onNavigate('vault');
  };
  
  const handleNavigateToEvents = (e) => {
    e.preventDefault();
    onNavigate('events');
  };

  /* ── RENDER ── */
  return (
    <div style={{ display:'flex', height:'100vh', background:BG, fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif', fontSize:14, overflow:'hidden' }}>
      {/* Global animations */}
      <style>{`
        @keyframes slideInSidebar { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes slideOutSidebar { from { transform: translateX(0); opacity: 1; } to { transform: translateX(-100%); opacity: 0; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .sidebar-enter { animation: slideInSidebar 0.35s cubic-bezier(0.23, 1, 0.32, 1) forwards; }
        .sidebar-exit { animation: slideOutSidebar 0.35s cubic-bezier(0.77, 0, 0.68, -0.32) forwards; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .nav-item-hover:hover { animation: pulse 0.3s ease-out; }
      `}</style>

      {/* ══ SIDEBAR ══ */}
      <div style={{
        width:200, minWidth:200, background:W, borderRight:`1px solid ${BD}`,
        display:'flex', flexDirection:'column', overflowY:'auto', flexShrink:0, zIndex:5,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        opacity: sidebarOpen ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.35s ease',
        position: sidebarOpen ? 'relative' : 'absolute',
        pointerEvents: sidebarOpen ? 'auto' : 'none',
      }} ref={sidebarRef}>
        {/* Logo */}
        <div style={{ padding:'16px 16px 14px', borderBottom:`1px solid ${BD}`, display:'flex', alignItems:'center', flexShrink:0 }}>
          <LogoFull size="small" variant="dark"/>
        </div>
        {/* Nav items */}
        <div style={{ flex:1, padding:'8px 0' }}>
          {NAV.map((item, i) => {
            if (!item) return <div key={i} style={{ height:1, background:BD, margin:'6px 14px' }}/>;
            const isActive = currentPage === item.key;
            return (
              <div key={i} 
                onClick={() => onNavigate(item.key)}
                style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'8px 14px', margin:'1px 6px', borderRadius:8, cursor:'pointer',
                background: isActive ? PF : 'transparent',
                color:      isActive ? P  : T2,
                fontWeight: isActive ? 500 : 400,
                fontSize:   13,
                borderLeft: isActive ? `3px solid ${P}` : '3px solid transparent',
                transition:'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}>
                <Icon name={item.label} size={15} color={isActive ? P : T3}/>
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
          display:'flex', alignItems:'center', padding:'0 24px', gap:16,
          flexShrink:0, justifyContent:'space-between', position:'relative',
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width:40, height:40, border:'none', borderRadius:10,
              background: sidebarOpen ? 'rgba(91, 33, 182, 0.08)' : 'transparent',
              cursor:'pointer', display:'flex', alignItems:'center',
              justifyContent:'center', color: sidebarOpen ? P : T2, 
              transition:'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              position:'relative',
            }}
            title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            onMouseEnter={(e) => e.currentTarget.style.background = sidebarOpen ? 'rgba(91, 33, 182, 0.12)' : 'rgba(111, 114, 131, 0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.background = sidebarOpen ? 'rgba(91, 33, 182, 0.08)' : 'transparent'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              <line x1="3" y1="6" x2="21" y2="6" style={{ transformOrigin: '12px 6px', transform: sidebarOpen ? 'rotate(45deg) translateY(12px)' : 'rotate(0deg)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}/>
              <line x1="3" y1="12" x2="21" y2="12" style={{ opacity: sidebarOpen ? 0 : 1, transition: 'opacity 0.3s ease' }}/>
              <line x1="3" y1="18" x2="21" y2="18" style={{ transformOrigin: '12px 18px', transform: sidebarOpen ? 'rotate(-45deg) translateY(-12px)' : 'rotate(0deg)', transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}/>
            </svg>
          </button>
          <div style={{ flex:1, maxWidth:400, background:BG, border:`1px solid ${BD}`, borderRadius:10,
            height:36, display:'flex', alignItems:'center', gap:8, padding:'0 12px',
            transition:'all 0.25s ease', boxShadow: 'inset 0 0 0 1px transparent'
          }}>
            <Icon name="search" size={14} color={T3}/>
            <input
              type="text"
              placeholder="Search topics, documents, people, events…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => { e.currentTarget.parentElement.style.borderColor = P; e.currentTarget.parentElement.style.background = W; e.currentTarget.parentElement.style.boxShadow = `0 0 0 2px ${P}20`; }}
              onBlur={(e) => { e.currentTarget.parentElement.style.borderColor = BD; e.currentTarget.parentElement.style.background = BG; e.currentTarget.parentElement.style.boxShadow = 'inset 0 0 0 1px transparent'; }}
              style={{
                flex:1, border:'none', background:'transparent', fontSize:13, color:T1,
                outline:'none', fontFamily:'inherit'
              }}
            />
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div 
              ref={notifRef}
              onClick={handleNotificationClick}
              style={{ width:40, height:40, border:`1px solid ${BD}`, borderRadius:'50%',
              display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative',
              background:'transparent', transition:'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(91, 33, 182, 0.08)'; e.currentTarget.style.borderColor = P; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BD; }}
            >
              <Icon name="bell2" size={16} color={T2} style={{ transition: 'transform 0.2s ease' }}/>
              {unreadCount > 0 && (
                <div style={{ width:8, height:8, background:'#EF4444', borderRadius:'50%', border:'2px solid #fff',
                position:'absolute', top:5, right:5, animation: 'pulse 2s infinite' }}/>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:40, height:40, background:P, borderRadius:'50%',
                display:'flex', alignItems:'center', justifyContent:'center', color:W, fontSize:12, fontWeight:600,
                transition:'all 0.2s ease', cursor:'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = PL; e.currentTarget.style.transform = 'scale(1.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = P; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>

              <button 
                onClick={onLogout}
                style={{
                  padding:'8px 16px', background:'transparent', border:`1px solid ${BD}`, 
                  borderRadius:6, cursor:'pointer', fontSize:13, color:T2, fontFamily:'inherit',
                  fontWeight:500, transition:'all .2s'
                }}
                onMouseEnter={(e) => { e.target.style.background = BG; }}
                onMouseLeave={(e) => { e.target.style.background = 'transparent'; }}
              >
                Log out
              </button>
            </div>
          </div>
          
          {/* Notifications panel */}
          <NotificationsPanel 
            notifications={notifications} 
            onClose={closeNotifications} 
            isOpen={showNotifications}
          />
        </div>

        {/* SCROLLABLE CONTENT */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px 60px' }}>
          {currentPage === 'home' && (
            <>
          {/* ── WELCOME BANNER ── */}
          <div ref={bannerRef} style={{
            background:`linear-gradient(135deg, ${PD} 0%, ${P} 55%, ${PL} 100%)`,
            borderRadius:16, padding:'26px 32px', marginBottom:20,
            display:'flex', justifyContent:'space-between', alignItems:'center', gap:24,
          }}>
            <div style={{ minWidth:0 }}>
              <p style={{ color:'rgba(255,255,255,.7)', fontSize:10, fontWeight:600, letterSpacing:1.2,
                textTransform:'uppercase', margin:'0 0 8px' }}>WELCOME TO TRIBES CAPITAL</p>
              <h1 style={{ color:W, fontSize:26, fontWeight:700, margin:'0 0 8px', letterSpacing:-.5 }}>
                  Hi {user.name}!👋
              </h1>
              <p style={{ color:'rgba(255,255,255,.8)', fontSize:13, margin:'0 0 16px', maxWidth:400, lineHeight:1.5 }}>
                Explore deals, events, and resources to grow clean energy investments.
              </p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {[
                  { label: 'Deals', page: 'pipeline' },
                  { label: 'Events', page: 'events' },
                  { label: 'Courses', page: 'learning' }
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={() => onNavigate(item.page)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: 8,
                      padding: '10px 20px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: W,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                      e.target.style.boxShadow = '0 12px 48px rgba(0, 0, 0, 0.15)';
                      e.target.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                      e.target.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                      e.target.style.transform = 'translateY(0)';
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Animated Pie Chart */}
            <div style={{ position: 'relative', width: 180, height: 180, flexShrink: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <svg
                width="180"
                height="180"
                viewBox="0 0 140 140"
                style={{
                  transform: 'rotate(-90deg)',
                  animation: 'spin 8s linear infinite',
                }}
              >
                {/* Background circle */}
                <circle cx="70" cy="70" r="65" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                
                {/* Pie segments with animation */}
                <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="12" strokeDasharray="103 344" strokeDashoffset="0" style={{ animation: 'dashSlide 3s ease-in-out infinite' }}/>
                <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="12" strokeDasharray="86 344" strokeDashoffset="-103" style={{ animation: 'dashSlide2 3s ease-in-out infinite' }}/>
                <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="12" strokeDasharray="69 344" strokeDashoffset="-189" style={{ animation: 'dashSlide3 3s ease-in-out infinite' }}/>
                <circle cx="70" cy="70" r="55" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="12" strokeDasharray="86 344" strokeDashoffset="-258"/>
                
                {/* Center circle */}
                <circle cx="70" cy="70" r="35" fill="white"/>
              </svg>
              
              {/* Logo at center */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <LogoMark size={76} animate={false} />
              </div>
              
              <style>{`
                @keyframes spin {
                  from { transform: rotate(-90deg); }
                  to { transform: rotate(270deg); }
                }
                @keyframes dashSlide {
                  0%, 100% { stroke-dashoffset: 0; }
                  50% { stroke-dashoffset: -20; }
                }
                @keyframes dashSlide2 {
                  0%, 100% { stroke-dashoffset: -103; }
                  50% { stroke-dashoffset: -123; }
                }
                @keyframes dashSlide3 {
                  0%, 100% { stroke-dashoffset: -189; }
                  50% { stroke-dashoffset: -209; }
                }
              `}</style>
            </div>
          </div>

          {/* ── STATS ROW ── */}
          <div ref={statsRef} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
            {[
              { l:'Community members', v:'Active', badge:'Join us', bc:P,   bb:PF  },
              { l:'Active projects',   v:'Growing',  badge:'In progress',      bc:GR,  bb:GRB },
              { l:'Vault docs',        v:'Archive',  badge:'Available',     bc:TL,  bb:TLB },
              { l:'Events',            v:'Upcoming',   badge:'Weekly',      bc:AM,  bb:AMB },
            ].map(s=>(
              <div key={s.l} style={{ background:W, border:`1px solid ${BD}`, borderRadius:10, padding:'16px 20px' }}>
                <p style={{ fontSize:12, color:T2, margin:'0 0 6px' }}>{s.l}</p>
                <p style={{ fontSize:20, fontWeight:700, color:T1, margin:'0 0 8px', letterSpacing:-.8 }}>{s.v}</p>
                <span style={{ background:s.bb, color:s.bc, fontSize:11, fontWeight:500, padding:'2px 10px', borderRadius:20 }}>
                  {s.badge}
                </span>
              </div>
            ))}
          </div>

          {/* ── RESUME CARD ── */}
          <div ref={resumeRef} style={{
            background:W, border:`1px solid ${BD}`, borderRadius:12, padding:'16px 20px',
            marginBottom:24, display:'flex', alignItems:'center', gap:16,
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
            <button 
              onClick={handleCourseClick}
              style={{ ...btnStyle('none', P, W, 13), padding:'10px 20px', borderRadius:8, fontWeight:500, flexShrink:0 }}>
              Continue
            </button>
          </div>

          {/* ── TWO-COLUMN GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 290px', gap:24 }}>

            {/* LEFT COLUMN */}
            <div>
              {/* Learning section */}
              <div ref={learningRef}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:16, fontWeight:600, color:T1, margin:0 }}>Learning</h2>
                  <a 
                    href="#" 
                    onClick={handleNavigateToLearning}
                    style={{ fontSize:13, color:P, textDecoration:'none', display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
                    Go to Learning Hub <Icon name="arrow" size={13} color={P}/>
                  </a>
                </div>
                <CourseCard 
                  cat="PROJECT FINANCE — MODULE 4" 
                  title="Understanding Clean Energy Ownership Structures" 
                  meta="Lesson 6 of 10 · 38 min · Certificate" 
                  pct={65} 
                  btn="Continue lesson"
                  onContinue={handleCourseClick}
                />
                <CourseCard 
                  cat="PROJECT FINANCE — MODULE 4" 
                  title="Understanding Clean Energy Ownership Structures" 
                  meta="Lesson 6 of 10 · 38 min · Certificate" 
                  pct={20}  
                  btn="Continue lesson"
                  onContinue={handleCourseClick}
                />
              </div>

              {/* Events section */}
              <div ref={eventsRef} style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                  <h2 style={{ fontSize:16, fontWeight:600, color:T1, margin:0 }}>
                    Upcoming events <span style={{ fontSize:13, color:T3, fontWeight:400 }}>(8)</span>
                  </h2>
                  <a 
                    href="#" 
                    onClick={handleNavigateToEvents}
                    style={{ fontSize:13, color:P, textDecoration:'none', display:'flex', alignItems:'center', gap:4, cursor:'pointer' }}>
                    View all <Icon name="arrow" size={13} color={P}/>
                  </a>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {[
                    { mo:'JUN',dy:'5', dw:'THU',type:'OFFICE HOURS',title:'Project Finance Deep Dive: Structuring Your First Deal',    meta:'3:00 PM GMT · Kwame Asante · 14 spots left', tc:BLU,tb:BLB },
                    { mo:'JUN',dy:'10',dw:'TUE',type:'WORKSHOP',    title:'Building a 1MW Financial Model from Scratch',               meta:'2:00 PM GMT · Ngozi Fakoya · 2h session',      tc:GR, tb:GRB },
                    { mo:'JUN',dy:'17',dw:'TUE',type:'MEMBER CIRCLE',title:'West Africa Energy Deal Flow — June Roundtable',          meta:'4:00 PM GMT · Members only · 30 spots',        tc:P,  tb:PF  },
                  ].map((ev,i,arr)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 18px',
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none' }}>
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
                      <button 
                        onClick={() => handleRSVP(i)}
                        style={{
                        ...btnStyle(rsvpStatus[i]?`1px solid ${GR}`:'none', rsvpStatus[i]?GRB:P, rsvpStatus[i]?GR:W, 12),
                        padding:'7px 14px', borderRadius:7, fontWeight:500, flexShrink:0,
                      }}>{rsvpStatus[i]?'✓ RSVPed':'RSVP'}</button>
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
                  <a 
                    href="#" 
                    onClick={handleNavigateToVault}
                    style={{ fontSize:12, color:P, textDecoration:'none', cursor:'pointer' }}>Open vault</a>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {[
                    { bg:'#FEE2E2',em:'📄',nm:'Investment Framework Template Q1 2026',mt:'PDF · v2.1 · 2 days ago' },
                    { bg:'#D1FAE5',em:'📊',nm:'Investment Framework Template Q1 2026',mt:'PDF · v2.1 · 2 days ago' },
                    { bg:'#DBEAFE',em:'📝',nm:'Investment Framework Template Q1 2026',mt:'PDF · v2.1 · 2 days ago' },
                  ].map((d,i,arr)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none', cursor:'pointer', transition:'background .2s' }}>
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
                  <a 
                    href="#" 
                    onClick={(e) => { e.preventDefault(); onNavigate('announcements'); }}
                    style={{ fontSize:12, color:P, textDecoration:'none', cursor:'pointer' }}>View all</a>
                </div>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, overflow:'hidden' }}>
                  {[
                    { dot:GR, nm:'Project Financing Deep Dive', dt:'Thu, May 8 · 3:00 PM GMT' },
                    { dot:P,  nm:'Project Financing Deep Dive', dt:'Thu, May 8 · 3:00 PM GMT' },
                    { dot:AM, nm:'Project Financing Deep Dive', dt:'Thu, May 8 · 3:00 PM GMT' },
                  ].map((a,i,arr)=>(
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none', cursor:'pointer', transition:'background .2s' }}>
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
                      borderBottom:i<arr.length-1?`1px solid ${BD}`:'none', cursor:'pointer', transition:'background .2s' }}>
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
          
          {currentPage === 'reporting' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Reporting Library</h1>
              <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:40, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📈</div>
                <h2 style={{ fontSize:20, fontWeight:600, color:T1, margin:'0 0 8px' }}>Reporting Library</h2>
                <p style={{ fontSize:14, color:T2, margin:0 }}>Access performance reports and analytics here.</p>
              </div>
            </div>
          )}
          
          {currentPage === 'vault' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Due Diligence Vault</h1>
              <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:24, maxWidth:800 }}>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:48, textAlign:'center', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'relative', zIndex:1 }}>
                    <div style={{ fontSize:64, marginBottom:20 }}>🔐</div>
                    <h2 style={{ fontSize:24, fontWeight:700, color:P, margin:'0 0 12px' }}>Coming Soon</h2>
                    <p style={{ fontSize:14, color:T2, margin:'0 0 24px', lineHeight:1.6 }}>
                      Our Due Diligence Vault is being built to give you secure access to document management, legal resources, and technical assessments for clean energy projects.
                    </p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                      <div style={{ width:8, height:8, background:P, borderRadius:'50%', animation:'pulse 2s infinite' }}/>
                      <span style={{ fontSize:13, color:P, fontWeight:500 }}>Launching Q3 2024</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:24 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 12px' }}>Features coming to the Vault:</h3>
                  <ul style={{ margin:0, paddingLeft:20, fontSize:13, color:T2, lineHeight:1.8 }}>
                    <li>Secure document storage & management</li>
                    <li>Project technical assessments</li>
                    <li>Legal & compliance resources</li>
                    <li>Investment memorandums</li>
                    <li>Due diligence checklists</li>
                    <li>Real-time collaboration tools</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {currentPage === 'pipeline' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Project Pipeline</h1>
              <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:24, maxWidth:800 }}>
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:48, textAlign:'center', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'relative', zIndex:1 }}>
                    <div style={{ fontSize:64, marginBottom:20 }}>📊</div>
                    <h2 style={{ fontSize:24, fontWeight:700, color:BLU, margin:'0 0 12px' }}>Coming Soon</h2>
                    <p style={{ fontSize:14, color:T2, margin:'0 0 24px', lineHeight:1.6 }}>
                      Browse and invest in our curated pipeline of clean energy projects across Africa. Real-time deal flow, project metrics, and investment opportunities.
                    </p>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                      <div style={{ width:8, height:8, background:BLU, borderRadius:'50%', animation:'pulse 2s infinite' }}/>
                      <span style={{ fontSize:13, color:BLU, fontWeight:500 }}>Launching Q3 2024</span>
                    </div>
                  </div>
                </div>
                
                <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:24 }}>
                  <h3 style={{ fontSize:14, fontWeight:600, color:T1, margin:'0 0 12px' }}>Pipeline Features:</h3>
                  <ul style={{ margin:0, paddingLeft:20, fontSize:13, color:T2, lineHeight:1.8 }}>
                    <li>Active project listings & opportunities</li>
                    <li>Project financials & metrics</li>
                    <li>Investment amount & terms</li>
                    <li>Risk & return analysis</li>
                    <li>Due diligence resources</li>
                    <li>Direct communication with project teams</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
          
          {currentPage === 'events' && (
            <OfficeHoursEvents />
          )}
          
          {currentPage === 'circles' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Member Circles</h1>
              <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:40, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>👥</div>
                <h2 style={{ fontSize:20, fontWeight:600, color:T1, margin:'0 0 8px' }}>Member Circles</h2>
                <p style={{ fontSize:14, color:T2, margin:0 }}>Connect with community circles and groups here.</p>
              </div>
            </div>
          )}
          
          {currentPage === 'toolkits' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Toolkits & Templates</h1>
              <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:40, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🛠️</div>
                <h2 style={{ fontSize:20, fontWeight:600, color:T1, margin:'0 0 8px' }}>Toolkits & Templates</h2>
                <p style={{ fontSize:14, color:T2, margin:0 }}>Access useful resources and templates here.</p>
              </div>
            </div>
          )}
          
          {currentPage === 'marketplace' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Partner Marketplace</h1>
              <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:40, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>🏪</div>
                <h2 style={{ fontSize:20, fontWeight:600, color:T1, margin:'0 0 8px' }}>Partner Marketplace</h2>
                <p style={{ fontSize:14, color:T2, margin:0 }}>Discover partner services and opportunities here.</p>
              </div>
            </div>
          )}
          
          {currentPage === 'announcements' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Announcements & Feedback</h1>
              <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:40, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>📢</div>
                <h2 style={{ fontSize:20, fontWeight:600, color:T1, margin:'0 0 8px' }}>Announcements & Feedback</h2>
                <p style={{ fontSize:14, color:T2, margin:0 }}>Stay updated and share feedback here.</p>
              </div>
            </div>
          )}
          
          {currentPage === 'help' && (
            <div style={{ padding:'24px 0' }}>
              <h1 style={{ fontSize:28, fontWeight:700, color:T1, margin:'0 0 24px' }}>Help & Support</h1>
              <div style={{ background:W, border:`1px solid ${BD}`, borderRadius:12, padding:40, textAlign:'center' }}>
                <div style={{ fontSize:48, marginBottom:16 }}>❓</div>
                <h2 style={{ fontSize:20, fontWeight:600, color:T1, margin:'0 0 8px' }}>Help & Support</h2>
                <p style={{ fontSize:14, color:T2, margin:0 }}>Get help and support here.</p>
              </div>
            </div>
          )}

          {currentPage === 'learning' && (
            <LearningHub />
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
        />
      )}
    </div>
  );
}
