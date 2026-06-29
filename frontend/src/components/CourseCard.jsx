import React, { useState } from 'react';
import { COLORS } from '../constants/colors';
import Icon from './Icon';

function CourseCard({ cat, title, meta, pct, btn, catColor = COLORS.P }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(16px) saturate(180%)', WebkitBackdropFilter: 'blur(16px) saturate(180%)', border: `1px solid rgba(255,255,255,0.75)`, borderRadius: 12, marginBottom: 12, overflow: 'hidden', boxShadow: isHovered ? '0 18px 36px rgba(17,24,39,0.08)' : '0 10px 22px rgba(17,24,39,0.05)', transform: isHovered ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.2s ease' }}
    >
      <div style={{ height: 3, background: '#F3F4F6' }}>
        <div style={{ height: 3, width: `${pct}%`, background: catColor, borderRadius: '0 3px 3px 0' }}/>
      </div>
      <div style={{ padding: '14px 18px 16px', display: 'flex', gap: 14, flexDirection: 'row' }}>
        <div style={{ width: 36, height: 44, background: COLORS.PF, borderRadius: 8, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0, color: COLORS.P, fontSize: 16 }}>
          <Icon name="doc" size={18} color={COLORS.P}/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: catColor, letterSpacing: .6, textTransform: 'uppercase', margin: '0 0 5px' }}>{cat}</p>
          <p style={{ fontSize: 14, fontWeight: 600, color: COLORS.T1, margin: '0 0 4px', lineHeight: 1.35, wordBreak: 'break-word' }}>{title}</p>
          <p style={{ fontSize: 12, color: COLORS.T2, margin: '0 0 14px', lineHeight: 1.45 }}>{meta}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ width: 'min(160px, 100%)', height: 4, background: '#F3F4F6', borderRadius: 4, flexShrink: 1 }}>
                <div style={{ width: `${pct}%`, height: 4, background: catColor, borderRadius: 4 }}/>
              </div>
              <span style={{ fontSize: 12, color: COLORS.T2, whiteSpace: 'nowrap' }}>{pct}% complete</span>
            </div>
            <button style={{ border: 'none', background: 'linear-gradient(135deg, #5B21B6 0%, #7C3AED 100%)', color: COLORS.W, fontSize: 13, padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', width: '100%', maxWidth: 120, boxShadow: '0 8px 18px rgba(91, 33, 182, 0.18)', transition: 'transform 0.2s ease, box-shadow 0.2s ease' }}>
              {btn}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
