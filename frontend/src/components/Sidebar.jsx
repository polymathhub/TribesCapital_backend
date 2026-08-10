import React from 'react';
import { COLORS } from '../constants/colors';
import Icon from './Icon';
import logoPng from '../assets/image.png';
import profilePlaceholderImage from '../assets/illustrations/Artist Woman (1).png';

const NAV_ITEMS = [
  { label: 'Home', page: 'home', icon: 'home' },
  { label: 'Learning Hub', page: 'learning', icon: 'book' },
  { label: 'Due Diligence Vault', page: 'vault', icon: 'folder' },
  { label: 'Project Pipeline', page: 'pipeline', icon: 'chart' },
  { label: 'Office Hours & Events', page: 'events', icon: 'calendar' },
  null,
  { label: 'Announcements & Feedback', page: 'announcements', icon: 'bell' },
  { label: 'Help', page: 'help', icon: 'help' },
];

function Sidebar({ sidebarRef, activePage = 'home', onNavigate = () => {}, onClose = () => {}, onLogout = () => {}, user, collapsed = false }) {
  const [hoveredIndex, setHoveredIndex] = React.useState(null);
  const displayName = user?.name || user?.email?.split('@')[0] || 'Member';
  const [storedAvatar, setStoredAvatar] = React.useState(null);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try { const s = window.localStorage.getItem('tribes-avatar'); if (s) setStoredAvatar(s); } catch {}
  }, []);
  const avatarSrc = storedAvatar || user?.avatar || profilePlaceholderImage;

  return (
    <div ref={sidebarRef} style={{
      width: collapsed ? 64 : 220,
      minWidth: collapsed ? 64 : 220,
      background: 'rgba(255,255,255,0.9)',
      backdropFilter: 'blur(14px) saturate(140%)', WebkitBackdropFilter: 'blur(14px) saturate(140%)',
      borderRight: `1px solid rgba(0,0,0,0.04)`, display: 'flex', flexDirection: 'column', overflowY: 'auto', flexShrink: 0, zIndex: 5,
      boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255,255,255,0.7)',
      transition: 'width 220ms cubic-bezier(0.2,0.9,0.2,1)',
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
          40% {
            transform: scale(1.18) rotate(-6deg);
            filter: brightness(1.08) drop-shadow(0 0 8px rgba(123, 58, 237, 0.3));
          }
          70% {
            transform: scale(1.28) rotate(-10deg);
            filter: brightness(1.14) drop-shadow(0 0 14px rgba(123, 58, 237, 0.45));
          }
          100% {
            transform: scale(1.32) rotate(-12deg);
            filter: brightness(1.18) drop-shadow(0 0 18px rgba(123, 58, 237, 0.6));
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
          background: linear-gradient(90deg, rgba(123, 58, 237, 0.12) 0%, rgba(167, 139, 250, 0.22) 100%);
          border-radius: 10px;
          box-shadow: inset 0 0 0 1px rgba(123, 58, 237, 0.08);
          transition: width 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.28s ease;
          z-index: -1;
        }
        .nav-item:hover::before {
          width: 100%;
          transform: translateX(2px);
        }
        .nav-item:hover {
          animation: none;
        }
      `}</style>
      
      <div style={{ padding: '10px 10px', borderBottom: `1px solid ${COLORS.BD}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: collapsed ? 0 : 10, minWidth: 0 }}>
          <img src={logoPng} alt="Tribes Capital" style={{ width: collapsed ? 36 : 36, height: collapsed ? 36 : 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          {!collapsed && <span style={{ fontWeight: 700, fontSize: 11, color: COLORS.T1, letterSpacing: .8, textTransform: 'uppercase' }}>Tribes Capital</span>}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: COLORS.T2, fontSize: 18, lineHeight: 1, padding: 6 }}
            aria-label="Close sidebar"
          >
            ×
          </button>
        )}
      </div>
      {!collapsed && (
        <div style={{ padding: '12px', borderBottom: `1px solid ${COLORS.BD}`, display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(245,246,252,0.86)' }}>
          <img src={avatarSrc} alt={`${displayName} profile`} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.8)' }} />
          <div style={{ minWidth: 0, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.T1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
            <div style={{ fontSize: 11, color: COLORS.T2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email || 'Community member'}</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1, padding: collapsed ? '8px 0' : '8px 0' }}>
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
                gap: collapsed ? 0 : 12,
                padding: collapsed ? '12px 8px' : '10px 14px',
                margin: collapsed ? '6px 6px' : '2px 6px',
                borderRadius: 10,
                cursor: 'pointer',
                background: isActive ? COLORS.PF : isHovered ? 'rgba(123, 58, 237, 0.08)' : 'transparent',
                color: isActive ? COLORS.P : COLORS.T2,
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                borderLeft: isActive ? `3px solid ${COLORS.P}` : '3px solid transparent',
                boxShadow: isHovered ? '0 8px 18px rgba(123, 58, 237, 0.12)' : 'none',
                transition: 'all 0.18s cubic-bezier(0.2,0.9,0.2,1)',
                transform: isHovered ? 'translateX(2px)' : 'translateX(0)',
                justifyContent: collapsed ? 'center' : 'flex-start',
              }}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
              title={item.label}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: collapsed ? 40 : 22, height: collapsed ? 40 : 22, flexShrink: 0, borderRadius: 8 }}>
                <div style={{ animation: isHovered ? 'scaleIcon 0.35s ease-out forwards' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={item.icon} size={collapsed ? 24 : 16} strokeWidth={collapsed ? 2.2 : 1.5} color={isActive ? COLORS.P : COLORS.T1} />
                </div>
              </div>
              {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 'auto', padding: collapsed ? '8px 6px' : '10px 12px 14px', borderTop: `1px solid ${COLORS.BD}`, position: 'sticky', bottom: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          onClick={() => {
            onLogout();
            onClose();
          }}
          style={{
            width: collapsed ? 44 : '100%',
            display: 'flex',
            alignItems: 'center',
            gap: collapsed ? 0 : 10,
            padding: collapsed ? '10px 8px' : '10px 12px',
            border: `1px solid rgba(185, 28, 28, 0.12)`,
            borderRadius: 10,
            background: collapsed ? '#fff' : 'linear-gradient(135deg, #fff7f7 0%, #fef2f2 100%)',
            color: '#B91C1C',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            boxShadow: '0 6px 16px rgba(185, 28, 28, 0.06)',
            justifyContent: 'center',
          }}
          title="Log out"
        >
          <Icon name="logout" size={16} color="#B91C1C" />
          {!collapsed && <span>Log out</span>}
        </button>
      </div>
    </div>
  );
}

export default Sidebar;
