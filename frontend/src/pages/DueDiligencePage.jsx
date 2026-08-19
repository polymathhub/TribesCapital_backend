import React, { useState, useEffect, useRef, useMemo } from "react";
import * as pdfjsLib from 'pdfjs-dist';
import { dueDiligenceAPI } from '../api/endpoints';
import dueDiligenceIllustration from '../assets/illustrations/Questions.mp4';
import dueDiligenceGif from '../assets/illustrations/Accept-tasks.gif';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();

/* ═══════════════════════════════════════════════════════════
   TRIBES CAPITAL — DUE DILIGENCE VAULT
   Interactive · functional · responsive (mobile / tablet / desktop)

   Flows, end to end:
     CREATE  → panel → validate → row appears → "Due diligence created"
     EDIT    → panel prefilled → "Save changes" → row updates
     DELETE  → confirm modal → row removed → "Document deleted"

   Permissions: this user may only manage document uploads (PERMS below).
═══════════════════════════════════════════════════════════ */

/* ─── TOKENS (sampled from the supplied screens) ─── */
const P   = '#6700A6';   // primary purple — buttons
const PL  = '#8B3FD6';   // purple accent — active nav, links, pills
const PF  = '#F5EDFC';   // faint purple fill
const PB  = '#E9D5F7';   // purple border

const T1  = '#1F1F24';   // primary text
const T2  = '#6B6F76';   // secondary text
const T3  = '#9CA0A8';   // muted / placeholder

const BD  = '#E7E8EC';   // hairline
const BG  = '#F7F7F8';   // neutral surface (inputs, table header, meta cells)
const W   = '#FFFFFF';

/* Page canvas — use pure white background and white panel */
const PAGE      = '#FFFFFF';
const PANEL     = '#FFFFFF';
const PANEL_BD  = '#F3F4F6';

const AMB_BG = '#FDF6E3', AMB_BD = '#F0E0B0', AMB_TX = '#8B5A2B';
const RED    = '#DC2626', RED_BG = '#FEF2F2', RED_BD = '#FECACA';
const GRN    = '#16A34A', GRN_BG = '#F0FDF4', GRN_BD = '#BBF7D0';

function getCurrentPermissions() {
  try {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null;
    if (!stored) return { canCreate: false, canEdit: false, canDelete: false };
    const user = JSON.parse(stored);
    const roles = user?.roles || [];
    const isAdmin = user?.isAdmin || (roles.includes && roles.includes('admin'));
    return {
      canCreate: Boolean(isAdmin || roles.includes('editor') || roles.includes('contributor')),
      canEdit: Boolean(isAdmin || roles.includes('editor') || roles.includes('moderator')),
      canDelete: Boolean(isAdmin || roles.includes('admin') || roles.includes('moderator')),
    };
  } catch (e) {
    return { canCreate: false, canEdit: false, canDelete: false };
  }
}

const PERMS = getCurrentPermissions();

// Dynamic permissions state — recompute on auth changes or storage events.
function useDynamicPerms() {
  const [perms, setPerms] = useState(() => getCurrentPermissions());
  useEffect(() => {
    const refresh = () => setPerms(getCurrentPermissions());
    // Listen for storage events from other tabs and custom auth updates
    window.addEventListener('storage', refresh);
    window.addEventListener('tribes:auth-updated', refresh);
    // Refresh once on mount
    refresh();
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('tribes:auth-updated', refresh);
    };
  }, []);
  return perms;
}

/* ─── RESPONSIVE ─── */
function useBreakpoint() {
  const [w, setW] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1280));
  useEffect(() => {
    const h = () => setW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);
  return { w, isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024 };
}

/* ─── ICONS ─── */
const PATHS = {
  home:    <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></>,
  book:    <><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></>,
  shield:  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>,
  cal:     <><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
  bell:    <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  help:    <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  chevD:   <polyline points="6,9 12,15 18,9"/>,
  chevL:   <polyline points="15,18 9,12 15,6"/>,
  chevR:   <polyline points="9,18 15,12 9,6"/>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z"/></>,
  trash:   <><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
  upload:  <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
  file:    <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  inbox:   <><polyline points="22,12 16,12 14,15 10,15 8,12 2,12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  menu:    <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  check:   <polyline points="20,6 9,17 4,12"/>,
  refresh: <><polyline points="23,4 23,10 17,10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
  lock:    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
  download:<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
};
function I({ k, s = 16, c = T2, sw = 1.6, fill = 'none' }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill} stroke={c}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }} aria-hidden="true">
      {PATHS[k]}
    </svg>
  );
}

/* ─── DATA ─── */
const SEED = [
  { id: 1, title: 'Investment Framework Template Q1 2026', targetName: 'Data Center',    type: 'Investment', targetType: 'Company', priority: 'Low',    deadline: '12/06/2026', fileType: 'PDF',  size: '1.4 MB', updated: '2 days ago',  category: 'Investment Framework', description: 'Comprehensive investment framework covering diligence criteria, risk assessment, and financial modelling for clean energy projects.' },
  { id: 2, title: 'Portfolio Financial Dashboard Model',   targetName: 'Financial Models', type: 'Investment', targetType: 'Company', priority: 'Low',  deadline: '12/06/2026', fileType: 'PDF',  size: '5.1 MB', updated: '1 week ago',  category: 'Financial Models',     description: 'Multi-asset portfolio tracking model. Consolidates financials across projects with automated reporting and benchmarking.' },
  { id: 3, title: 'Technical Site Assessment Template',    targetName: 'Data Center',    type: 'Investment', targetType: 'Company', priority: 'Medium', deadline: '18/07/2026', fileType: 'DOCX', size: '2.2 MB', updated: '3 days ago',  category: 'Technical',            description: 'Site assessment checklist covering grid access, land tenure, irradiance data, and environmental constraints.' },
  { id: 4, title: 'ESG Compliance Checklist 2026',         targetName: 'Compliance',     type: 'Diligence',  targetType: 'Fund',    priority: 'High',   deadline: '02/05/2026', fileType: 'XLSX', size: '0.8 MB', updated: '2 weeks ago', category: 'Legal & Compliance',   description: 'Environmental, social and governance compliance checklist aligned with IFC Performance Standards.' },
  { id: 5, title: 'West Africa Market Analysis',           targetName: 'Market Research', type: 'Research',  targetType: 'Sector',  priority: 'Low',    deadline: '30/08/2026', fileType: 'PDF',  size: '3.6 MB', updated: '1 month ago', category: 'Market Research',      description: 'Market sizing and opportunity analysis for off-grid solar and mini-grid deployments across West Africa.' },
];

const TYPES        = ['Investment', 'Diligence', 'Research', 'Legal'];
const TARGET_TYPES = ['Company', 'Fund', 'Sector', 'Asset'];
const PRIORITIES   = ['Low', 'Medium', 'High'];
const STATUSES     = ['Open', 'In review', 'Completed'];
const FILE_TINT    = { PDF: { c: '#DC2626', b: '#FEF2F2' }, DOCX: { c: '#1D4ED8', b: '#EFF6FF' }, XLSX: { c: '#16A34A', b: '#DCFCE7' }, PPTX: { c: '#D97706', b: '#FEF3C7' } };
const PER_PAGE = 10;
const DILIGENCE_STORAGE_KEY = 'tribes-diligence-docs';

function readStoredDiligenceDocs() {
  if (typeof window === 'undefined') return [];
  try {
    const storedValue = window.localStorage.getItem(DILIGENCE_STORAGE_KEY);
    if (!storedValue) return [];
    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStoredDiligenceDocs(docs) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DILIGENCE_STORAGE_KEY, JSON.stringify(docs));
  window.dispatchEvent(new Event('tribes:app-state-update'));
}

/* ─── PRIMITIVES ─── */
const inputStyle = {
  width: '100%', height: 46, border: `1px solid ${BD}`, borderRadius: 8,
  fontSize: 14, color: T1, padding: '0 14px', background: W,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
};

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: T1, marginBottom: 6 }}>
        {label}{required && <span style={{ color: RED }}> *</span>}
      </label>
      {children}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, invalid, type = 'text' }) {
  const [f, setF] = useState(false);
  return (
    <input
      type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{
        ...inputStyle,
        borderColor: invalid ? RED : f ? PL : BD,
        boxShadow: f && !invalid ? `0 0 0 3px ${PF}` : 'none',
      }}
    />
  );
}

function Select({ value, onChange, options, placeholder, invalid }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{
          ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 38,
          color: value ? T1 : T3,
          borderColor: invalid ? RED : f ? PL : BD,
          boxShadow: f && !invalid ? `0 0 0 3px ${PF}` : 'none',
        }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <I k="chevD" s={15} c={T3} />
      </span>
    </div>
  );
}

/* Read-only field — used when a value may be viewed but not changed */
function LockedField({ label, value, tall }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, fontWeight: 500, color: T2, marginBottom: 6,
      }}>
        {label}<I k="lock" s={12} c={T3} />
      </div>
      <div style={{
        ...inputStyle, background: BG, color: T2, cursor: 'not-allowed',
        display: 'flex', alignItems: tall ? 'flex-start' : 'center',
        height: tall ? 'auto' : 46, minHeight: tall ? 92 : 46,
        padding: tall ? '12px 14px' : '0 14px',
        lineHeight: 1.6, whiteSpace: 'pre-wrap',
      }}>{value || '—'}</div>
    </div>
  );
}

function Btn({ onClick, children, variant = 'primary', full, disabled }) {
  const v = {
    primary: { background: P, color: W, border: 'none' },
    ghost:   { background: W, color: T1, border: `1px solid ${BD}` },
    danger:  { background: RED, color: W, border: 'none' },
  }[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{
        ...v, padding: '11px 22px', borderRadius: 8, fontSize: 14, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        whiteSpace: 'nowrap', width: full ? '100%' : 'auto', opacity: disabled ? 0.55 : 1,
      }}>
      {children}
    </button>
  );
}

function PriorityPill({ level }) {
  return (
    <span style={{
      display: 'inline-block', padding: '5px 18px', borderRadius: 999,
      border: `1px solid ${PB}`, background: PF, color: PL,
      fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
    }}>{level}</span>
  );
}

/* ═══ OVERLAY — dims the content area only, never the sidebar ═══ */
function Overlay({ onClick, offset, z = 200, dark = 0.45 }) {
  return (
    <div onClick={onClick} style={{
      position: 'fixed', top: 0, right: 0, bottom: 0, left: offset,
      background: `rgba(30,30,35,${dark})`, zIndex: z,
    }} />
  );
}

/* ═══ SIDEBAR ═══ */
const NAV = [
  { id: 'home',     label: 'Home',                     icon: 'home' },
  { id: 'learning', label: 'Learning Hub',             icon: 'book' },
  { id: 'vault',    label: 'Due Diligence Vault',      icon: 'shield', active: true },
  { id: 'events',   label: 'Office Hours & Events',    icon: 'cal' },
  null,
  { id: 'announce', label: 'Announcements & Feedback', icon: 'bell' },
  { id: 'help',     label: 'Help',                     icon: 'help' },
];

const SIDEBAR_W = 260;

function Sidebar({ open, onClose, isMobile, isTablet, onLogout }) {
  const overlay = isMobile || isTablet;
  if (!open) return null;                       // closable on every breakpoint
  return (
    <>
      {overlay && <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 300 }} />}
      <aside style={{
        width: 260, minWidth: 260, background: W, borderRight: `1px solid ${BD}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        ...(overlay
          ? { position: 'fixed', top: 0, left: 0, height: '100%', zIndex: 301, boxShadow: '4px 0 28px rgba(0,0,0,.18)' }
          : { position: 'sticky', top: 0, height: '100vh' }),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width={28} height={28} viewBox="0 0 28 28" fill="none" aria-hidden="true">
              <circle cx="14" cy="14" r="12" stroke={P} strokeWidth="2.2" />
              <path d="M14 8v8M9.5 14h9" stroke={P} strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 700, color: T1, letterSpacing: 1, textTransform: 'uppercase' }}>
              Tribes Capital
            </span>
          </div>
          <button onClick={onClose} aria-label="Close menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <I k="x" s={18} c={T2} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 18px' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#E4D3F5', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: T1 }}>Oyewumi Olukunle</div>
            <div style={{ fontSize: 12, color: T2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              oyewumi.olukunle@gmail.c…
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '6px 12px', overflowY: 'auto' }}>
          {NAV.map((it, i) => {
            if (!it) return <div key={`d${i}`} style={{ height: 1, background: BD, margin: '10px 8px' }} />;
            return (
              <div key={it.id} onClick={overlay ? onClose : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                  margin: '2px 0', borderRadius: 8, cursor: 'pointer',
                  background: it.active ? PF : 'transparent',
                  color: it.active ? PL : T2,
                  fontSize: 14, fontWeight: it.active ? 500 : 400,
                  borderLeft: it.active ? `3px solid ${PL}` : '3px solid transparent',
                }}>
                <I k={it.icon} s={18} c={it.active ? PL : T2} />
                <span>{it.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={{ padding: 16 }}>
          <button onClick={onLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '13px 16px', borderRadius: 10,
              background: RED_BG, border: `1px solid ${RED_BD}`, color: RED,
              fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}>
            <I k="logout" s={17} c={RED} />Log out
          </button>
        </div>
      </aside>
    </>
  );
}

/* ═══ TOPBAR ═══ */
function TopBar({ onMenu, isMobile, isTablet, sidebarOpen, search, setSearch }) {
  const showBurger = isMobile || isTablet || !sidebarOpen;   // reopen a closed sidebar
  return (
    <header style={{
      height: 64, background: W, borderBottom: `1px solid ${BD}`, display: 'flex',
      alignItems: 'center', padding: `0 ${isMobile ? 14 : 24}px`, gap: 12,
      justifyContent: 'space-between', flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
        {showBurger && (
          <button onClick={onMenu} aria-label="Open menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <I k="menu" s={22} c={T1} />
          </button>
        )}
        {!isMobile ? (
          <div style={{
            flex: 1, maxWidth: 560, background: BG, border: `1px solid ${BD}`, borderRadius: 999,
            height: 44, display: 'flex', alignItems: 'center', gap: 10, padding: '0 18px',
          }}>
            <I k="search" s={17} c={T3} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search topics, documents, people, events…"
              style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: T1, fontFamily: 'inherit' }} />
          </div>
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600, color: T1 }}>Due Diligence</span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, flexShrink: 0 }}>
        {isMobile && (
          <button aria-label="Search" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex' }}>
            <I k="search" s={20} c={T2} />
          </button>
        )}
        <div style={{ position: 'relative', display: 'flex', cursor: 'pointer' }}>
          <I k="bell" s={21} c={T2} />
          <span style={{ position: 'absolute', top: -1, right: -1, width: 8, height: 8, borderRadius: '50%', background: PL, border: `1.5px solid ${W}` }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%', background: '#A21CAF', color: W,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 600,
          }}>A</div>
          {!isMobile && <span style={{ fontSize: 14, color: T1 }}>Ali</span>}
        </div>
      </div>
    </header>
  );
}

/* ═══ CREATE / EDIT PANEL ═══ */
const BLANK = { title: '', targetName: '', type: '', targetType: '', priority: '', deadline: '', description: '', fileName: '' };

function getRequestErrorMessage(error, fallback) {
  const responseMessage = error?.response?.data?.message;
  if (Array.isArray(responseMessage)) {
    return responseMessage.join(', ');
  }
  if (typeof responseMessage === 'string' && responseMessage.trim()) {
    return responseMessage;
  }
  return error?.message || fallback;
}

function toDeadlineISOString(value) {
  if (!value || typeof value !== 'string') return undefined;

  const trimmed = value.trim();
  let year;
  let month;
  let day;
  const dayFirst = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(trimmed);
  const yearFirst = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);

  if (dayFirst) {
    [, day, month, year] = dayFirst;
  } else if (yearFirst) {
    [, year, month, day] = yearFirst;
  } else {
    return undefined;
  }

  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year)
    || date.getUTCMonth() !== Number(month) - 1
    || date.getUTCDate() !== Number(day)
  ) {
    return undefined;
  }

  return date.toISOString();
}

function DiligencePanel({ initial, onClose, onSave, isMobile, offset }) {
  const editing = !!initial;
  const [f, setF] = useState(initial ? { ...BLANK, ...initial } : BLANK);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingLabel, setSavingLabel] = useState('Creating…');
  const [drag, setDrag] = useState(false);
  const [step, setStep] = useState('form');        // 'form' → 'preview'
  const fileRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErr(e => ({ ...e, [k]: false })); };

  /* Permission: on edit the user may replace the file only — every other
     field is locked, so there is nothing left to validate. */
  const uploadOnly = editing;

  const validate = () => {
    if (uploadOnly) {
      // On edit, still require a file if replacing
      const e = {};
      if (!selectedFile) e.file = true;
      setErr(e);
      return Object.keys(e).length === 0;
    }
    // On create, all fields required including file
    const e = {};
    if (!f.title.trim())       e.title = true;
    if (!f.targetName.trim())  e.targetName = true;
    if (!f.type)               e.type = true;
    if (!f.description.trim()) e.description = true;
    if (!selectedFile) {
      e.file = true;
      alert('You must attach a file before creating a due diligence case.');
    }
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const preview = () => { if (validate()) setStep('preview'); };

  const submit = async () => {
    if (!validate()) { setStep('form'); return; }
    setSaving(true);
    setSavingLabel(editing ? 'Saving changes…' : 'Creating case…');
    try {
      await onSave({ ...f, file: selectedFile }, setSavingLabel);
    } finally {
      setSaving(false);
    }
  };

  const pick = (file) => {
    if (!file) return;
    setSelectedFile(file);
    set('fileName', file.name);
    const previewUrl = URL.createObjectURL(file);
    setF((prev) => ({ ...prev, previewUrl }));
  };

  const heading = step === 'preview'
    ? (editing ? 'Review changes' : 'Review before creating')
    : (editing ? 'Edit Due Diligence' : 'Create New Due Diligence');

  return (
    <>
      <Overlay onClick={onClose} offset={offset} />
      <div role="dialog" aria-modal="true"
        style={{
          position: 'fixed', zIndex: 201, background: W,
          display: 'flex', flexDirection: 'column',
          top: 0, right: 0, bottom: 0,                 /* full-height drawer, flush right */
          width: isMobile ? '100%' : 420,
          borderRadius: 0,
          boxShadow: '-8px 0 40px rgba(0,0,0,.18)',
        }}>
        {/* Header — title left, close right */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${BD}`, flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: T1, margin: 0 }}>{heading}</h2>
          <button onClick={onClose} aria-label="Close"
            style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: W, border: `1px solid ${BD}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <I k="x" s={14} c={T2} sw={2} />
          </button>
        </div>

        {step === 'preview' ? (
          /* ── REVIEW ── read-only check before saving ── */
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
            <div style={{
              background: PF, border: `1px solid ${PB}`, borderRadius: 10,
              padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#5B2A86', lineHeight: 1.6,
            }}>
              Check the details below. Nothing is saved until you {editing ? 'save changes' : 'create'}.
            </div>

            {[
              ['File',            f.fileName || 'No file attached'],
              ['Title',           f.title],
              ['Target Name',     f.targetName],
              ['Type',            f.type],
              ['Target Type',     f.targetType || '—'],
              ['Priority',        f.priority || '—'],
              ['Target Deadline', f.deadline || '—'],
            ].map(([label, val]) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', gap: 16,
                padding: '12px 0', borderBottom: `1px solid ${BD}`,
              }}>
                <span style={{ fontSize: 13, color: T2, flexShrink: 0 }}>{label}</span>
                <span style={{ fontSize: 14, color: T1, fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>
                  {val}
                </span>
              </div>
            ))}

            <div style={{ fontSize: 13, color: T2, margin: '18px 0 6px' }}>Description</div>
            <p style={{
              fontSize: 14, color: T1, lineHeight: 1.7, margin: 0,
              background: BG, borderRadius: 8, padding: '12px 14px', whiteSpace: 'pre-wrap',
            }}>{f.description}</p>
          </div>
        ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
          {uploadOnly && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: PF, border: `1px solid ${PB}`, borderRadius: 10,
              padding: '12px 14px', marginBottom: 18,
              fontSize: 13, color: '#5B2A86', lineHeight: 1.6,
            }}>
              <span style={{ marginTop: 2 }}><I k="lock" s={14} c="#5B2A86" /></span>
              You can replace the uploaded file. The other details are locked.
            </div>
          )}
          <div
            onClick={() => fileRef.current && fileRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files[0]); }}
            style={{
              border: `1.5px dashed ${drag ? PL : BD}`, borderRadius: 16,
              background: drag ? PF : W, padding: '14px', textAlign: 'center',
              cursor: 'pointer', marginBottom: 20, transition: 'all .15s',
              boxShadow: drag ? `0 8px 28px rgba(103,0,166,0.10)` : 'none',
            }}>
            <input ref={fileRef} type="file" hidden
              onChange={e => pick(e.target.files[0])} />

            {f.fileName ? (
              <div style={{
                minHeight: 210, borderRadius: 12, overflow: 'hidden',
                background: '#F8F5FD', border: `1px solid ${PB}`,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: '#FFFFFF',
                  position: 'relative', padding: 12,
                }}>
                  {(selectedFile && selectedFile.type?.startsWith('image/')) ? (
                    <img
                      src={f.previewUrl || URL.createObjectURL(selectedFile)}
                      alt={f.fileName}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '100%', borderRadius: 10,
                      background: 'linear-gradient(135deg, #F5EDFC 0%, #F9F5FF 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexDirection: 'column', gap: 12,
                    }}>
                      <div style={{
                        width: 74, height: 74, borderRadius: 18,
                        background: W, border: `1px solid ${PB}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 22px rgba(103,0,166,0.10)',
                      }}>
                        <I k="file" s={34} c={PL} />
                      </div>
                      <div style={{ fontSize: 13, color: T2, fontWeight: 600 }}>{(selectedFile?.type || 'document').split('/').pop()?.toUpperCase() || 'FILE'}</div>
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '12px 14px', background: W, borderTop: `1px solid ${PB}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                }}>
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.fileName}</div>
                    <div style={{ fontSize: 12, color: T3, marginTop: 2 }}>Attached and ready to create</div>
                  </div>
                  <div style={{
                    width: 34, height: 34, borderRadius: 999,
                    background: selectedFile?.type?.startsWith('image/') ? '#F5EDFC' : '#EEF2FF',
                    border: `1px solid ${PB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(103,0,166,0.08)',
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 16V5" stroke="#8B3FD6" strokeWidth="1.9" strokeLinecap="round" />
                      <path d="M8.5 8.5L12 5l3.5 3.5" stroke="#8B3FD6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M4 15.5V18a2 2 0 002 2h12a2 2 0 002-2v-2.5" stroke="#8B3FD6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '26px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'linear-gradient(135deg, #F5EDFC 0%, #F9F5FF 100%)',
                  border: `1px solid ${PB}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(103,0,166,0.08)',
                }}>
                  <I k="upload" s={28} c={PL} />
                </div>
                <div style={{ fontSize: 14, color: T1, fontWeight: 600 }}>
                  <span style={{ color: PL }}>Click to upload</span> or drag and drop
                </div>
                <div style={{ fontSize: 12, color: T3 }}>PDF, DOCX, XLSX, PPTX, images, and photos — max 50MB</div>
              </div>
            )}
            {err.file && <div style={{ marginTop: 10, fontSize: 12, color: RED }}>Attach a document before creating the due diligence case.</div>}
          </div>

          {uploadOnly ? (
            /* ── EDIT: replace the file only. Everything else is read-only. ── */
            <>
              <LockedField label="Title"           value={f.title} />
              <LockedField label="Target Name"     value={f.targetName} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <LockedField label="Type"          value={f.type} />
                <LockedField label="Target Type"   value={f.targetType} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <LockedField label="Priority"      value={f.priority} />
                <LockedField label="Target Deadline" value={f.deadline} />
              </div>
              <LockedField label="Description"     value={f.description} tall />
            </>
          ) : (
            <>
              <Field label="Title" required>
                <TextInput value={f.title} onChange={v => set('title', v)} placeholder="Enter document" invalid={err.title} />
              </Field>

              <Field label="Target Name" required>
                <TextInput value={f.targetName} onChange={v => set('targetName', v)} placeholder="Enter document" invalid={err.targetName} />
              </Field>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Type" required>
                  <Select value={f.type} onChange={v => set('type', v)} options={TYPES} placeholder="Select category" invalid={err.type} />
                </Field>
                <Field label="Target Type">
                  <Select value={f.targetType} onChange={v => set('targetType', v)} options={TARGET_TYPES} placeholder="Select file type" />
                </Field>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Priority">
                  <Select value={f.priority} onChange={v => set('priority', v)} options={PRIORITIES} placeholder="Select file type" />
                </Field>
                <Field label="Target Deadline">
                  <TextInput value={f.deadline} onChange={v => set('deadline', v)} placeholder="DD/MM/YYYY" />
                </Field>
              </div>

              <Field label="Description" required>
                <textarea
                  value={f.description} onChange={e => set('description', e.target.value)}
                  placeholder="write something here…." rows={4}
                  style={{
                    ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical',
                    lineHeight: 1.6, borderColor: err.description ? RED : BD,
                  }} />
              </Field>
            </>
          )}
        </div>
        )}

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: `1px solid ${BD}`, background: W,
          display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          {step === 'form' ? (
            <>
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn variant="ghost" onClick={preview}>
                <I k="eye" s={16} c={T1} />Preview
              </Btn>
              <Btn onClick={submit} disabled={saving}>
                {saving ? savingLabel : (editing ? 'Save changes' : 'Create')}
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" onClick={() => setStep('form')}>Back to edit</Btn>
              <Btn onClick={submit} disabled={saving}>
                {saving ? savingLabel : (editing ? 'Save changes' : 'Create')}
              </Btn>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══ DETAIL DRAWER ═══ */
function DetailPanel({ doc, perms, onClose, onEdit, onDelete, onDownload, isMobile, offset }) {
  if (!doc) return null;

  const tint = FILE_TINT[doc.fileType] || FILE_TINT.PDF;
  const cell = { background: BG, borderRadius: 8, padding: '12px 14px' };
  const ext = (doc.fileName || doc.fileType || '').split('.').pop()?.toLowerCase();
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(ext || '');
  const isPdf = ext === 'pdf';
  const previewUrl = doc.fileUrl || '';
  const canEdit = Boolean(perms?.canEdit);
  const canDelete = Boolean(perms?.canDelete);

  return (
    <>
      <Overlay onClick={onClose} offset={offset} />
      <div role="dialog" aria-modal="true"
        style={{
          position: 'fixed', zIndex: 201, background: W,
          display: 'flex', flexDirection: 'column',
          top: 0, right: 0, bottom: 0,                 /* full-height drawer, flush right */
          width: isMobile ? '100%' : 420,
          borderRadius: 0,
          boxShadow: '-8px 0 40px rgba(0,0,0,.18)',
        }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${BD}`, flexShrink: 0,
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: T1, margin: 0 }}>Document details</h2>
          <button onClick={onClose} aria-label="Close"
            style={{
              width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: W, border: `1px solid ${BD}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <I k="x" s={14} c={T2} sw={2} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Title block */}
          <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${BD}` }}>
            <span style={{
              display: 'inline-block', fontSize: 11, fontWeight: 700, letterSpacing: 0.4,
              color: tint.c, background: tint.b, padding: '3px 9px', borderRadius: 6, marginBottom: 10,
            }}>{doc.fileType}</span>
            <h3 style={{ fontSize: 17, fontWeight: 600, color: T1, margin: '0 0 6px', lineHeight: 1.4 }}>{doc.title}</h3>
            <p style={{ fontSize: 13, color: T2, margin: 0 }}>{doc.size} · Updated {doc.updated}</p>
          </div>

          {/* Preview */}
          <div style={{ padding: '24px 24px 28px', textAlign: 'center', borderBottom: `1px solid ${BD}` }}>
            {previewUrl && (isImage || isPdf) ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                {isPdf ? (
                  <iframe src={previewUrl} title={doc.title} style={{ width: '100%', height: 280, border: '1px solid #E5E7EB', borderRadius: 10 }} />
                ) : (
                  <img src={previewUrl} alt={doc.title} style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 10, border: '1px solid #E5E7EB' }} />
                )}
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
                  <I k="file" s={58} c="#C9CDD4" sw={1.1} />
                </div>
                <p style={{ fontSize: 13, color: T2, margin: '0 0 14px' }}>Preview not available — download to open</p>
              </>
            )}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 12 }}>
              <Btn variant="ghost" onClick={() => onDownload(doc)}>
                <I k="download" s={16} c={T1} />Download
              </Btn>
              {previewUrl && (
                <Btn onClick={() => window.open(previewUrl, '_blank', 'noopener,noreferrer')}>
                  Open file
                </Btn>
              )}
            </div>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: T1, fontWeight: 500, marginBottom: 6 }}>Target Name</div>
              <div style={{ ...cell, fontSize: 14, color: T2 }}>{doc.targetName}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 13, color: T1, fontWeight: 500, marginBottom: 6 }}>Type</div>
                <div style={{ ...cell, fontSize: 14, color: T2 }}>{doc.type}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: T1, fontWeight: 500, marginBottom: 6 }}>Target Type</div>
                <div style={{ ...cell, fontSize: 14, color: T2 }}>{doc.targetType || '—'}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, color: T1, fontWeight: 500, marginBottom: 6 }}>Priority</div>
                <div style={{ ...cell, fontSize: 14, color: T2 }}>{doc.priority || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, color: T1, fontWeight: 500, marginBottom: 6 }}>Target Deadline</div>
                <div style={{ ...cell, fontSize: 14, color: T2 }}>{doc.deadline || '—'}</div>
              </div>
            </div>

            <div style={{ fontSize: 15, color: T1, fontWeight: 600, marginBottom: 8 }}>Description</div>
            <p style={{ fontSize: 14, color: T2, lineHeight: 1.7, margin: 0 }}>{doc.description}</p>
          </div>
        </div>

        {/* Footer — Cancel · Edit · Delete */}
          <div style={{
          padding: '16px 24px', borderTop: `1px solid ${BD}`, background: W,
          display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          {canEdit && (
            <Btn variant="ghost" onClick={() => onEdit(doc)}>
              <I k="edit" s={16} c={T1} />Edit
            </Btn>
          )}
          {canDelete && (
            <Btn onClick={() => onDelete(doc)}>
              <I k="trash" s={16} c={W} />Delete
            </Btn>
          )}
        </div>
      </div>
    </>
  );
}

/* ═══ DELETE CONFIRM ═══ */
function DeleteModal({ doc, onClose, onConfirm, isMobile, offset }) {
  const [busy, setBusy] = useState(false);
  const go = () => { setBusy(true); setTimeout(() => onConfirm(doc), 700); };
  return (
    <>
      <Overlay onClick={onClose} offset={offset} z={400} dark={0.5} />
      <div role="dialog" aria-modal="true"
        style={{
          position: 'fixed', top: '50%', left: `calc(${offset}px + (100% - ${offset}px) / 2)`,
          transform: 'translate(-50%,-50%)',
          width: isMobile ? '90vw' : 420, background: W, borderRadius: 16, zIndex: 401,
          boxShadow: '0 24px 70px rgba(0,0,0,.28)', padding: '28px 32px 30px', textAlign: 'center',
        }}>
        <button onClick={onClose} aria-label="Close"
          style={{
            position: 'absolute', top: 14, right: 16, width: 26, height: 26, borderRadius: '50%',
            background: '#9CA3AF', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
          <I k="x" s={13} c={W} sw={2.6} />
        </button>

        <div style={{
          width: 62, height: 62, borderRadius: '50%', background: RED_BG, border: `1px solid ${RED_BD}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto 18px',
        }}>
          <I k="trash" s={26} c={RED} />
        </div>

        <h3 style={{ fontSize: 19, fontWeight: 600, color: T1, margin: '0 0 10px' }}>Delete document?</h3>
        <p style={{ fontSize: 14, color: T2, lineHeight: 1.6, margin: '0 0 24px' }}>
          Permanently delete <strong style={{ color: T1 }}>“{doc.title}”</strong>? This cannot be undone
        </p>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Btn variant="ghost" full onClick={onClose}>Keep it</Btn></div>
          <div style={{ flex: 1 }}><Btn variant="danger" full onClick={go} disabled={busy}>{busy ? 'Deleting…' : 'Yes, delete'}</Btn></div>
        </div>
      </div>
    </>
  );
}

/* ═══ TOAST ═══ */
function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [msg, onDone]);
  return (
    <div role="status" style={{
      position: 'fixed', top: 20, right: 20, zIndex: 500, maxWidth: '90vw',
      background: GRN_BG, border: `1px solid ${GRN_BD}`, color: '#14532D',
      borderRadius: 10, padding: '12px 18px', fontSize: 14, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 30px rgba(0,0,0,.12)',
    }}>
      <I k="check" s={16} c={GRN} sw={2.6} />{msg}
    </div>
  );
}

/* ═══ EMPTY STATE ═══ */
function EmptyState() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 0.7;
    }
  }, []);

  return (
    <div style={{ padding: '70px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <img
          src={dueDiligenceGif}
          alt="Due diligence illustration"
          style={{ width: 220, maxWidth: '100%', borderRadius: 16, objectFit: 'contain' }}
        />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 500, color: T1, margin: '0 0 10px' }}>No due diligences yet</h3>
      <p style={{ fontSize: 14, color: T3, lineHeight: 1.6, margin: '0 auto', maxWidth: 420 }}>
        Create a diligence entry to track an investment, company, or fund with structure and momentum.
      </p>
    </div>
  );
}

/* ═══ GRID CARD ═══ */
function DocCard({ doc, onOpen, onApprove, canApprove }) {
  const statusLabel = doc.status === 'approved'
    ? 'Approved'
    : doc.status === 'rejected'
      ? 'Rejected'
      : doc.status === 'review'
        ? 'In review'
        : doc.status === 'in_progress'
          ? 'In progress'
          : 'Draft';
  const statusTone = doc.status === 'approved'
    ? { bg: '#DCFCE7', color: '#15803D' }
    : doc.status === 'rejected'
      ? { bg: '#FEE2E2', color: '#991B1B' }
      : { bg: '#F5EDFC', color: PL };

  const [pdfThumbnail, setPdfThumbnail] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fileUrl = doc.fileUrl;
    const isPdf = /\.pdf$/i.test(fileUrl || '') || (doc.mimeType || doc.fileType || '').toLowerCase() === 'application/pdf';

    if (!isPdf || !fileUrl) {
      setPdfThumbnail('');
      return () => { cancelled = true; };
    }

    const renderPdfThumbnail = async () => {
      try {
        const pdf = await pdfjsLib.getDocument(fileUrl).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.2 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({ canvasContext: context, viewport }).promise;
        if (!cancelled) {
          setPdfThumbnail(canvas.toDataURL('image/png'));
        }
      } catch (error) {
        console.warn('Failed to render PDF thumbnail:', error);
        if (!cancelled) setPdfThumbnail('');
      }
    };

    renderPdfThumbnail();
    return () => { cancelled = true; };
  }, [doc.fileUrl, doc.fileType, doc.mimeType]);

  const getFileExtension = () => {
    const source = doc.fileName || doc.fileUrl || doc.fileType || '';
    const token = source.split(/[?#]/)[0];
    const ext = token.split('.').pop()?.toLowerCase();
    return ext || '';
  };

  const renderPreview = () => {
    const ext = getFileExtension();
    const mime = (doc.mimeType || doc.fileType || '').toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic', 'heif'].includes(ext)
      || mime.startsWith('image/');
    const isPdf = ext === 'pdf' || mime === 'application/pdf';
    const isOffice = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'csv', 'txt', 'rtf'].includes(ext)
      || ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'text/plain', 'application/rtf', 'text/csv'].includes(mime);

    if (!doc.fileUrl) {
      return (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#F3F4F6', flexDirection: 'column', gap: 8,
        }}>
          <I k="file" s={48} c="#D1D5DB" />
          <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>No preview</span>
        </div>
      );
    }

    if (isImage) {
      return <img src={doc.fileUrl} alt={doc.fileName || doc.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }

    if (isPdf && pdfThumbnail) {
      return <img src={pdfThumbnail} alt={doc.fileName || doc.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
    }

    if (isPdf) {
      return (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #FEE2E2 0%, #F9F5FF 100%)', flexDirection: 'column', gap: 8,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, background: '#FCA5A5', color: '#7F1D1D',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17, fontWeight: 700,
          }}>PDF</div>
          <span style={{ fontSize: 11, color: '#7F1D1D', fontWeight: 700 }}>PDF preview</span>
        </div>
      );
    }

    if (isOffice) {
      const label = (ext || (doc.fileType || 'FILE')).toUpperCase();
      return (
        <div style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #DBEAFE 0%, #E0E7FF 100%)', flexDirection: 'column', gap: 8,
        }}>
          <div style={{
            width: 62, height: 62, borderRadius: 18, background: 'rgba(255,255,255,0.7)', color: '#1D4ED8',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700,
          }}>{label.slice(0, 4)}</div>
          <span style={{ fontSize: 11, color: '#1E3A8A', fontWeight: 700 }}>{doc.fileType || 'Document'}</span>
        </div>
      );
    }

    return (
      <div style={{
        width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'linear-gradient(135deg, #F5EDFC 0%, #F9F5FF 100%)', flexDirection: 'column', gap: 8,
      }}>
        <I k="file" s={48} c={PL} />
        <span style={{ fontSize: 11, color: PL, fontWeight: 600, textAlign: 'center', padding: '0 8px' }}>
          {doc.fileType || 'Document'}
        </span>
      </div>
    );
  };

  return (
    <div onClick={() => onOpen(doc)}
      style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden', cursor: 'pointer' }}>
      <div style={{ position: 'relative', height: 160, background: '#B7B7B7', overflow: 'hidden' }}>
        {renderPreview()}
        <span style={{
          position: 'absolute', top: 12, right: 12, background: W, borderRadius: 6,
          padding: '4px 10px', fontSize: 11, fontWeight: 600, color: T1,
        }}>{doc.fileType}</span>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <div style={{ fontSize: 12, color: PL, fontWeight: 500 }}>{doc.category}</div>
          <span style={{ background: statusTone.bg, color: statusTone.color, borderRadius: 999, padding: '4px 10px', fontSize: 11, fontWeight: 600 }}>
            {statusLabel}
          </span>
        </div>
        <div style={{ fontSize: 15, fontWeight: 600, color: T1, marginBottom: 6, lineHeight: 1.35 }}>{doc.title}</div>
        <div style={{ fontSize: 13, color: T3 }}>{doc.size} · Updated {doc.updated}</div>

        {canApprove && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onApprove(doc, event);
              }}
              style={{
                background: '#5B21B6',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══ MAIN ═══ */
export default function DueDiligenceVault() {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [docs, setDocs] = useState([]);
  const [loadError, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const [view, setView] = useState('grid');
  const [page, setPage] = useState(1);
  const [topSearch, setTopSearch] = useState('');

  const [query, setQuery] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fPriority, setFPrior] = useState('');
  const [fType, setFType] = useState('');

  const [creating, setCreating] = useState(false);
  const perms = useDynamicPerms();
  const [editDoc, setEditDoc] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  const overlayOffset = 0;

  const formatBytes = (bytes) => {
    if (!bytes) return '—';
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${bytes} B`;
  };

  const formatRelativeTime = (value) => {
    if (!value) return 'just now';
    const date = new Date(value);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const unwrapApiData = (response) => {
    const payload = response?.data;
    if (payload && typeof payload === 'object' && 'data' in payload && payload.data !== undefined) {
      return payload.data;
    }
    return payload ?? response;
  };

  const normalizeDoc = (item) => {
    const document = item?.documents?.[0] || item?.raw?.documents?.[0] || null;
    return {
      id: item?.id,
      title: item?.title || 'Untitled diligence',
      targetName: item?.targetName || '—',
      type: item?.type || 'Investment',
      targetType: item?.targetType || 'Company',
      priority: item?.priority || 'Low',
      deadline: item?.targetDeadline ? new Date(item.targetDeadline).toLocaleDateString('en-GB') : '',
      description: item?.description || '',
      fileName: document?.fileName || item?.title || 'document',
      fileType: (document?.fileType || 'pdf').toUpperCase(),
      size: document?.fileSize ? formatBytes(document.fileSize) : '—',
      updated: item?.updatedAt ? formatRelativeTime(item.updatedAt) : 'just now',
      category: item?.type || 'Investment',
      status: item?.status,
      fileUrl: document?.fileUrl || '',
      raw: item,
    };
  };

  const loadDocs = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await dueDiligenceAPI.list({
        page: 1,
        limit: 100,
        ...(query || topSearch ? { search: query || topSearch } : {}),
        ...(fStatus ? { status: fStatus.toLowerCase().replace(/\s+/g, '_') } : {}),
        ...(fPriority ? { priority: fPriority.toLowerCase() } : {}),
        ...(fType ? { type: fType.toLowerCase() } : {}),
      });
      const payload = unwrapApiData(response);
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
      const normalizedDocs = items.map(normalizeDoc);
      setDocs(normalizedDocs);
      setPage(1);
    } catch (err) {
      console.error('Failed to load due diligence records:', err);
      setDocs([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDocs();
  }, [query, fStatus, fPriority, fType, topSearch]);

  /* Retry → loads the documents */
  const retry = () => {
    void loadDocs();
  };

  const handleApproveFromList = async (doc, event) => {
    if (event) event.stopPropagation();
    if (!perms.canDelete) return;

    try {
      const response = await dueDiligenceAPI.createApproval(doc.id, {
        approverRole: 'admin',
        approvalNotes: 'Approved from due diligence vault',
      });
      const approval = unwrapApiData(response);
      const approvalId = approval?.id || null;

      if (approvalId) {
        await dueDiligenceAPI.approveOrReject(doc.id, approvalId, {
          status: 'approved',
          approvalNotes: 'Approved from due diligence vault',
        });
      }

      const approvedProject = {
        ...(doc?.raw || {}),
        status: 'approved',
        targetMetadata: {
          ...(doc?.raw?.targetMetadata || {}),
          tags: [...new Set([...(doc?.raw?.targetMetadata?.tags || []), 'Approved'])],
        },
      };

      window.dispatchEvent(new CustomEvent('tribes:notifications-update', {
        detail: { type: 'due-diligence-updated', id: doc.id, action: 'approval-decided', decision: 'approved' },
      }));
      window.dispatchEvent(new CustomEvent('tribes:project-pipeline-add', { detail: { project: approvedProject } }));
      window.dispatchEvent(new CustomEvent('tribes:due-diligence-approved', { detail: { id: doc.id } }));
      setToast('Case approved and moved to project pipeline');
      await loadDocs();
    } catch (err) {
      console.error('Failed to approve due diligence case:', err);
      setToast('We could not approve this case right now.');
    }
  };

  /* CREATE + EDIT */
  const save = async (form, setProgress = () => {}) => {
    try {
      if (editDoc) {
        const payload = {
          title: form.title,
          description: form.description,
          priority: String(form.priority || 'low').toLowerCase(),
          targetDeadline: toDeadlineISOString(form.deadline),
        };

        await dueDiligenceAPI.update(editDoc.id, payload);

        if (form.file) {
          setProgress('Uploading document…');
          try {
            const uploadData = new FormData();
            uploadData.append('file', form.file);
            uploadData.append('fileName', form.file.name);
            await dueDiligenceAPI.uploadDocument(editDoc.id, uploadData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
          } catch (uploadErr) {
            console.error('Failed to upload replacement document for due diligence:', uploadErr);
            setToast('Changes saved, but the new document upload failed. Please retry the upload.');
            await loadDocs();
            return;
          }
        }

        setDetail(null);
        setEditDoc(null);
        setToast('Changes saved');
      } else {
        const payload = {
          title: form.title,
          description: form.description,
          type: String(form.type || 'investment').toLowerCase(),
          targetName: form.targetName,
          targetType: form.targetType || 'company',
          priority: String(form.priority || 'medium').toLowerCase(),
          targetDeadline: toDeadlineISOString(form.deadline),
        };

        const response = await dueDiligenceAPI.create(payload);
        const createdItem = unwrapApiData(response);
        if (!createdItem || !createdItem.id) {
          throw new Error('Create response missing required fields');
        }

        let uploadError = null;
        if (form.file) {
          setProgress('Uploading document…');
          try {
            const uploadData = new FormData();
            uploadData.append('file', form.file);
            uploadData.append('fileName', form.file.name);
            uploadData.append('category', form.category || 'general');
            await dueDiligenceAPI.uploadDocument(createdItem.id, uploadData);
          } catch (uploadErr) {
            uploadError = uploadErr;
            console.error('Document upload failed after creating due diligence:', uploadErr);
            setToast(getRequestErrorMessage(uploadErr, 'Document upload failed. Please retry the upload.'));
          }
        }

        setCreating(false);
        setPage(1);

        if (uploadError) {
          setToast('Due diligence case created, but the document upload failed. Please upload the file again from the case details.');
        } else {
          setToast('Due diligence created');
        }

        try {
          window.dispatchEvent(new CustomEvent('tribes:notifications-update', {
            detail: { type: 'due-diligence-created', id: createdItem?.id },
          }));
          window.dispatchEvent(new CustomEvent('tribes:due-diligence-created', {
            detail: { id: createdItem?.id },
          }));
        } catch (eventError) {
          console.warn('Failed to dispatch notification refresh event', eventError);
        }
      }
      await loadDocs();
    } catch (err) {
      console.error('Failed to save due diligence record:', err);
      const errorMsg = getRequestErrorMessage(err, 'We could not save this diligence case right now.');
      setToast(errorMsg);
    }
  };

  /* DELETE */
  const remove = async (doc) => {
    try {
      await dueDiligenceAPI.delete(doc.id);
      setToDelete(null);
      setDetail(null);
      await loadDocs();
      setToast('Document deleted');
    } catch (err) {
      console.error('Failed to delete due diligence record:', err);
      setToast('We could not delete this diligence case right now.');
    }
  };

  /* DOWNLOAD — emits the record as a real file */
  const download = doc => {
    if (doc.fileUrl) {
      const a = document.createElement('a');
      a.href = doc.fileUrl;
      a.target = '_blank';
      a.rel = 'noreferrer';
      a.download = doc.fileName || doc.title;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setToast('Download started');
      return;
    }

    const body = [
      `Title:           ${doc.title}`,
      `Target name:     ${doc.targetName}`,
      `Type:            ${doc.type}`,
      `Target type:     ${doc.targetType || '—'}`,
      `Priority:        ${doc.priority || '—'}`,
      `Target deadline: ${doc.deadline || '—'}`,
      `File:            ${doc.fileType} · ${doc.size}`,
      '',
      'Description',
      doc.description || '',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.title.replace(/[^\w\s-]/g, '').trim()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setToast('Download started');
  };

  /* FILTER + PAGINATE */
  const filtered = useMemo(() => {
    const q = (query || topSearch).trim().toLowerCase();
    return docs.filter(d => {
      if (q && ![d.title, d.targetName, d.description].join(' ').toLowerCase().includes(q)) return false;
      if (fPriority && d.priority !== fPriority) return false;
      if (fType && d.type !== fType) return false;
      if (fStatus && d.status !== fStatus.toLowerCase().replace(/\s+/g, '_')) return false;
      return true;
    });
  }, [docs, query, topSearch, fPriority, fType, fStatus]);

  const pages  = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePg = Math.min(page, pages);
  const slice  = filtered.slice((safePg - 1) * PER_PAGE, safePg * PER_PAGE);

  const openWork = docs.length;
  const nextDue  = docs.map(d => d.deadline).filter(Boolean).sort()[0] || '—';

  const pad = isMobile ? '14px 12px 32px' : '24px 28px 44px';

  return (
    <div style={{
      minHeight: '100vh', background: PAGE,
      fontFamily: "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: T1,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        button,input,select,textarea{font-family:inherit;}
        input::placeholder,textarea::placeholder{color:${T3};}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-thumb{background:#D3D5DA;border-radius:10px;}
        :focus-visible{outline:2px solid ${PL};outline-offset:2px;}
      `}</style>

      <main style={{ flex: 1, padding: pad }}>
          <div style={{
            background: PANEL, border: `1px solid ${PANEL_BD}`,
            borderRadius: isMobile ? 14 : 20,
            padding: isMobile ? '20px 16px 30px' : '32px 32px 42px',
          }}>

          {/* Header */}
          <div style={{
            display: 'flex', flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'stretch' : 'flex-start',
            justifyContent: 'space-between', gap: 16, marginBottom: 26,
          }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, margin: '0 0 8px', letterSpacing: -0.5 }}>
                Due Diligence Vault
              </h1>
              <p style={{ fontSize: 15, color: T2, margin: 0 }}>
                Track diligence work, approvals, and follow-ups in one place.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
                <button onClick={() => setCreating(true)}
                  style={{
                    flex: isMobile ? 1 : 'none', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8, padding: '0 24px', height: 44,
                    background: P, color: W, border: 'none', borderRadius: 8,
                    fontSize: 15, fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap',
                  }}>
                  <I k="plus" s={17} c={W} sw={2.2} />New Due Diligence
                </button>
            </div>
          </div>

          {/* Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)',
            gap: isMobile ? 12 : 18, marginBottom: 22,
          }}>
            {[
              ['OPEN WORK', String(openWork)],
              ['IN REVIEW', '0'],
              ['COMPLETED', '0'],
              ['NEXT DEADLINE', nextDue],
            ].map(([label, val]) => (
              <div key={label} style={{
                background: W, border: `1px solid ${BD}`, borderRadius: 12,
                padding: isMobile ? '16px' : '20px 24px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: 0.8, color: T2, marginBottom: 8 }}>{label}</div>
                <div style={{
                  fontSize: label === 'NEXT DEADLINE' && val !== '—' ? 20 : 30,
                  fontWeight: 600, color: T1, lineHeight: 1.1,
                }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Error banner */}
          {loadError && (
            <div style={{
              background: AMB_BG, border: `1px solid ${AMB_BD}`, borderRadius: 10,
              padding: '16px 20px', marginBottom: 22, color: AMB_TX, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 14, flexWrap: 'wrap',
            }}>
              <span>We could not load your diligence cases right now. Please refresh or try again shortly.</span>
              <button onClick={retry} disabled={loading}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7, background: W,
                  border: `1px solid ${AMB_BD}`, color: AMB_TX, borderRadius: 8,
                  padding: '8px 14px', fontSize: 14, fontWeight: 500,
                  cursor: loading ? 'wait' : 'pointer', whiteSpace: 'nowrap',
                }}>
                <I k="refresh" s={15} c={AMB_TX} />{loading ? 'Retrying…' : 'Try again'}
              </button>
            </div>
          )}

          {/* Filters */}
          <div style={{
            background: W, border: `1px solid ${BD}`, borderRadius: 12,
            padding: isMobile ? 18 : 24, marginBottom: 24,
            display: 'grid', gap: isMobile ? 14 : 20,
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4,1fr)',
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 15, color: T1, marginBottom: 10 }}>Search due diligence</label>
              <TextInput value={query} onChange={v => { setQuery(v); setPage(1); }} placeholder="Search by title, target, or description…" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, color: T1, marginBottom: 10 }}>Filter by status</label>
              <Select value={fStatus} onChange={v => { setFStatus(v); setPage(1); }} options={STATUSES} placeholder="All Statuses" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, color: T1, marginBottom: 10 }}>Filter by priority</label>
              <Select value={fPriority} onChange={v => { setFPrior(v); setPage(1); }} options={PRIORITIES} placeholder="All Priorities" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 15, color: T1, marginBottom: 10 }}>Filter by type</label>
              <Select value={fType} onChange={v => { setFType(v); setPage(1); }} options={TYPES} placeholder="All Types" />
            </div>
          </div>

          {/* Results */}
          {docs.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ fontSize: 17, fontWeight: 600, color: T1 }}>
                  All documents <span style={{ color: T3, fontWeight: 400 }}>({filtered.length})</span>
                </span>
                <div style={{ display: 'flex', background: W, border: `1px solid ${BD}`, borderRadius: 8, overflow: 'hidden' }}>
                  {['grid', 'list'].map(v => (
                    <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
                      style={{
                        padding: '9px 12px', border: 'none', cursor: 'pointer',
                        display: 'flex', background: view === v ? PF : W,
                      }}>
                      <I k={v} s={18} c={view === v ? PL : T3} />
                    </button>
                  ))}
                </div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, padding: '60px 20px', textAlign: 'center' }}>
                  <p style={{ color: T2, margin: 0, fontSize: 15 }}>No documents match your filters.</p>
                </div>
              ) : view === 'grid' ? (
                <div style={{
                  display: 'grid', gap: 20,
                  gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)',
                }}>
                  {slice.map(d => <DocCard key={d.id} doc={d} onOpen={setDetail} onApprove={handleApproveFromList} canApprove={Boolean(perms.canDelete)} />)}
                </div>
              ) : isMobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {slice.map(d => (
                    <div key={d.id} onClick={() => setDetail(d)}
                      style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, padding: 16, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                        <I k="file" s={20} c={T3} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, fontWeight: 600, color: T1 }}>{d.title}</div>
                          <div style={{ fontSize: 13, color: T3 }}>{d.size}</div>
                        </div>
                        {perms.canEdit && (
                          <button onClick={e => { e.stopPropagation(); setEditDoc(d); }} aria-label="Edit"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <I k="edit" s={17} c={PL} />
                          </button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, color: T2, alignItems: 'center' }}>
                        <span>Target: {d.targetName}</span>
                        <span>Type: {d.type}</span>
                        <span>Deadline: {d.deadline || '—'}</span>
                        <span><PriorityPill level={d.priority || '—'} /></span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}>
                      <thead>
                        <tr style={{ background: BG }}>
                          {['Title', 'Target Name', 'Type', 'Target Type', 'Priority', 'Deadline', ''].map((h, i) => (
                            <th key={i} style={{
                              textAlign: 'left', padding: '16px 20px', fontSize: 14,
                              fontWeight: 600, color: T1, borderBottom: `1px solid ${BD}`,
                            }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {slice.map(d => (
                          <tr key={d.id} onClick={() => setDetail(d)}
                            style={{ cursor: 'pointer', borderBottom: `1px solid ${BD}` }}>
                            <td style={{ padding: '16px 20px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <I k="file" s={20} c={T3} />
                                <div>
                                  <div style={{ fontSize: 15, fontWeight: 600, color: T1 }}>{d.title}</div>
                                  <div style={{ fontSize: 13, color: T3 }}>{d.size}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: T2 }}>{d.targetName}</td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: T2 }}>{d.type}</td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: T2 }}>{d.targetType || '—'}</td>
                            <td style={{ padding: '16px 20px' }}><PriorityPill level={d.priority || '—'} /></td>
                            <td style={{ padding: '16px 20px', fontSize: 14, color: T2, whiteSpace: 'nowrap' }}>{d.deadline || '—'}</td>
                            <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                              {perms.canEdit && (
                                <button onClick={e => { e.stopPropagation(); setEditDoc(d); }} aria-label={`Edit ${d.title}`}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                  <I k="edit" s={18} c={PL} />
                                </button>
                              )}
                              {perms.canDelete && (
                                <button onClick={(e) => { e.stopPropagation(); void handleApproveFromList(d, e); }} aria-label={`Approve ${d.title}`}
                                  style={{ background: '#5B21B6', border: 'none', borderRadius: 6, cursor: 'pointer', padding: '6px 10px', color: '#fff', marginLeft: 8, fontWeight: 700, fontSize: 12 }}>
                                  Approve
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', background: BG, gap: 12, flexWrap: 'wrap',
                  }}>
                    <span style={{ fontSize: 14, color: T2 }}>
                      Showing {(safePg - 1) * PER_PAGE + 1}-{Math.min(safePg * PER_PAGE, filtered.length)} of {filtered.length}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePg === 1} aria-label="Previous page"
                        style={{ background: 'none', border: 'none', padding: 6, opacity: safePg === 1 ? 0.4 : 1, cursor: safePg === 1 ? 'not-allowed' : 'pointer' }}>
                        <I k="chevL" s={16} c={T2} />
                      </button>
                      {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
                        <button key={n} onClick={() => setPage(n)}
                          style={{
                            minWidth: 32, height: 32, borderRadius: 6, border: 'none', cursor: 'pointer',
                            fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
                            background: n === safePg ? '#1E2532' : 'transparent',
                            color: n === safePg ? W : T2,
                          }}>{n}</button>
                      ))}
                      <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={safePg === pages} aria-label="Next page"
                        style={{ background: 'none', border: 'none', padding: 6, opacity: safePg === pages ? 0.4 : 1, cursor: safePg === pages ? 'not-allowed' : 'pointer' }}>
                        <I k="chevR" s={16} c={T2} />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </main>

      {/* Overlays */}
      {creating && <DiligencePanel onClose={() => setCreating(false)} onSave={save} isMobile={isMobile} offset={overlayOffset} />}
      {editDoc  && <DiligencePanel initial={editDoc} onClose={() => setEditDoc(null)} onSave={save} isMobile={isMobile} offset={overlayOffset} />}
      {detail && !editDoc && !toDelete && (
        <DetailPanel doc={detail} perms={perms} onClose={() => setDetail(null)}
          onEdit={setEditDoc} onDelete={setToDelete} onDownload={download}
          isMobile={isMobile} offset={overlayOffset} />
      )}
      {toDelete && <DeleteModal doc={toDelete} onClose={() => setToDelete(null)} onConfirm={remove} isMobile={isMobile} offset={overlayOffset} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
