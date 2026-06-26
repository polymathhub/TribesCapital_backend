import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LoadingScreen from './components/LoadingScreen';
import Sidebar from './components/Sidebar';
import { usersAPI } from './api/endpoints';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');

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
    setUser(userData);
    setIsAuthenticated(true);
    setCurrentPage('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userEmail');
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
