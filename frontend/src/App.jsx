import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import LoadingScreen from './components/LoadingScreen';
import TribesCapitalResponsive from './TribesCapitalResponsive.jsx';
import { usersAPI } from './api/endpoints';
import { clearAuthSession } from './utils/authSession';
import './App.css';

const omitEmbeddedProfileImages = (user) => ({
  ...user,
  ...(typeof user?.avatar === 'string' && user.avatar.startsWith('data:') ? { avatar: '' } : {}),
  ...(typeof user?.coverPhoto === 'string' && user.coverPhoto.startsWith('data:') ? { coverPhoto: '' } : {}),
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window === 'undefined') return false;

    const token = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');
    return Boolean(token || import.meta.env.DEV);
  });
  const [user, setUser] = useState(() => {
    if (typeof window === 'undefined') return null;

    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        return omitEmbeddedProfileImages(JSON.parse(storedUser));
      }
    } catch {
    // this is to ignore invalid stored data
    }

    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      return { email: userEmail, name: userEmail.split('@')[0] };
    }

    return null;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasBootstrapped, setHasBootstrapped] = useState(false);

  useEffect(() => {
    const handleAuthLogout = () => {
      clearAuthSession();
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      setHasBootstrapped(true);
    };

    window.addEventListener('auth:logout', handleAuthLogout);
    return () => window.removeEventListener('auth:logout', handleAuthLogout);
  }, []);

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
    }, 5000);

    const loadSession = async () => {
      try {
        if (token) {
          const profileRequest = usersAPI.getProfile();
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Session check timed out')), 3500);
          });

          const response = await Promise.race([profileRequest, timeoutPromise]);
          const profile = response?.data?.data ?? response?.data ?? {};
          const nextUser = {
            ...profile,
            email: profile.email || userEmail || '',
            name: profile.displayName || profile.name || profile.firstName || profile.email?.split('@')[0] || userEmail?.split('@')[0] || 'there',
          };
          setUser(nextUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          clearAuthSession();
          setUser(null);
          setIsAuthenticated(false);
          return;
        }
        console.warn('Session bootstrap failed:', error);
        if (token && userEmail) {
          setUser({ email: userEmail, name: userEmail.split('@')[0] });
          setIsAuthenticated(true);
        }
      } finally {
        clearTimeout(fallbackTimer);
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
    const normalizedUser = omitEmbeddedProfileImages({
      ...userData,
      name: userData.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email?.split('@')[0] || 'there',
    });

    localStorage.setItem('user', JSON.stringify(normalizedUser));
    localStorage.setItem('userEmail', normalizedUser.email);
    localStorage.setItem('userName', normalizedUser.firstName || normalizedUser.name || normalizedUser.email?.split('@')[0] || 'there');
    setUser(normalizedUser);
    setIsAuthenticated(true);
    try {
      window.dispatchEvent(new CustomEvent('tribes:notifications-update', { detail: { type: 'announcement-updated' } }));
    } catch (error) {
      console.warn('Failed to notify notifications after sign-in:', error);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleUpdateUser = (updatedUser) => {
    setUser((currentUser) => {
      const nextUser = {
        ...currentUser,
        ...omitEmbeddedProfileImages(updatedUser),
        name: updatedUser.displayName || updatedUser.name || `${updatedUser.firstName || currentUser?.firstName || ''} ${updatedUser.lastName || currentUser?.lastName || ''}`.trim() || currentUser?.email?.split('@')[0] || 'Member',
      };
      try {
        localStorage.setItem('user', JSON.stringify(nextUser));
      } catch {
        // Ignore storage failures; the in-memory profile remains updated.
      }
      return nextUser;
    });
  };

  if (isLoading || !hasBootstrapped) {
    return <LoadingScreen isVisible />;
  }

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
      <div style={{ animation: isLoading ? 'none' : 'fadeIn 0.6s ease-out' }}>
        <TribesCapitalResponsive initialScreen="dashboard" user={user} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
      </div>
    </>
  );
}

export default App;
