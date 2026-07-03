import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import { usersAPI } from './api/endpoints';
import { persistDemoSession, clearAuthSession } from './utils/authSession';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');
    return Boolean(token || userEmail || import.meta.env.DEV);
  });
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return JSON.parse(storedUser);
      }
    } catch {
      // Ignore invalid stored user data and fall back to email-based defaults.
    }

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      return { email: userEmail, name: userEmail.split('@')[0] };
    }

    return null;
  });
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');

    if (import.meta.env.DEV && !token && !userEmail) {
      const demoSession = persistDemoSession();
      setUser(demoSession.user);
      setIsAuthenticated(true);
      setCurrentPage('home');
      setIsLoading(false);
      setHasBootstrapped(true);
      return;
    }

    const finishBootstrap = () => {
      setIsLoading(false);
      setHasBootstrapped(true);
    };

    const fallbackTimer = setTimeout(() => {
      console.warn('Session bootstrap timed out; continuing with the app shell.');
      finishBootstrap();
    }, 2500);

    const loadSession = async () => {
      try {
        if (token) {
          const profileRequest = usersAPI.getProfile();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Session check timed out')), 3500);
          });

          const response = await Promise.race([profileRequest, timeoutPromise]);
          const profile = response?.data || {};
          setUser({
            ...profile,
            email: profile.email || userEmail || '',
            name: profile.name || profile.firstName || profile.email?.split('@')[0] || userEmail?.split('@')[0] || 'there',
          });
          setIsAuthenticated(true);
        } else if (userEmail) {
          setUser({ email: userEmail, name: userEmail.split('@')[0] });
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn('Session bootstrap failed:', error);
        if (userEmail) {
          setUser({ email: userEmail, name: userEmail.split('@')[0] });
          setIsAuthenticated(true);
        }
      } finally {
        finishBootstrap();
      }
    };

    const timer = setTimeout(() => {
      void loadSession();
    }, 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleLogin = (userData) => {
    const normalizedUser = {
      ...userData,
      name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || 'there',
    };

    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('userEmail', normalizedUser.email);
    localStorage.setItem('userName', normalizedUser.firstName || normalizedUser.name || normalizedUser.email?.split('@')[0] || 'there');
    setUser(normalizedUser);
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setUser(null);
    setCurrentPage('login');
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
    setIsSidebarOpen(true);
  };

  const handleToggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoadingScreen isVisible={isLoading && !hasBootstrapped} />
        <div style={{ animation: isLoading ? 'none' : 'fadeIn 0.6s ease-out' }}>
          <AuthPage onLogin={handleLogin} />
        </div>
      </>
    );
  }

  return (
    <>
      <LoadingScreen isVisible={isLoading && !hasBootstrapped} />
      <div style={{ animation: isLoading ? 'none' : 'fadeIn 0.6s ease-out', display: 'flex', width: '100%', height: '100vh', overflow: 'hidden', background: '#f9fafb' }}>
        {isSidebarOpen && (
          <Sidebar activePage={currentPage} onNavigate={handleNavigate} onClose={handleToggleSidebar} onLogout={handleLogout} />
        )}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <HomePage 
            user={user}
            currentPage={currentPage}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            onToggleSidebar={handleToggleSidebar}
            isSidebarOpen={isSidebarOpen}
          />
        </div>
      </div>
    </>
  );
}

export default App;
