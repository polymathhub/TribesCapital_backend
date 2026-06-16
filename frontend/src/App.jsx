import React, { useState, useEffect, useRef } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import Sidebar from './components/Sidebar';
import LoadingScreen from './components/LoadingScreen';
import { usersAPI } from './api/endpoints';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [winW, setWinW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1280);
  const sidebarRef = useRef(null);

  useEffect(() => {
    const h = () => setWinW(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const isMobile = winW < 640;
  const isTablet = winW >= 640 && winW < 1024;

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');

        if (token && userEmail) {
          // Try to fetch user profile to verify token is still valid
          try {
            const profileRes = await usersAPI.getProfile();
            if (profileRes.data) {
              setUser({ 
                email: profileRes.data.email || userEmail, 
                name: profileRes.data.firstName || userName || userEmail.split('@')[0],
                ...profileRes.data
              });
              setIsAuthenticated(true);
            }
          } catch (err) {
            // Token might be expired or user profile endpoint not available
            // Still allow access if we have a token (backend will validate)
            setUser({ email: userEmail, name: userName || userEmail.split('@')[0] });
            setIsAuthenticated(true);
          }
        }
      } catch (err) {
        console.error('Auth check error:', err);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userName');
      } finally {
        setIsCheckingAuth(false);
        // Simulate brief loading screen
        setTimeout(() => setIsLoading(false), 1200);
      }
    };

    checkAuthentication();
  }, []);

  const handleLogin = () => {
    // Re-check authentication after login
    const token = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');
    const userName = localStorage.getItem('userName');
    
    if (token && userEmail) {
      setUser({ 
        email: userEmail, 
        name: userName || userEmail.split('@')[0],
      });
      setIsAuthenticated(true);
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('login');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  // Show loading screen while checking authentication
  if (isCheckingAuth || isLoading) {
    return <LoadingScreen isVisible={true} />;
  }

  if (!isAuthenticated) {
    return (
      <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
        <AuthPage onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn 0.6s ease-out', display: 'flex', height: '100vh', background: '#F9FAFB' }}>
      <Sidebar 
        sidebarRef={sidebarRef}
        currentPage={currentPage}
        onNavigate={(page) => {
          setCurrentPage(page);
          setSidebarOpen(false);
        }}
        onClose={() => setSidebarOpen(false)}
        isMobile={isMobile}
        isTablet={isTablet}
        isOpen={sidebarOpen}
      />
      <HomePage 
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        isMobile={isMobile}
        isTablet={isTablet}
      />
    </div>
  );
}

export default App;
