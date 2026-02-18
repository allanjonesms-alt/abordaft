
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';
import TacticalLogo from '../components/TacticalLogo';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [matricula, setMatricula] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { data, error: dbError } = await supabase
        .from('usuarios_sgaft')
        .select('*')
        .eq('matricula', matricula.trim())
        .eq('senha', senha)
        .single();

      if (dbError || !data) {
        setError('Matrícula ou senha incorretos.');
      } else {
        const rawVal = data.primeiro_acesso;
        const normalizedPrimeiroAcesso = (
          rawVal === true || 
          rawVal === 'true' || 
          rawVal === 'TRUE' || 
          rawVal === 't' || 
          rawVal === 'T' || 
          rawVal === 1 ||
          rawVal === '1'
        );

        const rawRole = String(data.role || '').toUpperCase();
        const role = rawRole === 'ADMIN' ? UserRole.ADMIN : UserRole.OPERATOR;

        const loggedUser: User = {
          id: data.id,
          matricula: data.matricula,
          nome: data.nome || 'Operador',
          senha: data.senha,
          role: role,
          primeiro_acesso: normalizedPrimeiroAcesso
        };
        
        onLogin(loggedUser);
      }
    } catch (err) {
      console.error('Erro de Autenticação:', err);
      setError('Falha na comunicação com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col items-center mb-10">
            <TacticalLogo size="xl" className="mb-6 rotate-3" />
            <h1 className="text-4xl font-black text-white tracking-tighter">SGAFT</h1>
            <p className="text-slate-500 mt-2 font-black uppercase text-[10px] tracking-[0.3em]">Força Tática - Gestão Operacional</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                Matrícula
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <i className="fas fa-id-card"></i>
                </span>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-600 outline-none transition-all font-bold"
                  placeholder="ID Operacional"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-2">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white pl-12 pr-4 py-4 rounded-2xl focus:ring-2 focus:ring-yellow-600 outline-none transition-all font-bold"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 px-4 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-3">
                <i className="fas fa-exclamation-triangle"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-yellow-600/30 transition-all transform active:scale-95 flex items-center justify-center uppercase tracking-[0.2em] text-xs"
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-3"></i>
                  Acessar Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-slate-700 text-[9px] font-black uppercase tracking-[0.4em]">
              SGAFT V2.8 • CREATED BY ALLAN JONES
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
