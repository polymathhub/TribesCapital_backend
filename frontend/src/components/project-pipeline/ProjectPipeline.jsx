import React, { useState, useEffect, useMemo, useRef } from "react";
import { dueDiligenceAPI } from '../../api/endpoints';
import { computeProjectScore } from '../../utils/dashboardMetrics';

/* ═══════════════════════════════════════════════════════════
   TRIBES CAPITAL — PROJECT PIPELINE
   Interactive · functional · responsive (mobile / tablet / desktop)

   Built around the same interaction model as the Due Diligence Vault so
   the two experiences feel coherent and connected.
═══════════════════════════════════════════════════════════ */

/* ─── TOKENS (aligned to the app theme) ─── */
const P   = '#5B21B6';
const PL  = '#7C3AED';
const PF  = '#F8FAFC';
const PB  = '#E5E7EB';

const T1  = '#1F1F24';
const T2  = '#6B6F76';
const T3  = '#9CA0A8';

const BD  = '#E5E7EB';
const BG  = '#F8FAFC';
const W   = '#FFFFFF';

const RED   = '#DC2626', RED_BG = '#FEF2F2', RED_BD = '#FECACA';
const GRN   = '#16A34A', GRN_BG = '#F0FDF4', GRN_BD = '#BBF7D0';
const AMB_T = '#B45309', AMB_BG = '#FEF3C7';
const TEAL  = '#0369A1', TEAL_BG = '#E0F2FE';

const PAGE     = '#F8FAFC';
const PANEL    = '#FFFFFF';
const PANEL_BD = '#E5E7EB';

const SIDEBAR_W = 260;
function getCurrentPermissions() {
  try {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('user') : null;
    if (!stored) return { canCreate: false, canEdit: false, canDelete: false, canExport: false };
    const user = JSON.parse(stored);
    const roles = user?.roles || [];
    const isAdmin = user?.isAdmin || roles.includes && roles.includes('admin');
    return {
      canCreate: Boolean(isAdmin || roles.includes('editor') || roles.includes('contributor')),
      canEdit: Boolean(isAdmin || roles.includes('editor') || roles.includes('moderator')),
      canDelete: Boolean(isAdmin || roles.includes('admin') || roles.includes('moderator')),
      canExport: Boolean(isAdmin),
    };
  } catch (e) {
    return { canCreate: false, canEdit: false, canDelete: false, canExport: false };
  }
}

const PERMS = getCurrentPermissions();

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

const money = n => {
  if (n === null || n === undefined || n === '') return '—';
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(1) + ' B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + ' M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + ' K';
  return '$' + n;
};

const mapDueDiligenceToPipelineProject = (item) => {
  const metadata = item?.targetMetadata && typeof item.targetMetadata === 'object' ? item.targetMetadata : {};
  const progress = typeof metadata.progress === 'number'
    ? metadata.progress
    : typeof item?.completionPercent === 'number'
      ? item.completionPercent
      : null;
  const value = typeof metadata.value === 'number'
    ? metadata.value
    : typeof metadata.dealValue === 'number'
      ? metadata.dealValue
      : null;

  const baseTags = Array.isArray(metadata.tags) ? metadata.tags.filter(tag => typeof tag === 'string') : [];
  const normalizedTags = item?.status === 'approved' ? Array.from(new Set([...baseTags, 'Approved'])) : baseTags;

  return {
    id: `dd-${item.id}`,
    dueDiligenceId: item.id,
    name: item?.title || 'Untitled diligence',
    type: item?.type || 'investment',
    stage: item?.status === 'approved' ? 'Approved' : 'Due Diligence',
    country: typeof metadata.country === 'string' ? metadata.country : '',
    city: typeof metadata.city === 'string' ? metadata.city : '',
    capacity: typeof metadata.capacity === 'number' ? metadata.capacity : null,
    value,
    irr: typeof metadata.irr === 'number' ? metadata.irr : null,
    sponsor: typeof metadata.sponsor === 'string' ? metadata.sponsor : '',
    progress,
    tags: normalizedTags,
    description: item?.description || '',
    updated: item?.updatedAt ? new Date(item.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'just now',
    updatedAt: item?.updatedAt ? new Date(item.updatedAt).toISOString() : null,
    source: 'due-diligence',
    sourceType: 'due-diligence',
    status: item?.status || 'draft',
    owner: 'DD',
  };
};

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
                <span style={{ fontSize: 13, fontWeight: 600, color: P }}>{p.progress !== null && p.progress !== undefined ? p.progress + '%' : '—'}</span>
              </div>
              <div style={{ height: 8, background: BG, borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: 8, width: p.progress !== null && p.progress !== undefined ? `${p.progress}%` : '0%', background: p.progress === 100 ? GRN : P, borderRadius: 4 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><div style={lbl}>Capacity</div><div style={cell}>{p.capacity !== null && p.capacity !== undefined ? p.capacity + ' MW' : '—'}</div></div>
              <div><div style={lbl}>Deal value</div><div style={cell}>{money(p.value)}</div></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div><div style={lbl}>IRR target</div><div style={cell}>{p.irr !== null && p.irr !== undefined ? p.irr + '%' : '—'}</div></div>
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
      <h3 style={{ fontSize: 18, fontWeight: 500, margin: '0 0 10px' }}>No approved cases yet</h3>
      <p style={{ fontSize: 14, color: T3, lineHeight: 1.6, margin: '0 auto', maxWidth: 420 }}>
        Once an admin approves a due-diligence case, it will appear here automatically.
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

            {p && p.source === 'due-diligence' && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('tribes:request-approval', { detail: { id: p.dueDiligenceId } })); }}
                  title="Request approval" aria-label="Request approval"
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BD}`, background: W,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I k="plus" s={14} c={T2} />
                </button>
                <button onClick={e => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('tribes:quick-approve', { detail: { id: p.dueDiligenceId } })); }}
                  title="Quick approve" aria-label="Quick approve"
                  style={{ width: 28, height: 28, borderRadius: 7, border: `1px solid ${BD}`, background: '#DCFCE7',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I k="check" s={14} c={GRN} />
                </button>
              </div>
            )}
        </div>
      </div>

      <div style={{ fontSize: 15, fontWeight: 600, color: T1, lineHeight: 1.35, marginBottom: 5 }}>{p.name}</div>
      
      {/* Document preview for approved diligence */}
      {p.dueDiligenceId && p.documentPreview && (
        <div style={{ marginBottom: 12, height: 120, borderRadius: 8, overflow: 'hidden', border: `1px solid ${BD}`, background: '#F3F4F6' }}>
          {/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(p.documentPreview) ? (
            <img src={p.documentPreview} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, #F5EDFC 0%, #F9F5FF 100%)', flexDirection: 'column', gap: 6 }}>
              <I k="file" s={32} c={PL} />
              <span style={{ fontSize: 11, color: PL, fontWeight: 600 }}>Document</span>
            </div>
          )}
        </div>
      )}
      
      {p.dueDiligenceId && (
        <div style={{ marginBottom: 10 }}>
          <Tag tone="green">Approved diligence</Tag>
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: T2, marginBottom: 12 }}>
        <I k="pin" s={13} c={T3} />{[p.city, p.country].filter(Boolean).join(', ') || '—'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div style={meta}><div style={ml}>Capacity</div><div style={mv}>{p.capacity !== null && p.capacity !== undefined ? p.capacity.toFixed(1) + ' MW' : '—'}</div></div>
        <div style={meta}><div style={ml}>Deal value</div><div style={mv}>{money(p.value)}</div></div>
        <div style={meta}><div style={ml}>IRR target</div><div style={mv}>{p.irr !== null && p.irr !== undefined ? p.irr + '%' : '—'}</div></div>
        <div style={meta}><div style={ml}>Sponsor</div><div style={{ ...mv, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.sponsor || '—'}</div></div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: T2, marginBottom: 6 }}>
        <span>Progress</span><span style={{ fontWeight: 600, color: T1 }}>{p.progress !== null && p.progress !== undefined ? p.progress + '%' : '—'}</span>
      </div>
      <div style={{ height: 4, background: BG, borderRadius: 3, overflow: 'hidden', marginBottom: 14 }}>
        <div style={{ height: 4, width: p.progress !== null && p.progress !== undefined ? `${p.progress}%` : '0%', background: p.progress === 100 ? GRN : P, borderRadius: 3 }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: `1px solid ${BD}`, paddingTop: 12 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: AMB_BG, color: AMB_T,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
          {p.owner}
        </div>
        <span style={{ fontSize: 12, color: T3 }}>Updated {p.updated}</span>
      </div>
    </div>
  );
}

const BLANK = { name:'', type:'', stage:'', country:'', city:'', capacity:'', value:'',
                irr:'', sponsor:'', progress:'', tags:'', description:'' };

export default function ProjectPipeline({ onNavigate = () => {} }) {
  const { isMobile, isTablet, isDesktop } = useBreakpoint();

  const [projects, setProjects] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
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

  const syncApprovedPipelineProjects = async () => {
    setLoadingProjects(true);
    try {
      const response = await dueDiligenceAPI.list({ page: 1, limit: 100, status: 'approved' });
      const payload = response?.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
      const approvedProjects = items.map(mapDueDiligenceToPipelineProject);
      setProjects(prev => {
        const manualProjects = prev.filter(project => !project.dueDiligenceId);
        const approvedIds = new Set(approvedProjects.map(project => project.dueDiligenceId));
        const persistedApprovedProjects = prev
          .filter(project => project.dueDiligenceId && approvedIds.has(project.dueDiligenceId))
          .map(project => {
            const incoming = approvedProjects.find(item => item.dueDiligenceId === project.dueDiligenceId);
            return incoming ? { ...project, ...incoming } : project;
          });
        return [...manualProjects, ...approvedProjects.map(project => {
          const existing = persistedApprovedProjects.find(item => item.dueDiligenceId === project.dueDiligenceId);
          return existing ? { ...existing, ...project } : project;
        })];
      });
    } catch (error) {
      console.error('Failed to load approved due diligence projects:', error);
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    void syncApprovedPipelineProjects();
  }, []);

  useEffect(() => {
    const addApprovedProject = (event) => {
      const item = event?.detail?.project || event?.detail?.dueDiligence || event?.detail?.item;
      if (!item) return;

      const mapped = mapDueDiligenceToPipelineProject(item);
      setProjects(prev => {
        const next = prev.filter(project => project.dueDiligenceId !== mapped.dueDiligenceId);
        return [mapped, ...next];
      });
    };

    const refreshFromDiligenceEvents = (event) => {
      const detail = event?.detail;
      if (detail?.type === 'due-diligence-updated' || detail?.type === 'due-diligence-created' || detail?.action === 'approval-decided') {
        void syncApprovedPipelineProjects();
      }
    };

    const handleDiligenceApproved = (event) => {
      const item = event?.detail?.project || event?.detail?.dueDiligence || event?.detail?.item;
      if (item) {
        const mapped = mapDueDiligenceToPipelineProject(item);
        setProjects(prev => {
          const next = prev.filter(project => project.dueDiligenceId !== mapped.dueDiligenceId);
          return [mapped, ...next];
        });
      }
      void syncApprovedPipelineProjects();
    };

    const handlePipelineSync = (event) => {
      const item = event?.detail?.project || event?.detail?.dueDiligence || event?.detail?.item;
      if (item) {
        const mapped = mapDueDiligenceToPipelineProject(item);
        setProjects(prev => {
          const next = prev.filter(project => project.dueDiligenceId !== mapped.dueDiligenceId);
          return [mapped, ...next];
        });
      }
      setTimeout(() => { void syncApprovedPipelineProjects(); }, 50);
    };

    window.addEventListener('tribes:notifications-update', refreshFromDiligenceEvents);
    window.addEventListener('tribes:due-diligence-approved', handleDiligenceApproved);
    window.addEventListener('tribes:pipeline-sync-approved', handlePipelineSync);
    window.addEventListener('tribes:project-pipeline-add', addApprovedProject);
    return () => {
      window.removeEventListener('tribes:notifications-update', refreshFromDiligenceEvents);
      window.removeEventListener('tribes:due-diligence-approved', handleDiligenceApproved);
      window.removeEventListener('tribes:pipeline-sync-approved', handlePipelineSync);
      window.removeEventListener('tribes:project-pipeline-add', addApprovedProject);
    };
  }, []);

  useEffect(() => {
    const notify = (detail = {}) => {
      try {
        window.dispatchEvent(new CustomEvent('tribes:notifications-update', { detail: { type: 'due-diligence-updated', ...detail } }));
      } catch (e) {
        console.warn('notify failed', e);
      }
    };

    const handleRequest = async (e) => {
      const id = e?.detail?.id;
      if (!id) return;
      try {
        await dueDiligenceAPI.createApproval(id, { approverRole: 'reviewer', approvalNotes: 'Requested from pipeline' });
        setToast('Approval requested');
        notify({ id, action: 'approval-requested' });
        void syncApprovedPipelineProjects();
      } catch (err) {
        console.error('request approval failed', err);
        setToast('Failed to request approval');
      }
    };

    const handleQuickApprove = async (e) => {
      const id = e?.detail?.id;
      if (!id) return;
      try {
        const res = await dueDiligenceAPI.createApproval(id, { approverRole: 'admin', approvalNotes: 'Quick-approved from pipeline' });
        const approvalId = res?.data?.id || res?.id || null;
        if (approvalId) {
          await dueDiligenceAPI.approveOrReject(id, approvalId, { status: 'approved', approvalNotes: 'Quick-approved from pipeline' });
          setToast('Project approved');
          notify({ id, action: 'approval-decided', decision: 'approved' });
          void syncApprovedPipelineProjects();
        } else {
          setToast('Approval created, but could not apply decision');
        }
      } catch (err) {
        console.error('quick approve failed', err);
        setToast('Quick approve failed');
      }
    };

    window.addEventListener('tribes:request-approval', handleRequest);
    window.addEventListener('tribes:quick-approve', handleQuickApprove);
    return () => {
      window.removeEventListener('tribes:request-approval', handleRequest);
      window.removeEventListener('tribes:quick-approve', handleQuickApprove);
    };
  }, []);

  const save = form => {
    const shaped = {
      name: form.name.trim(),
      type: form.type,
      stage: form.stage,
      country: form.country,
      city: form.city.trim(),
      capacity: form.capacity ? Number(form.capacity) : null,
      value: form.value ? Number(form.value) : null,
      irr: form.irr ? Number(form.irr) : null,
      sponsor: form.sponsor.trim(),
      progress: form.progress !== '' && form.progress !== null && form.progress !== undefined
        ? Math.max(0, Math.min(100, Number(form.progress)))
        : null,
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
      `Capacity:        ${p.capacity !== null && p.capacity !== undefined ? p.capacity + ' MW' : '—'}`,
      `Deal value:      ${money(p.value)}`,
      `IRR target:      ${p.irr !== null && p.irr !== undefined ? p.irr + '%' : '—'}`,
      `Lead sponsor:    ${p.sponsor || '—'}`,
      `Deal progress:   ${p.progress !== null && p.progress !== undefined ? p.progress + '%' : '—'}`,
      `Tags:            ${(p.tags || []).join(', ') || '—'}`,
      '', 'Description', p.description || '',
    ].join('\n');
    const url = URL.createObjectURL(new Blob([body], { type: 'text/plain' }));
    const a = document.createElement('a');
    a.href = url; a.download = `${p.name.replace(/[^\w\s-]/g, '').trim()}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    setToast('Download started');
  };

  const filtered = useMemo(() => {
    const q = topSearch.trim().toLowerCase();
    const base = projects.filter(p => {
      if (stage !== 'All stages' && p.stage !== stage) return false;
      if (fType && p.type !== fType) return false;
      if (q && ![p.name, p.sponsor, p.city, p.country, p.description].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });

    // Compute prioritization score and sort descending
    return base.map(p => ({ ...p, priorityScore: computeProjectScore(p) }))
      .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0));
  }, [projects, stage, fType, topSearch]);

  const exportCsv = () => {
    if (!PERMS.canExport) {
      setToast('Only admins can export the pipeline');
      return;
    }
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
    const active = projects.filter(p => p.stage !== 'Portfolio');
    const valuedProjects = projects.filter(p => p.value !== null && p.value !== undefined);
    const total = valuedProjects.reduce((s, p) => s + p.value, 0);
    const avgDealSize = valuedProjects.length > 0 ? money(Math.round(total / valuedProjects.length)) : '—';
    return [
      { l: 'Active projects',    v: String(active.length),                                            tag: 'In pipeline',      tone: 'purple' },
      { l: 'Pipeline value',     v: valuedProjects.length > 0 ? money(total) : '—',                  tag: 'Total deal size',  tone: 'green'  },
      { l: 'In due diligence',   v: String(projects.filter(p => p.stage === 'Due Diligence').length), tag: 'Under review',     tone: 'purple' },
      { l: 'Term sheet stage',   v: String(projects.filter(p => p.stage === 'Term Sheet').length),    tag: 'Negotiating',      tone: 'amber'  },
      { l: 'Portfolio projects', v: String(projects.filter(p => p.stage === 'Portfolio').length),     tag: 'Live investments', tone: 'green'  },
      { l: 'Avg deal size',      v: avgDealSize,                                                      tag: 'Per project',      tone: 'amber'  },
    ];
  }, [projects]);

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
            borderRadius: isMobile ? 14 : 20, padding: isMobile ? '20px 16px 30px' : '32px 32px 42px', boxShadow: '0 12px 32px rgba(15,23,42,0.06)' }}>

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
                {PERMS.canExport && (
                  <button onClick={exportCsv}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '0 20px', height: 44, background: W, color: T1,
                      border: `1px solid ${BD}`, borderRadius: 8, fontSize: 15, fontWeight: 500,
                      cursor: 'pointer', whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none', boxShadow: '0 4px 18px rgba(15,23,42,0.04)' }}>
                    <I k="download" s={16} c={T2} />Export
                  </button>
                )}
                {
                  <button onClick={() => setAdding(true)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '0 22px', height: 44, background: P, color: W, border: 'none',
                      borderRadius: 8, fontSize: 15, fontWeight: 500, cursor: 'pointer',
                      whiteSpace: 'nowrap', flex: isMobile ? 1 : 'none' }}>
                    <I k="plus" s={17} c={W} sw={2.2} />Add project
                  </button>
                }
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, padding: '18px 20px', background: PF, border: `1px solid ${PB}`, borderRadius: 16, color: T2 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T1 }}>Projects in the Due Diligence stage stay connected to the Due Diligence Vault workflow.</div>
              <button onClick={() => onNavigate('vault')} style={{ background: W, border: `1px solid ${BD}`, color: P, borderRadius: 999, padding: '10px 18px', cursor: 'pointer', fontSize: 13, fontWeight: 600, minWidth: 170 }}>
                Open Due Diligence Vault
              </button>
            </div>

            <div style={{ display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3,1fr)' : 'repeat(6,1fr)',
              gap: isMobile ? 10 : 14, marginBottom: 22 }}>
              {stats.map(s => (
                <div key={s.l} style={{ background: W, border: `1px solid ${BD}`, borderRadius: 16,
                  padding: isMobile ? '15px' : '18px 20px', boxShadow: '0 10px 24px rgba(15,23,42,0.05)' }}>
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
                      style={{ padding: '10px 20px', borderRadius: 999, whiteSpace: 'nowrap', cursor: 'pointer',
                        fontSize: 14, fontWeight: on ? 600 : 500, fontFamily: 'inherit',
                        background: on ? '#EEF2FF' : W, color: on ? P : T2,
                        border: `1px solid ${on ? '#C7D2FE' : BD}`, boxShadow: on ? '0 6px 18px rgba(91,33,182,0.12)' : 'none' }}>
                      {s}
                    </button>
                  );
                })}
              </div>
              <div style={{ width: isMobile ? '100%' : 160, flexShrink: 0 }}>
                <Select value={fType} onChange={setFType} options={TYPES} placeholder="All types" />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: 17, fontWeight: 600 }}>
                All projects <span style={{ color: T3, fontWeight: 400 }}>({filtered.length})</span>
              </span>
              <div style={{ display: 'flex', background: W, border: `1px solid ${BD}`, borderRadius: 10, overflow: 'hidden' }}>
                {[['kanban', 'grid'], ['list', 'list']].map(([v, icon]) => (
                  <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
                    style={{ padding: '9px 12px', border: 'none', cursor: 'pointer', display: 'flex',
                      background: view === v ? PF : W }}>
                    <I k={icon} s={18} c={view === v ? PL : T3} />
                  </button>
                ))}
              </div>
            </div>

            {projects.length === 0 && !loadingProjects ? (
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
