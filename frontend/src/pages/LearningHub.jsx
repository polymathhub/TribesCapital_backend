import React, { useEffect, useMemo, useState } from 'react';

const PU = '#5B21B6';
const BG = '#F9FAFB';
const W = '#FFFFFF';
const T1 = '#111827';
const T2 = '#6B7280';

export default function App({ onBack, onToggleSidebar, isMobile, isTablet }) {
  const [status, setStatus] = useState('Loading learning hub...');

  useEffect(() => {
    const timer = setTimeout(() => {
      setStatus('Learning Hub is ready.');
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  const overview = useMemo(() => [
    { label: 'Courses', value: '4 enrolled' },
    { label: 'In progress', value: '2 active' },
    { label: 'Completed', value: '1 finished' },
  ], []);

  return (
    <div style={{ flex: 1, background: BG, color: T1, padding: isMobile ? 16 : 24, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>Learning Hub</div>
          <div style={{ fontSize: 14, color: T2 }}>A lightweight preview is running while the full experience is being restored.</div>
        </div>
        <button
          onClick={onToggleSidebar}
          style={{ background: PU, color: W, border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer' }}
        >
          Menu
        </button>
      </div>

      <div style={{ background: W, borderRadius: 14, padding: 18, boxShadow: '0 10px 24px rgba(0,0,0,0.05)', marginBottom: 18 }}>
        <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{status}</div>
        <div style={{ fontSize: 13, color: T2 }}>You can use the preview at localhost while the app is being repaired.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>
        {overview.map((item) => (
          <div key={item.label} style={{ background: W, borderRadius: 12, padding: 16, boxShadow: '0 8px 18px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 12, color: T2, marginBottom: 6 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 700 }}>{item.value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, background: W, borderRadius: 14, padding: 18, boxShadow: '0 10px 24px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Next steps</div>
        <ul style={{ margin: 0, paddingLeft: 18, color: T2, lineHeight: 1.7 }}>
          <li>Confirm the backend and database connection.</li>
          <li>Restore the full learning experience once the parser issue is resolved.</li>
          <li>Refresh the page to see the preview update.</li>
        </ul>
      </div>
    </div>
  );
}
