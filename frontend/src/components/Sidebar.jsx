import React from 'react';
import { COLORS } from '../constants/colors';
import Icon from './Icon';
import { LogoMark } from './Logo';

const NAV_ITEMS = [
  { label: 'Home', page: 'home', icon: 'home' },
  { label: 'Learning Hub', page: 'learning', icon: 'book' },
  { label: 'Due Diligence Vault', page: 'vault', icon: 'folder' },
  { label: 'Office Hours & Events', page: 'events', icon: 'calendar' },
  null,
  { label: 'Announcements & Feedback', page: 'announcements', icon: 'bell' },
  { label: 'Help', page: 'help', icon: 'help' },
];

function Sidebar({ sidebarRef, activePage = 'home', onNavigate = () => {}, onClose = () => {}, onLogout = () => {} }) {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);

  return (
    <div ref={sidebarRef} style={{
      width: 220, minWidth: 220, background: COLORS.W, borderRight: `1px solid ${COLORS.BD}`,
      display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0, zIndex: 5,
    }}>
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
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-3px) scale(1.05);
          }
        }
        .nav-item {
          animation: slideInLeft 0.3s ease-out;
          position: relative;
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
      `}</style>
      
      <div style={{ padding: '12px 12px 12px', borderBottom: `1px solid ${COLORS.BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <LogoMark size={36} animate={true}/>
          <span style={{ fontWeight: 700, fontSize: 11, color: COLORS.T1, letterSpacing: .8, textTransform: 'uppercase' }}>Tribes Capital</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.T2, fontSize: 18, lineHeight: 1, padding: 4 }}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>

      <div style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item, i) => {
          if (!item) return <div key={i} style={{ height: 1, background: COLORS.BD, margin: '6px 14px' }}/>
          const isActive = activePage === item.page;
          const isHovered = hoveredIndex === i;
          return (
            <div
              key={i}
              className={`nav-item ${isActive ? 'active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => {
                onNavigate(item.page);
                onClose();
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onNavigate(item.page);
                  onClose();
                }
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
                }}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  color={isActive ? COLORS.P : isHovered ? '#5B21B6' : COLORS.T3}
                />
              </div>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', padding: '10px 12px 14px', borderTop: `1px solid ${COLORS.BD}` }}>
        <button
          type="button"
          onClick={() => {
            onLogout();
            onClose();
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 12px',
            border: `1px solid ${COLORS.BD}`,
            borderRadius: 10,
            background: '#FFF7F7',
            color: '#B91C1C',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          <Icon name="logout" size={16} color="#B91C1C" />
          <span>Log out</span>
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
