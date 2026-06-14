import React, { useState } from 'react';

const MobileNav = ({ isOpen, onClose, currentPage, onNavigate, user, onLogout }) => {
  const NAV_ITEMS = [
    { label: 'Home', key: 'home' },
    { label: 'Learning Hub', key: 'learning' },
    { label: 'Due Diligence Vault', key: 'vault' },
    { label: 'Office Hours & Events', key: 'events' },
  ];

  const handleNavClick = (key) => {
    onNavigate(key);
    onClose();
  };

  return (
    <>
      {/* Mobile Navigation Overlay */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 340,
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            animation: 'fadeIn 0.3s ease-out',
          }}
          onClick={onClose}
        />
      )}

      {/* Mobile Navigation Drawer */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '80vw',
          background: '#FFFFFF',
          borderRight: '1px solid #E5E7EB',
          zIndex: 350,
          display: 'flex',
          flexDirection: 'column',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isOpen ? '4px 0 24px rgba(0, 0, 0, 0.15)' : 'none',
          overflowY: 'auto',
        }}
      >
        {/* Mobile Nav Header with Branding */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #E5E7EB',
            flexShrink: 0,
            background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
          }}
        >
          {/* Logo and branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
              }}
            >
              T
            </div>
            <div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#111827',
                  letterSpacing: '0.5px',
                }}
              >
                Tribes Capital
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: '#9CA3AF',
                  fontWeight: 400,
                  marginTop: '2px',
                }}
              >
                Clean Energy
              </div>
            </div>
          </div>

          {/* User Info Section */}
          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: 'rgba(236, 233, 254, 0.5)',
                borderRadius: '8px',
                backdropFilter: 'blur(4px)',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #5B21B6 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  fontSize: '12px',
                }}
              >
                {user?.email?.[0]?.toUpperCase() || 'A'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.name || user?.email?.split('@')[0]}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: '#9CA3AF',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user?.email}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Nav Items */}
        <nav
          style={{
            flex: 1,
            padding: '8px 0',
            overflowY: 'auto',
          }}
        >
          {NAV_ITEMS.map((item, index) => (
            <button
              key={index}
              onClick={() => handleNavClick(item.key)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                margin: '4px 0',
                background:
                  currentPage === item.key
                    ? '#EDE9FE'
                    : 'transparent',
                color:
                  currentPage === item.key
                    ? '#5B21B6'
                    : '#6B7280',
                border: 'none',
                borderLeft:
                  currentPage === item.key
                    ? '3px solid #5B21B6'
                    : '3px solid transparent',
                borderRadius: '0',
                fontSize: '14px',
                fontWeight: currentPage === item.key ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'left',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (currentPage !== item.key) {
                  e.target.style.background = '#F3F4F6';
                }
              }}
              onMouseLeave={(e) => {
                if (currentPage !== item.key) {
                  e.target.style.background = 'transparent';
                }
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Mobile Nav Footer */}
        <div
          style={{
            borderTop: '1px solid #E5E7EB',
            padding: '12px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            background: 'linear-gradient(180deg, transparent 0%, rgba(249, 250, 251, 0.5) 100%)',
          }}
        >
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #DC2626 0%, #991B1B 100%)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(220, 38, 38, 0.25)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(220, 38, 38, 0.15)';
            }}
          >
            Log out
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default MobileNav;
