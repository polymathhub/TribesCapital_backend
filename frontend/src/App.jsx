import React, { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import LoadingScreen from './components/LoadingScreen';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userEmail = localStorage.getItem('userEmail');
    
    // Simulate loading time (2.5 seconds total)
    const timer = setTimeout(() => {
      if (token && userEmail) {
        setIsAuthenticated(true);
        setUser({ email: userEmail, name: userEmail.split('@')[0] });
      }
      setIsLoading(false);
    }, 2500);
    
    return () => clearTimeout(timer);
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
  };


  if (!isAuthenticated) {
    return (
      <>
        <LoadingScreen isVisible={isLoading} />
        <div style={{ animation: isLoading ? 'none' : 'fadeIn 0.6s ease-out' }}>
          <AuthPage onLogin={handleLogin} />
        </div>
      </>
    );
  }

  return (
    <>
      <LoadingScreen isVisible={isLoading} />
      <div style={{ animation: isLoading ? 'none' : 'fadeIn 0.6s ease-out' }}>
        <HomePage 
          user={user}
          currentPage={currentPage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
        />
      </div>
    </>
  );
}

export default App;
