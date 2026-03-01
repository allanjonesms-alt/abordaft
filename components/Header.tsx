
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole, Shift } from '../types';
import { supabase } from '../lib/supabase';
import ChangePasswordModal from './ChangePasswordModal';
import StartShiftModal from './StartShiftModal';
import TacticalLogo from './TacticalLogo';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [isStartShiftModalOpen, setIsStartShiftModalOpen] = useState(false);
  const [showEndShiftConfirm, setShowEndShiftConfirm] = useState(false);

  const [isEndingShift, setIsEndingShift] = useState(false);

  const fetchActiveShift = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('servicos_vtr')
        .select('*')
        .eq('status', 'ATIVO')
        .order('horario_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar serviço ativo:', error);
      } else {
        setActiveShift(data);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar serviço:', err);
    }
  }, []);

  useEffect(() => {
    fetchActiveShift();
    const interval = setInterval(fetchActiveShift, 30000);
    return () => clearInterval(interval);
  }, [fetchActiveShift]);

  const handleEndShift = async () => {
    if (!activeShift || isEndingShift) return;
    
    setIsEndingShift(true);
    try {
      console.log('Iniciando encerramento global de serviços ativos...');
      
      const { error, data } = await supabase
        .from('servicos_vtr')
        .update({
          status: 'ENCERRADO',
          horario_fim: new Date().toISOString(),
          encerrado_por_nome: user?.nome || 'Sistema (Manual)'
        })
        .eq('status', 'ATIVO')
        .select();

      if (error) {
        console.error('Erro crítico no Supabase ao encerrar:', error);
        throw error;
      }

      console.log('Serviços encerrados:', data);
      setActiveShift(null);
      setShowEndShiftConfirm(false);
      
      // Recarrega para garantir sincronismo total
      window.location.reload();
    } catch (err: any) {
      console.error('Falha operacional ao encerrar serviço:', err);
      alert('ERRO OPERACIONAL: Não foi possível encerrar o serviço.\nDetalhes: ' + (err.message || 'Sem resposta do servidor.'));
    } finally {
      setIsEndingShift(false);
    }
  };

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
              <TacticalLogo size="md" className="group-hover:scale-110 transition-transform" />
              <h1 className="text-2xl font-black tracking-tighter text-white">SGAFT</h1>
            </Link>
          </div>

          <div className="flex items-center space-x-2 md:space-x-4">
            {activeShift ? (
              <div className="flex items-center bg-slate-900 rounded-xl border border-slate-700 px-3 py-1.5 gap-3">
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-[8px] font-black text-green-500 uppercase tracking-widest animate-pulse">Serviço Ativo</span>
                  <span className="text-[10px] font-bold text-white uppercase">CMD: {activeShift.comandante}</span>
                </div>
                <button 
                  onClick={() => setShowEndShiftConfirm(true)}
                  disabled={isEndingShift}
                  className={`${isEndingShift ? 'bg-slate-700' : 'bg-red-600 hover:bg-red-500'} text-white w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all active:scale-95`}
                  title="Encerrar Serviço"
                >
                  {isEndingShift ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-square"></i>
                  )}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsStartShiftModalOpen(true)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <i className="fas fa-play"></i>
                <span className="hidden sm:inline">Iniciar</span>
              </button>
            )}

            <div className="h-8 w-px bg-slate-700 mx-1"></div>

            <Link 
              to="/" 
              className={`p-2 rounded-lg transition-all flex items-center justify-center ${isHome ? 'bg-yellow-600/20 text-yellow-500' : 'text-gray-400 hover:bg-slate-700 hover:text-white'}`}
            >
              <i className="fas fa-home text-lg"></i>
            </Link>

            {user?.role === UserRole.ADMIN && (
              <Link 
                to="/configuracoes" 
                className={`p-2 rounded-lg transition-all flex items-center justify-center ${location.pathname === '/configuracoes' ? 'bg-yellow-600/20 text-yellow-500' : 'text-gray-400 hover:bg-slate-700 hover:text-white'}`}
              >
                <i className="fas fa-cog text-lg"></i>
              </Link>
            )}

            <button 
              onClick={onLogout}
              className="flex items-center space-x-2 bg-slate-900 border border-slate-700 hover:bg-slate-700 text-white px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all active:scale-95"
            >
              <i className="fas fa-sign-out-alt text-red-500"></i>
            </button>
          </div>
        </div>
      </header>

      {isStartShiftModalOpen && (
        <StartShiftModal 
          user={user} 
          onClose={() => setIsStartShiftModalOpen(false)} 
          onStarted={fetchActiveShift} 
        />
      )}

      {isPasswordModalOpen && (
        <ChangePasswordModal 
          user={user} 
          onClose={() => setIsPasswordModalOpen(false)} 
        />
      )}

      {showEndShiftConfirm && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center">
              <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                <i className="fas fa-exclamation-triangle text-red-500 text-3xl"></i>
              </div>
              <h3 className="text-white font-black uppercase tracking-tighter text-xl mb-4">Encerrar Serviço?</h3>
              <p className="text-slate-400 text-xs font-bold uppercase leading-relaxed mb-8">
                Esta ação registrará o horário de término para toda a guarnição e liberará o terminal para novos serviços.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleEndShift}
                  disabled={isEndingShift}
                  className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 rounded-2xl uppercase text-xs shadow-xl shadow-red-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isEndingShift ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check"></i>}
                  {isEndingShift ? 'Processando...' : 'Sim, Encerrar Agora'}
                </button>
                <button 
                  onClick={() => setShowEndShiftConfirm(false)}
                  disabled={isEndingShift}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl uppercase text-xs transition-all active:scale-95"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
