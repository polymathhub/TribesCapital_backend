import React, { useState, useEffect, useMemo } from "react";
import { deriveProjectSignals } from '../../utils/dashboardMetrics';

/* ═══════════════════════════════════════════════════════════
   TRIBES CAPITAL — PROJECT PIPELINE
   Interactive · functional · responsive (mobile / tablet / desktop)

   Built around the same interaction model as the Due Diligence Vault so
   the two experiences feel coherent and connected.
═══════════════════════════════════════════════════════════ */

/* ─── TOKENS (aligned to the app theme) ─── */
const P   = '#6700A6';
const PL  = '#8B3FD6';
const PF  = '#F5EDFC';
const PB  = '#E9D5F7';

const T1  = '#1F1F24';
const T2  = '#6B6F76';
const T3  = '#9CA0A8';

const BD  = '#E7E8EC';
const BG  = '#F7F7F8';
const W   = '#FFFFFF';

const RED   = '#DC2626', RED_BG = '#FEF2F2', RED_BD = '#FECACA';
const GRN   = '#16A34A', GRN_BG = '#F0FDF4', GRN_BD = '#BBF7D0';
const AMB_T = '#B45309', AMB_BG = '#FEF3C7';
const TEAL  = '#0369A1', TEAL_BG = '#E0F2FE';

const PAGE     = 'linear-gradient(160deg, #EDE7F8 0%, #F5F2FB 42%, #FCFBFE 100%)';
const PANEL    = '#FCFBFE';
const PANEL_BD = '#EFEAF8';

const SIDEBAR_W = 260;
const PERMS = { canCreate: true, canEdit: true, canDelete: true };

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
  pipeline:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="12" y1="12" x2="12" y2="16"/></>,
  bell:    <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
  help:    <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
  logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  search:  <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  chevD:   <polyline points="6,9 12,15 18,9"/>,
  edit:    <><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4z"/></>,
  trash:   <><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></>,
  download:<><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  inbox:   <><polyline points="22,12 16,12 14,15 10,15 8,12 2,12"/><path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  list:    <><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></>,
  menu:    <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
  check:   <polyline points="20,6 9,17 4,12"/>,
  pin:     <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
  eye:     <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
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

/* ─── DOMAIN ─── */
const STAGES = ['Sourcing', 'Screening', 'Due Diligence', 'Term Sheet', 'Closing', 'Portfolio'];
const TYPES  = ['Mini-grid', 'Solar PV', 'Wind', 'Hydro', 'Battery Storage', 'C&I Solar'];
const COUNTRIES = ['Nigeria', 'Ghana', 'Kenya', 'Togo', 'Senegal', 'Uganda', "Côte d'Ivoire"];

const SEED = [
  { id:1, name:'Lomé Port Hybrid Microgrid', type:'Mini-grid', stage:'Sourcing', country:'Togo', city:'Lomé',
    capacity:4.0, value:4500000, irr:17, sponsor:'Togo Energy Partners', progress:5,
    tags:['Microgrid','Port'], owner:'RA', updated:'recently',
    description:'Hybrid solar-plus-storage microgrid serving port operations and adjacent light industry.' },
  { id:2, name:'Accra Industrial Rooftop', type:'C&I Solar', stage:'Screening', country:'Ghana', city:'Accra',
    capacity:2.4, value:1900000, irr:19, sponsor:'Gold Coast Power', progress:22,
    tags:['C&I','Rooftop'], owner:'KA', updated:'2 days ago',
    description:'Rooftop solar portfolio across four manufacturing sites with a single anchor offtaker.' },
  { id:3, name:'Ikeja Cluster Mini-grid', type:'Mini-grid', stage:'Screening', country:'Nigeria', city:'Lagos, Ikeja',
    capacity:3.1, value:2800000, irr:18, sponsor:'Greenfield Energy', progress:30,
    tags:['Microgrid','Urban'], owner:'NF', updated:'4 days ago',
    description:'Cluster of urban mini-grids serving SME workshops currently running on diesel.' },
  { id:4, name:'Rift Valley Wind Phase I', type:'Wind', stage:'Due Diligence', country:'Kenya', city:'Nakuru',
    capacity:24.0, value:31000000, irr:15.4, sponsor:'Rift Renewables', progress:58,
    tags:['Wind','Utility'], owner:'BO', updated:'1 day ago',
    description:'First phase of a utility-scale wind facility in the Rift Valley corridor.' },
  { id:5, name:'Kumasi Hospital Solar + BESS', type:'Battery Storage', stage:'Due Diligence', country:'Ghana', city:'Kumasi',
    capacity:1.8, value:2200000, irr:20.1, sponsor:'Ashanti Health Trust', progress:64,
    tags:['Healthcare','BESS'], owner:'RA', updated:'3 days ago',
    description:'Solar and battery installation removing diesel dependency at a regional teaching hospital.' },
  { id:6, name:'Dakar Cold Chain Solar', type:'Solar PV', stage:'Term Sheet', country:'Senegal', city:'Dakar',
    capacity:5.5, value:6100000, irr:16.8, sponsor:'Sahel Infra', progress:78,
    tags:['Cold chain','Agri'], owner:'KA', updated:'6 hours ago',
    description:'Solar generation for cold storage facilities across the Dakar agricultural corridor.' },
  { id:7, name:'Abidjan Grid Battery', type:'Battery Storage', stage:'Closing', country:"Côte d'Ivoire", city:'Abidjan',
    capacity:20.0, value:18500000, irr:16.4, sponsor:'CIE Partners', progress:92,
    tags:['Grid','BESS'], owner:'BO', updated:'yesterday',
    description:'Grid-scale battery supporting frequency response and evening peak on the CIE network.' },
  { id:8, name:'Jinja Run-of-River Rehab', type:'Hydro', stage:'Portfolio', country:'Uganda', city:'Jinja',
    capacity:8.0, value:6200000, irr:19.1, sponsor:'Nile Hydro Co', progress:100,
    tags:['Hydro','Operating'], owner:'NF', updated:'1 month ago',
    description:'Rehabilitated run-of-river facility, commissioned and generating 36 GWh annually.' },
];

const money = n => {
  if (!n && n !== 0) return '—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + ' B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + ' M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + ' K';
  return '$' + n;
};

const PIPELINE_STORAGE_KEY = 'tribes-pipeline-projects';
const DILIGENCE_STORAGE_KEY = 'tribes-diligence-docs';

function readStoredProjects() {
  if (typeof window === 'undefined') return SEED;
  try {
    const storedValue = window.localStorage.getItem(PIPELINE_STORAGE_KEY);
    if (!storedValue) return SEED;
    const parsed = JSON.parse(storedValue);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : SEED;
  } catch {
    return SEED;
  }
}

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
    <input type={type} value={value} placeholder={placeholder}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setF(true)} onBlur={() => setF(false)}
      style={{ ...inputStyle,
        borderColor: invalid ? RED : f ? PL : BD,
        boxShadow: f && !invalid ? `0 0 0 3px ${PF}` : 'none' }} />
  );
}

function Select({ value, onChange, options, placeholder, invalid }) {
  const [f, setF] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <select value={value} onChange={e => onChange(e.target.value)}
        onFocus={() => setF(true)} onBlur={() => setF(false)}
        style={{ ...inputStyle, appearance: 'none', cursor: 'pointer', paddingRight: 38,
          color: value ? T1 : T3,
          borderColor: invalid ? RED : f ? PL : BD,
          boxShadow: f && !invalid ? `0 0 0 3px ${PF}` : 'none' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
        <I k="chevD" s={15} c={T3} />
      </span>
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
      style={{ ...v, padding: '11px 22px', borderRadius: 8, fontSize: 14, fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        whiteSpace: 'nowrap', width: full ? '100%' : 'auto', opacity: disabled ? 0.55 : 1 }}>
      {children}
    </button>
  );
}

function Tag({ children, tone = 'purple' }) {
  const t = {
    purple: { bg: PF,      c: PL },
    green:  { bg: GRN_BG,  c: GRN },
    amber:  { bg: AMB_BG,  c: AMB_T },
    teal:   { bg: TEAL_BG, c: TEAL },
  }[tone];
  return (
    <span style={{ display: 'inline-block', background: t.bg, color: t.c,
      fontSize: 11.5, fontWeight: 500, borderRadius: 999, padding: '3px 12px', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function Overlay({ onClick, offset, z = 200, dark = 0.45 }) {
  return <div onClick={onClick} style={{ position: 'fixed', top: 0, right: 0, bottom: 0, left: offset,
    background: `rgba(30,30,35,${dark})`, zIndex: z }} />;
}

function ProjectPanel({ initial, onClose, onSave, isMobile, offset }) {
  const editing = !!initial;
  const [f, setF] = useState(() => initial
    ? { ...BLANK, ...initial,
        capacity: String(initial.capacity ?? ''), value: String(initial.value ?? ''),
        irr: String(initial.irr ?? ''), progress: String(initial.progress ?? '0'),
        tags: (initial.tags || []).join(', ') }
    : BLANK);
  const [err, setErr] = useState({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState('form');

  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setErr(e => ({ ...e, [k]: false })); };

  const validate = () => {
    const e = {};
    if (!f.name.trim())        e.name = true;
    if (!f.type)               e.type = true;
    if (!f.stage)              e.stage = true;
    if (!f.description.trim()) e.description = true;
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const preview = () => { if (validate()) setStep('preview'); };
  const submit = () => {
    if (!validate()) { setStep('form'); return; }
    setSaving(true);
    setTimeout(() => { setSaving(false); onSave(f); }, 800);
  };

  const heading = step === 'preview'
    ? (editing ? 'Review changes' : 'Review before adding')
    : (editing ? 'Edit project' : 'Add project');

  const row = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 };

  return (
    <>
      <Overlay onClick={onClose} offset={offset} />
      <div role="dialog" aria-modal="true"
        style={{ position: 'fixed', zIndex: 201, background: W,
          display: 'flex', flexDirection: 'column',
          top: 0, right: 0, bottom: 0,
          width: isMobile ? '100%' : 460,
          boxShadow: '-8px 0 40px rgba(0,0,0,.18)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, color: T1, margin: 0 }}>{heading}</h2>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
              background: W, border: `1px solid ${BD}`, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I k="x" s={14} c={T2} sw={2} />
          </button>
        </div>

        {step === 'preview' ? (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
            <div style={{ background: PF, border: `1px solid ${PB}`, borderRadius: 10,
              padding: '12px 14px', marginBottom: 20, fontSize: 13, color: '#5B2A86', lineHeight: 1.6 }}>
              Check the details below. Nothing is saved until you {editing ? 'save changes' : 'add the project'}.
            </div>
            {[
              ['Project name', f.name],
              ['Type', f.type],
              ['Pipeline stage', f.stage],
              ['Country / Region', f.country || '—'],
              ['City / Location', f.city || '—'],
              ['Capacity (MW)', f.capacity ? f.capacity + ' MW' : '—'],
              ['Deal value (USD)', f.value ? money(Number(f.value)) : '—'],
              ['IRR target (%)', f.irr ? f.irr + '%' : '—'],
              ['Lead sponsor', f.sponsor || '—'],
              ['Deal progress (%)', (f.progress || '0') + '%'],
              ['Tags', f.tags || '—'],
            ].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 16,
                padding: '12px 0', borderBottom: `1px solid ${BD}` }}>
                <span style={{ fontSize: 13, color: T2, flexShrink: 0 }}>{l}</span>
                <span style={{ fontSize: 14, color: T1, fontWeight: 500, textAlign: 'right', wordBreak: 'break-word' }}>{v}</span>
              </div>
            ))}
            <div style={{ fontSize: 13, color: T2, margin: '18px 0 6px' }}>Description</div>
            <p style={{ fontSize: 14, color: T1, lineHeight: 1.7, margin: 0,
              background: BG, borderRadius: 8, padding: '12px 14px', whiteSpace: 'pre-wrap' }}>{f.description}</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 24px' }}>
            <Field label="Project name" required>
              <TextInput value={f.name} onChange={v => set('name', v)} placeholder="Lagos Industrial Solar" invalid={err.name} />
            </Field>

            <div style={row}>
              <Field label="Project type" required>
                <Select value={f.type} onChange={v => set('type', v)} options={TYPES} placeholder="Select type" invalid={err.type} />
              </Field>
              <Field label="Pipeline stage" required>
                <Select value={f.stage} onChange={v => set('stage', v)} options={STAGES} placeholder="Select stage" invalid={err.stage} />
              </Field>
            </div>

            <div style={row}>
              <Field label="Country / Region">
                <Select value={f.country} onChange={v => set('country', v)} options={COUNTRIES} placeholder="Select country" />
              </Field>
              <Field label="City / Location">
                <TextInput value={f.city} onChange={v => set('city', v)} placeholder="Lagos, Ikeja" />
              </Field>
            </div>

            <div style={row}>
              <Field label="Capacity (MW)">
                <TextInput type="number" value={f.capacity} onChange={v => set('capacity', v)} placeholder="4.0" />
              </Field>
              <Field label="Deal value (USD)">
                <TextInput type="number" value={f.value} onChange={v => set('value', v)} placeholder="4500000" />
              </Field>
            </div>

            <div style={row}>
              <Field label="IRR target (%)">
                <TextInput type="number" value={f.irr} onChange={v => set('irr', v)} placeholder="17" />
              </Field>
              <Field label="Lead sponsor">
                <TextInput value={f.sponsor} onChange={v => set('sponsor', v)} placeholder="Greenfield Energy" />
              </Field>
            </div>

            <div style={row}>
              <Field label="Deal progress (%)">
                <TextInput type="number" value={f.progress} onChange={v => set('progress', v)} placeholder="0" />
              </Field>
              <Field label="Tags (comma-separated)">
                <TextInput value={f.tags} onChange={v => set('tags', v)} placeholder="Microgrid, Urban" />
              </Field>
            </div>

            <Field label="Description" required>
              <textarea value={f.description} onChange={e => set('description', e.target.value)}
                placeholder="What is this project and why is it in the pipeline?" rows={4}
                style={{ ...inputStyle, height: 'auto', padding: '12px 14px', resize: 'vertical',
                  lineHeight: 1.6, borderColor: err.description ? RED : BD }} />
            </Field>
          </div>
        )}

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BD}`, background: W,
          display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          {step === 'form' ? (
            <>
              <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
              <Btn variant="ghost" onClick={preview}><I k="eye" s={16} c={T1} />Preview</Btn>
              <Btn onClick={submit} disabled={saving}>
                {saving ? (editing ? 'Saving…' : 'Adding…') : (editing ? 'Save changes' : 'Add project')}
              </Btn>
            </>
          ) : (
            <>
              <Btn variant="ghost" onClick={() => setStep('form')}>Back to edit</Btn>
              <Btn onClick={submit} disabled={saving}>
                {saving ? (editing ? 'Saving…' : 'Adding…') : (editing ? 'Save changes' : 'Add project')}
              </Btn>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function DetailPanel({ p, onClose, onEdit, onDelete, onDownload, isMobile, offset }) {
  const cell = { background: BG, borderRadius: 8, padding: '12px 14px', fontSize: 14, color: T2 };
  const lbl  = { fontSize: 13, color: T1, fontWeight: 500, marginBottom: 6 };
  return (
    <>
      <Overlay onClick={onClose} offset={offset} />
      <div role="dialog" aria-modal="true"
        style={{ position: 'fixed', zIndex: 201, background: W, display: 'flex', flexDirection: 'column',
          top: 0, right: 0, bottom: 0, width: isMobile ? '100%' : 460,
          boxShadow: '-8px 0 40px rgba(0,0,0,.18)' }}>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px', borderBottom: `1px solid ${BD}`, flexShrink: 0 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0 }}>Project details</h2>
          <button onClick={onClose} aria-label="Close"
            style={{ width: 30, height: 30, borderRadius: '50%', background: W, border: `1px solid ${BD}`,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I k="x" s={14} c={T2} sw={2} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div style={{ padding: '20px 24px 18px', borderBottom: `1px solid ${BD}` }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <Tag>{p.type}</Tag><Tag tone="teal">{p.stage}</Tag>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 6px', lineHeight: 1.4 }}>{p.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: T2 }}>
              <I k="pin" s={14} c={T3} />{[p.city, p.country].filter(Boolean).join(' · ') || '—'}
            </div>
          </div>

          <div style={{ padding: '20px 24px 24px' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={lbl}>Deal progress</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: P }}>{p.progress}%</span>
              </div>
              <div style={{ height: 8, background: BG, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: 8, width: `${p.progress}%`, background: p.progress === 100 ? GRN : P, borderRadius: 4 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><div style={lbl}>Capacity</div><div style={cell}>{p.capacity ? p.capacity + ' MW' : '—'}</div></div>
              <div><div style={lbl}>Deal value</div><div style={cell}>{money(p.value)}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><div style={lbl}>IRR target</div><div style={cell}>{p.irr ? p.irr + '%' : '—'}</div></div>
              <div><div style={lbl}>Lead sponsor</div><div style={cell}>{p.sponsor || '—'}</div></div>
            </div>

            {p.tags && p.tags.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={lbl}>Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {p.tags.map(t => <Tag key={t}>{t}</Tag>)}
                </div>
              </div>
            )}

            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Description</div>
            <p style={{ fontSize: 14, color: T2, lineHeight: 1.7, margin: 0 }}>{p.description}</p>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: `1px solid ${BD}`, background: W,
          display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0, flexWrap: 'wrap' }}>
          <Btn variant="ghost" onClick={() => onDownload(p)}><I k="download" s={16} c={T1} />Download</Btn>
          {PERMS.canEdit && <Btn variant="ghost" onClick={() => onEdit(p)}><I k="edit" s={16} c={T1} />Edit</Btn>}
          {PERMS.canDelete && <Btn onClick={() => onDelete(p)}><I k="trash" s={16} c={W} />Delete</Btn>}
        </div>
      </div>
    </>
  );
}

function DeleteModal({ p, onClose, onConfirm, isMobile, offset }) {
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Overlay onClick={onClose} offset={offset} z={400} dark={0.5} />
      <div role="dialog" aria-modal="true"
        style={{ position: 'fixed', top: '50%', left: `calc(${offset}px + (100% - ${offset}px) / 2)`,
          transform: 'translate(-50%,-50%)', width: isMobile ? '90vw' : 420,
          background: W, borderRadius: 16, zIndex: 401,
          boxShadow: '0 24px 70px rgba(0,0,0,.28)', padding: '28px 32px 30px', textAlign: 'center' }}>
        <button onClick={onClose} aria-label="Close"
          style={{ position: 'absolute', top: 14, right: 16, width: 26, height: 26, borderRadius: '50%',
            background: '#9CA3AF', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <I k="x" s={13} c={W} sw={2.6} />
        </button>
        <div style={{ width: 62, height: 62, borderRadius: '50%', background: RED_BG, border: `1px solid ${RED_BD}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '10px auto 18px' }}>
          <I k="trash" s={26} c={RED} />
        </div>
        <h3 style={{ fontSize: 19, fontWeight: 600, margin: '0 0 10px' }}>Delete project?</h3>
        <p style={{ fontSize: 14, color: T2, lineHeight: 1.6, margin: '0 0 24px' }}>
          Permanently delete <strong style={{ color: T1 }}>“{p.name}”</strong> from the pipeline? This cannot be undone
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}><Btn variant="ghost" full onClick={onClose}>Keep it</Btn></div>
          <div style={{ flex: 1 }}>
            <Btn variant="danger" full disabled={busy}
              onClick={() => { setBusy(true); setTimeout(() => onConfirm(p), 650); }}>
              {busy ? 'Deleting…' : 'Yes, delete'}
            </Btn>
          </div>
        </div>
      </div>
    </>
  );
}

function Toast({ msg, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [msg, onDone]);
  return (
    <div role="status" style={{ position: 'fixed', top: 20, right: 20, zIndex: 500, maxWidth: '90vw',
      background: GRN_BG, border: `1px solid ${GRN_BD}`, color: '#14532D',
      borderRadius: 10, padding: '12px 18px', fontSize: 14, fontWeight: 500,
      display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 30px rgba(0,0,0,.12)' }}>
      <I k="check" s={16} c={GRN} sw={2.6} />{msg}
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ padding: '90px 20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        <I k="inbox" s={54} c={T1} sw={1.3} />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 10px' }}>No projects in the pipeline yet</h3>
      <p style={{ fontSize: 14, color: T3, lineHeight: 1.6, margin: '0 auto', maxWidth: 420 }}>
        Create a pipeline entry to track a project, company or fund with built-in structure and momentum.
      </p>
    </div>
  );
}

function PipelineCard({ p, onOpen, onEdit, onDownload }) {
  const meta = { background: BG, borderRadius: 8, padding: '9px 11px' };
  const ml   = { fontSize: 11, color: T3, marginBottom: 3 };
  const mv   = { fontSize: 13, fontWeight: 500, color: T1 };
  return (
    <div onClick={() => onOpen(p)}
      style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, padding: 16, cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <Tag>{p.type}</Tag>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={e => { e.stopPropagation(); onDownload(p); }} aria-label={`Download ${p.name}`}
            style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BD}`, background: W,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <I k="download" s={14} c={T2} />
          </button>
          {PERMS.canEdit && (
            <button onClick={e => { e.stopPropagation(); onEdit(p); }} aria-label={`Edit ${p.name}`}
              style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BD}`, background: W,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <I k="edit" s={14} c={T2} />
            </button>
          )}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: T1, lineHeight: 1.35, marginBottom: 5 }}>{p.name}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: T2, marginBottom: 12 }}>
        <I k="pin" s={13} c={T3} />{[p.city, p.country].filter(Boolean).join(', ') || '—'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={meta}><div style={ml}>Capacity</div><div style={mv}>{p.capacity ? p.capacity.toFixed(1) + ' MW' : '—'}</div></div>
        <div style={meta}><div style={ml}>Deal value</div><div style={mv}>{money(p.value)}</div></div>
        <div style={meta}><div style={ml}>IRR target</div><div style={mv}>{p.irr ? p.irr + '%' : '—'}</div></div>
        <div style={meta}><div style={ml}>Sponsor</div><div style={{ ...mv, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.sponsor || '—'}</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T2, marginBottom: 6 }}>
        <span>Progress</span><span style={{ fontWeight: 600, color: T1 }}>{p.progress}%</span>
      </div>
      <div style={{ height: 4, background: BG, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: 4, width: `${p.progress}%`, background: p.progress === 100 ? GRN : P, borderRadius: 3 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${BD}`, paddingTop: 12, gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div style={{ width: 26, height: 26, borderRadius: '50%', background: AMB_BG, color: AMB_T,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
            {p.owner}
          </div>
          <div style={{ fontSize: 12, color: p.linkedDiligenceCount > 0 ? P : T3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {p.linkedDiligenceCount > 0 ? `${p.linkedDiligenceCount} linked diligence` : 'No linked diligence'}
          </div>
        </div>
        <span style={{ fontSize: 12, color: T3, whiteSpace: 'nowrap' }}>Updated {p.updated}</span>
      </div>
    </div>
  );
}

const BLANK = { name:'', type:'', stage:'', country:'', city:'', capacity:'', value:'',
                irr:'', sponsor:'', progress:'0', tags:'', description:'' };

export default function ProjectPipeline({ onNavigate = () => {} }) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [projects, setProjects] = useState(readStoredProjects);
  const [diligenceDocs, setDiligenceDocs] = useState(readStoredDiligenceDocs);
  const [view, setView] = useState('kanban');
  const [stage, setStage] = useState('All stages');
  const [fType, setFType] = useState('');
  const [topSearch, setTop] = useState('');

  const [sidebar, setSidebar] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : true);
  useEffect(() => { setSidebar(isDesktop); }, [isDesktop]);
  const overlayOffset = isDesktop && sidebar ? SIDEBAR_W : 0;

  const [adding, setAdding] = useState(false);
  const [editP, setEditP] = useState(null);
  const [detail, setDetail] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PIPELINE_STORAGE_KEY, JSON.stringify(projects));
    window.dispatchEvent(new Event('tribes:app-state-update'));
  }, [projects]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncFromStorage = () => setDiligenceDocs(readStoredDiligenceDocs());
    const handleStorage = (e) => {
      if (e?.key === DILIGENCE_STORAGE_KEY) syncFromStorage();
    };
    window.addEventListener('tribes:app-state-update', syncFromStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('tribes:app-state-update', syncFromStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const save = form => {
    const shaped = {
      name: form.name.trim(),
      type: form.type,
      stage: form.stage,
      country: form.country,
      city: form.city.trim(),
      capacity: form.capacity ? Number(form.capacity) : 0,
      value: form.value ? Number(form.value) : 0,
      irr: form.irr ? Number(form.irr) : 0,
      sponsor: form.sponsor.trim(),
      progress: Math.max(0, Math.min(100, Number(form.progress) || 0)),
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      description: form.description.trim(),
    };
    if (editP) {
      setProjects(ps => ps.map(x => x.id === editP.id ? { ...x, ...shaped, updated: 'just now' } : x));
      setDetail(d => (d && d.id === editP.id ? { ...d, ...shaped, updated: 'just now' } : d));
      setEditP(null);
      setToast('Changes saved');
    } else {
      setProjects(ps => [{ ...shaped, id: Date.now(), owner: 'OO', updated: 'just now' }, ...ps]);
      setAdding(false);
      setToast('Project added to pipeline');
    }
  };

  const remove = p => {
    setProjects(ps => ps.filter(x => x.id !== p.id));
    setToDelete(null); setDetail(null);
    setToast('Project deleted');
  };

  const download = p => {
    const body = [
      `Project:         ${p.name}`,
      `Type:            ${p.type}`,
      `Pipeline stage:  ${p.stage}`,
      `Location:        ${[p.city, p.country].filter(Boolean).join(', ') || '—'}`,
      `Capacity:        ${p.capacity ? p.capacity + ' MW' : '—'}`,
      `Deal value:      ${money(p.value)}`,
      `IRR target:      ${p.irr ? p.irr + '%' : '—'}`,
      `Lead sponsor:    ${p.sponsor || '—'}`,
      `Deal progress:   ${p.progress}%`,
      `Tags:            ${(p.tags || []).join(', ') || '—'}`,
      '', 'Description', p.description || '',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${p.name.replace(/[^\w\s-]/g, '').trim()}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setToast('Download started');
  };

  const projectSignals = useMemo(() => deriveProjectSignals(projects, diligenceDocs), [projects, diligenceDocs]);

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    const signalMap = new Map(projectSignals.map(signal => [signal.id, signal]));
    return projects.filter(p => {
      if (stage !== 'All stages' && p.stage !== stage) return false;
      if (fType && p.type !== fType) return false;
      if (q && ![p.name, p.sponsor, p.city, p.country, p.description].join(' ').toLowerCase().includes(q)) return false;
      return true;
    }).map((project) => ({
      ...project,
      ...(signalMap.get(project.id) || {}),
    }));
  }, [projects, stage, fType, topSearch, projectSignals]);

  const exportCsv = () => {
    if (!filtered.length) { setToast('Nothing to export'); return; }
    const head = ['Name','Type','Stage','Country','City','Capacity (MW)','Deal value (USD)','IRR (%)','Sponsor','Progress (%)','Tags'];
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = filtered.map(p => [p.name,p.type,p.stage,p.country,p.city,p.capacity,p.value,p.irr,p.sponsor,p.progress,(p.tags||[]).join('; ')].map(esc).join(','));
    const csv = [head.map(esc).join(','), ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'tribes-project-pipeline.csv';
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setToast(`Exported ${filtered.length} project${filtered.length !== 1 ? 's' : ''}`);
  };

  const stats = useMemo(() => {
    const any = projects.length > 0;
    const active = projects.filter(p => p.stage !== 'Portfolio');
    const total = projects.reduce((s, p) => s + (p.value || 0), 0);
    const linkedDiligenceCount = projectSignals.reduce((s, p) => s + (p.linkedDiligenceCount || 0), 0);
    return [
      { l: 'Active projects',    v: String(active.length),                                            tag: 'In pipeline',      tone: 'purple' },
      { l: 'Pipeline value',     v: any ? money(total) : '0',                                         tag: 'Total deal size',  tone: 'green'  },
      { l: 'In due diligence',   v: String(projects.filter(p => p.stage === 'Due Diligence').length), tag: 'Under review',     tone: 'purple' },
      { l: 'Linked diligence',   v: String(linkedDiligenceCount),                                     tag: 'Connected work',   tone: 'teal'   },
      { l: 'Term sheet stage',   v: String(projects.filter(p => p.stage === 'Term Sheet').length),    tag: 'Negotiating',      tone: 'amber'  },
      { l: 'Portfolio projects', v: String(projects.filter(p => p.stage === 'Portfolio').length),     tag: 'Live investments', tone: 'green'  },
      { l: 'Avg deal size',      v: any ? money(Math.round(total / projects.length)) : '0',           tag: 'Per project',      tone: 'amber'  },
    ];
  }, [projects, projectSignals]);

  const pad = isMobile ? '14px 12px 32px' : '24px 28px 44px';
  const visibleStages = stage === 'All stages' ? STAGES : [stage];

  return (
    <div style={{ display: 'flex', minHeight: '100%', width: '100%', background: PAGE,
      fontFamily: "'Figtree', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: T1 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');
        *{box-sizing:border-box;}
        button,input,select,textarea{font-family:inherit;}
        input::placeholder,textarea::placeholder{color:${T3};}
        ::-webkit-scrollbar{width:6px;height:6px;}
        ::-webkit-scrollbar-thumb{background:#D3D5DA;border-radius:10px;}
        :focus-visible{outline:2px solid ${PL};outline-offset:2px;}
      `}</style>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <main style={{ flex: 1, padding: pad }}>
          <div style={{ background: PANEL, border: `1px solid ${PANEL_BD}`,
            borderRadius: isMobile ? 14 : 20, padding: isMobile ? '20px 16px 30px' : '32px 32px 42px' }}>

            <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row',
              alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between',
              gap: 16, marginBottom: 18 }}>
              <div>
                <h1 style={{ fontSize: isMobile ? 24 : 30, fontWeight: 600, margin: '0 0 8px', letterSpacing: -0.5 }}>
                  Project Pipeline
                </h1>
                <p style={{ fontSize: 15, color: T2, margin: 0 }}>
                  Track energy infrastructure deals from sourcing through to active portfolio.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <button onClick={exportCsv}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '0 20px', height: 44, background: W, color: T1,
                    border: `1px solid ${BD}`, borderRadius: 8, fontSize: 15, fontWeight: 500,
                    cursor: 'pointer', whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none' }}>
                  <I k="download" s={16} c={T2} />Export
                </button>
                {PERMS.canCreate && (
                  <button onClick={() => setAdding(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '0 22px', height: 44, background: P, color: W, border: 'none',
                      borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer',
                      whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none' }}>
                    <I k="plus" s={17} c={W} sw={2.2} />Add project
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, padding: '14px 16px', background: PF, border: `1px solid ${PB}`, borderRadius: 12, color: '#5B2A86' }}>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Projects in the Due Diligence stage stay connected to the Due Diligence Vault workflow.</div>
              <button onClick={() => onNavigate('vault')} style={{ background: W, border: `1px solid ${PB}`, color: P, borderRadius: 999, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                Open Due Diligence Vault
              </button>
            </div>

            <div style={{ display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(6,1fr)',
              gap: isMobile ? 10 : 14, marginBottom: 22 }}>
              {stats.slice(0, 6).map(s => (
                <div key={s.l} style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12,
                  padding: isMobile ? '14px' : '16px 18px' }}>
                  <div style={{ fontSize: 12.5, color: T2, marginBottom: 6 }}>{s.l}</div>
                  <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 600, marginBottom: 10, letterSpacing: -0.5 }}>{s.v}</div>
                  <Tag tone={s.tone}>{s.tag}</Tag>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', flex: 1, minWidth: 0, paddingBottom: 2 }}>
                {['All stages', ...STAGES].map(s => {
                  const on = stage === s;
                  return (
                    <button key={s} onClick={() => setStage(s)}
                      style={{ padding: '9px 18px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer',
                        fontSize: 14, fontWeight: on ? 600 : 400, fontFamily: 'inherit',
                        background: on ? PF : W, color: on ? P : T2,
                        border: `1px solid ${on ? PB : BD}` }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <div style={{ width: isMobile ? '100%' : 160, flexShrink: 0 }}>
                <Select value={fType} onChange={setFType} options={TYPES} placeholder="All types" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>
                All projects <span style={{ color: T3, fontWeight: 400 }}>({filtered.length})</span>
              </span>
              <div style={{ display: 'flex', background: W, border: `1px solid ${BD}`, borderRadius: 8, overflow: 'hidden' }}>
                {[['kanban', 'grid'], ['list', 'list']].map(([v, icon]) => (
                  <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
                    style={{ padding: '9px 12px', border: 'none', cursor: 'pointer', display: 'flex',
                      background: view === v ? PF : W }}>
                    <I k={icon} s={18} c={view === v ? PL : T3} />
                  </button>
                ))}
              </div>
            </div>

            {projects.length === 0 ? (
              <EmptyState />
            ) : filtered.length === 0 ? (
              <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, padding: '60px 20px', textAlign: 'center' }}>
                <p style={{ color: T2, margin: 0, fontSize: 15 }}>No projects match your filters.</p>
              </div>
            ) : view === 'kanban' ? (
              <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                <div style={{ display: 'flex', gap: 16, minWidth: 'min-content' }}>
                  {visibleStages.map(st => {
                    const items = filtered.filter(p => p.stage === st);
                    return (
                      <div key={st} style={{ flex: `0 0 ${isMobile ? 280 : 320}px`, minWidth: isMobile ? 280 : 320 }}>
                        <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12,
                          padding: '14px 16px', marginBottom: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          borderBottom: `2px solid ${PL}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: PL }} />
                            <span style={{ fontSize: 14.5, fontWeight: 600 }}>{st}</span>
                          </div>
                          <span style={{ minWidth: 24, height: 24, borderRadius: 999, background: BG, color: T2,
                            fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center',
                            justifyContent: 'center', padding: '0 7px' }}>{items.length}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {items.map(p => (
                            <PipelineCard key={p.id} p={p} onOpen={setDetail} onEdit={setEditP} onDownload={download} />
                          ))}
                          {items.length === 0 && (
                            <div style={{ border: `1.5px dashed ${BD}`, borderRadius: 12, padding: '28px 14px',
                              textAlign: 'center', fontSize: 13, color: T3 }}>
                              No projects
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filtered.map(p => (
                  <PipelineCard key={p.id} p={p} onOpen={setDetail} onEdit={setEditP} onDownload={download} />
                ))}
              </div>
            ) : (
              <div style={{ background: W, border: `1px solid ${BD}`, borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
                    <thead>
                      <tr style={{ background: BG }}>
                        {['Project','Type','Stage','Capacity','Deal value','IRR','Progress',''].map((h, i) => (
                          <th key={i} style={{ textAlign: 'left', padding: '14px 18px', fontSize: 13.5,
                            fontWeight: 600, color: T1, borderBottom: `1px solid ${BD}`, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(p => (
                        <tr key={p.id} onClick={() => setDetail(p)}
                          style={{ cursor: 'pointer', borderBottom: `1px solid ${BD}` }}>
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                            <div style={{ fontSize: 12.5, color: T3, display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              <I k="pin" s={12} c={T3} />{[p.city, p.country].filter(Boolean).join(', ')}
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px' }}><Tag>{p.type}</Tag></td>
                          <td style={{ padding: '14px 18px' }}><Tag tone="teal">{p.stage}</Tag></td>
                          <td style={{ padding: '14px 18px', fontSize: 14, color: T2, whiteSpace: 'nowrap' }}>{p.capacity ? p.capacity.toFixed(1) + ' MW' : '—'}</td>
                          <td style={{ padding: '14px 18px', fontSize: 14, color: T2, whiteSpace: 'nowrap' }}>{money(p.value)}</td>
                          <td style={{ padding: '14px 18px', fontSize: 14, color: T2 }}>{p.irr ? p.irr + '%' : '—'}</td>
                          <td style={{ padding: '14px 18px', minWidth: 120 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <div style={{ flex: 1, height: 5, background: BG, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: 5, width: `${p.progress}%`, background: p.progress === 100 ? GRN : P }} />
                              </div>
                              <span style={{ fontSize: 12.5, color: T2, width: 32 }}>{p.progress}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button onClick={e => { e.stopPropagation(); download(p); }} aria-label={`Download ${p.name}`}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, marginRight: 2 }}>
                              <I k="download" s={17} c={T2} />
                            </button>
                            {PERMS.canEdit && (
                              <button onClick={e => { e.stopPropagation(); setEditP(p); }} aria-label={`Edit ${p.name}`}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                <I k="edit" s={17} c={PL} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {adding && <ProjectPanel onClose={() => setAdding(false)} onSave={save} isMobile={isMobile} offset={overlayOffset} />}
      {editP  && <ProjectPanel initial={editP} onClose={() => setEditP(null)} onSave={save} isMobile={isMobile} offset={overlayOffset} />}
      {detail && !editP && !toDelete && (
        <DetailPanel p={detail} onClose={() => setDetail(null)} onEdit={setEditP}
          onDelete={setToDelete} onDownload={download} isMobile={isMobile} offset={overlayOffset} />
      )}
      {toDelete && <DeleteModal p={toDelete} onClose={() => setToDelete(null)} onConfirm={remove} isMobile={isMobile} offset={overlayOffset} />}
      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}
    </div>
  );
}
