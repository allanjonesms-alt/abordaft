
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole } from '../types';
import ChangePasswordModal from './ChangePasswordModal';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const handleBack = () => {
    if (location.pathname !== '/') {
      navigate(-1);
    }
  };

  const isHome = location.pathname === '/';

  return (
    <>
      <header className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-50 shadow-lg">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleBack}
              className={`p-2 hover:bg-slate-700 rounded-full transition-all ${isHome ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
              disabled={isHome}
            >
              <i className="fas fa-arrow-left text-xl text-gray-300"></i>
            </button>
            
            <Link to="/" className="flex items-center space-x-2 group">
              <div className="bg-yellow-600 p-1.5 rounded-md group-hover:bg-yellow-500 transition-colors">
                <i className="fas fa-shield-halved text-white text-xl"></i>
              </div>
              <h1 className="text-2xl font-black tracking-tighter text-white">SGAFT</h1>
            </Link>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            <Link 
              to="/" 
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${isHome ? 'bg-yellow-600/20 text-yellow-500' : 'text-gray-400 hover:bg-slate-700 hover:text-white'}`}
              title="Página Inicial"
            >
              <i className="fas fa-home text-lg"></i>
            </Link>

            {/* Engrenagem: Link para Admin, Modal para Operador */}
            {user?.role === UserRole.ADMIN ? (
              <Link 
                to="/configuracoes" 
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${location.pathname === '/configuracoes' ? 'bg-yellow-600/20 text-yellow-500' : 'text-gray-400 hover:bg-slate-700 hover:text-white'}`}
                title="Configurações do Sistema"
              >
                <i className="fas fa-cog text-lg"></i>
              </Link>
            ) : (
              <button 
                onClick={() => setIsPasswordModalOpen(true)}
                className="p-2 rounded-lg transition-all flex items-center justify-center text-gray-400 hover:bg-slate-700 hover:text-white"
                title="Minha Conta / Senha"
              >
                <i className="fas fa-cog text-lg"></i>
              </button>
            )}

            <div className="h-8 w-px bg-slate-700 mx-1"></div>

            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1">
                {user?.role === UserRole.ADMIN ? 'ADMINISTRADOR' : 'OPERADOR'}
              </span>
              <span className="text-sm text-white font-black truncate max-w-[150px]">{user?.nome}</span>
            </div>

            <button 
              onClick={onLogout}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {isPasswordModalOpen && (
        <ChangePasswordModal 
          user={user} 
          onClose={() => setIsPasswordModalOpen(false)} 
        />
      )}
    </>
  );
};

export default Header;
