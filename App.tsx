
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthState, User } from './types';
import { STORAGE_KEYS } from './constants';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import NewApproach from './pages/NewApproach';
import ApproachesList from './pages/ApproachesList';
import IndividualsList from './pages/IndividualsList';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';
import FirstAccess from './pages/FirstAccess';

const App: React.FC = () => {
  const [auth, setAuth] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
  });
  const navigate = useNavigate();

  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedAuth) {
      try {
        const parsed = JSON.parse(savedAuth);
        setAuth(parsed);
      } catch (e) {
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }
    }
  }, []);

  const handleLogin = (user: User) => {
    const newAuth = { user, isAuthenticated: true };
    setAuth(newAuth);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newAuth));
    // Redirecionamento explícito e imediato para a Home (Dashboard)
    navigate('/', { replace: true });
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    navigate('/', { replace: true });
  };

  const handlePasswordChanged = (updatedUser: User) => {
    const newAuth = { user: updatedUser, isAuthenticated: true };
    setAuth(newAuth);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newAuth));
    navigate('/', { replace: true });
  };

  if (!auth.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (auth.user?.primeiro_acesso === false) {
    return <FirstAccess user={auth.user} onPasswordChanged={handlePasswordChanged} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-900">
      <Header user={auth.user} onLogout={handleLogout} />
      <main className="flex-1 container mx-auto p-4 md:p-6 pb-24">
        <Routes>
          <Route path="/" element={<Dashboard user={auth.user} />} />
          <Route path="/nova-abordagem" element={<NewApproach user={auth.user} />} />
          <Route path="/abordagens" element={<ApproachesList />} />
          <Route path="/individuos" element={<IndividualsList user={auth.user} />} />
          <Route path="/galeria" element={<Gallery />} />
          <Route path="/configuracoes" element={<Settings user={auth.user} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
