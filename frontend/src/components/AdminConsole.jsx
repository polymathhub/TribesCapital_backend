import React, { useEffect, useState } from 'react';
import HomePage from '../pages/HomePage';
import Sidebar from './Sidebar';

export default function AdminConsole({ user, onLogout, onUpdateUser }) {
  const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const [width, setWidth] = useState(initialWidth);
  const [currentPage, setCurrentPage] = useState('admin-dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(initialWidth >= 1024);

  const isMobile = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(true);
  };
  const handleToggleSidebar = () => setIsSidebarOpen((previous) => !previous);

  return (
    <div style={{ display: 'flex', width: '100%', minHeight: '100dvh', height: '100dvh', overflow: 'hidden', background: '#f9fafb' }}>
      <Sidebar
        user={user}
        activePage={currentPage}
        onNavigate={handleNavigate}
        onClose={handleToggleSidebar}
        onLogout={onLogout}
        collapsed={isDesktop && !isSidebarOpen}
        isOpen={isSidebarOpen}
        isOverlay={isMobile || isTablet}
      />
      <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        <HomePage
          user={user}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={onLogout}
          onToggleSidebar={handleToggleSidebar}
          onUpdateUser={onUpdateUser}
          isSidebarOpen={isSidebarOpen}
          isMobile={isMobile}
          isTablet={isTablet}
        />
      </div>
    </div>
  );
}
