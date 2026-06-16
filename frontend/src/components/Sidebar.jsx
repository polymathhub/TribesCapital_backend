import React from 'react';
import { COLORS } from '../constants/colors';
import Icon from './Icon';
import { LogoMark } from './Logo';
import { NAV_ITEMS } from '../constants/navigation';

function Sidebar({ sidebarRef, currentPage, onNavigate, onClose, isMobile, isTablet, isOpen }) {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const [clickedIndex, setClickedIndex] = React.useState(null);
  const isOverlay = isMobile || isTablet;

  if (isOverlay && !isOpen) return null;

  return (
    <>
      {isOverlay && (
        <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200 }} />
      )}
      <div 
        ref={sidebarRef} 
        style={{
          width: 200, minWidth: 200, background: COLORS.W, borderRight: `1px solid ${COLORS.BD}`,
          display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0, zIndex: 5,
          ...(isOverlay ? { position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 201, boxShadow: '4px 0 24px rgba(0,0,0,.18)' } : {}),
        }}
      >
        <style>{`
          @keyframes slideInLeft {
            from {
              transform: translateX(-4px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes scaleIcon {
            0% {
              transform: scale(1) rotate(0deg);
              filter: brightness(1) drop-shadow(0 0 0px rgba(123, 58, 237, 0));
            }
            50% {
              transform: scale(1.25) rotate(-8deg);
              filter: brightness(1.1) drop-shadow(0 0 8px rgba(123, 58, 237, 0.4));
            }
            100% {
              transform: scale(1.3) rotate(-12deg);
              filter: brightness(1.15) drop-shadow(0 0 12px rgba(123, 58, 237, 0.6));
            }
          }
          @keyframes pulse {
            0%, 100% {
              filter: drop-shadow(0 0 4px rgba(123, 58, 237, 0.2));
            }
            50% {
              filter: drop-shadow(0 0 8px rgba(123, 58, 237, 0.5));
            }
          }
          @keyframes ripple {
            to {
              transform: scale(4);
              opacity: 0;
            }
          }
          @keyframes slideUp {
            from {
              transform: translateY(8px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .nav-item {
            animation: slideInLeft 0.3s ease-out;
            position: relative;
            overflow: hidden;
          }
          .nav-item::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            width: 0;
            height: 100%;
            background: rgba(123, 58, 237, 0.05);
            border-radius: 8px;
            transition: width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            z-index: -1;
          }
          .nav-item::after {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 100%;
            height: 100%;
            background: radial-gradient(circle, rgba(123, 58, 237, 0.2) 0%, transparent 70%);
            border-radius: 50%;
            transform: scale(0) translate(-50%, -50%);
            opacity: 0;
            pointer-events: none;
          }
          .nav-item.clicked::after {
            animation: ripple 0.6s ease-out;
          }
          .nav-item:hover::before {
            width: 100%;
          }
          .nav-item:hover {
            animation: none;
          }
          .nav-icon {
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            filter: brightness(0.85);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .nav-item:hover .nav-icon {
            animation: scaleIcon 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          }
          .nav-item.active .nav-icon {
            animation: pulse 2s ease-in-out infinite;
          }
          .nav-label {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            animation: slideUp 0.4s ease-out;
          }
        `}</style>
        
        <div style={{ padding: '12px 12px 12px', borderBottom: `1px solid ${COLORS.BD}`, display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LogoMark size={36} animate={false} />
            <span style={{ fontWeight: 700, fontSize: 11, color: COLORS.T1, letterSpacing: .8, textTransform: 'uppercase' }}>Tribes Capital</span>
          </div>
          {isOverlay && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: COLORS.T2 }}>
              <Icon name="x" size={16} color={COLORS.T2} />
            </button>
          )}
        </div>

        <div style={{ flex: 1, padding: '8px 0' }}>
          {NAV_ITEMS.map((item, i) => {
            if (!item) return <div key={`divider-${i}`} style={{ height: 1, background: COLORS.BD, margin: '6px 14px' }} />;
            const isHovered = hoveredIndex === i;
            const isActive = currentPage === item.key;
            const isClicked = clickedIndex === i;
            return (
              <div 
                key={item.id} 
                className={`nav-item ${isActive ? 'active' : ''} ${isClicked ? 'clicked' : ''}`}
                onClick={() => {
                  setClickedIndex(i);
                  setTimeout(() => setClickedIndex(null), 600);
                  onNavigate(item.key);
                  if (isOverlay) onClose();
                }}
                style={{
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12,
                  padding: '10px 14px', 
                  margin: '2px 6px', 
                  borderRadius: 8, 
                  cursor: 'pointer',
                  background: isActive ? COLORS.PF : isHovered ? '#F3F4F6' : 'transparent',
                  color: isActive ? COLORS.P : COLORS.T2,
                  fontWeight: isActive ? 500 : 400,
                  fontSize: 13,
                  borderLeft: isActive ? `3px solid ${COLORS.P}` : '3px solid transparent',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                  position: 'relative',
                }}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <div 
                  className="nav-icon" 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 24,
                    height: 24,
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: isHovered ? 'scale(1.2) rotate(-5deg)' : 'scale(1) rotate(0deg)',
                    flexShrink: 0,
                  }}
                >
                  <Icon 
                    name={item.icon} 
                    size={18} 
                    color={isActive ? COLORS.P : isHovered ? '#5B21B6' : COLORS.T3}
                  />
                </div>
                <span className="nav-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default Sidebar;
