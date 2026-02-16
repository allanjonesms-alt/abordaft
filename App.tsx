
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

  useEffect(() => {
    const savedAuth = localStorage.getItem(STORAGE_KEYS.AUTH);
    if (savedAuth) {
      setAuth(JSON.parse(savedAuth));
    }
  }, []);

  const handleLogin = (user: User) => {
    const newAuth = { user, isAuthenticated: true };
    setAuth(newAuth);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newAuth));
  };

  const handleLogout = () => {
    setAuth({ user: null, isAuthenticated: false });
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  };

  const handlePasswordChanged = (updatedUser: User) => {
    const newAuth = { user: updatedUser, isAuthenticated: true };
    setAuth(newAuth);
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newAuth));
  };

  if (!auth.isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  // Se for o primeiro acesso, força a tela de troca de senha
  if (auth.user?.primeiro_acesso) {
    return <FirstAccess user={auth.user} onPasswordChanged={handlePasswordChanged} />;
  }

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-900">
        <Header user={auth.user} onLogout={handleLogout} />
        <main className="flex-1 container mx-auto p-4 md:p-6 pb-24">
          <Routes>
            <Route path="/" element={<Dashboard user={auth.user} />} />
            <Route path="/nova-abordagem" element={<NewApproach />} />
            <Route path="/abordagens" element={<ApproachesList />} />
            <Route path="/individuos" element={<IndividualsList user={auth.user} />} />
            <Route path="/galeria" element={<Gallery />} />
            <Route path="/configuracoes" element={<Settings user={auth.user} />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
