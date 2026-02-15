
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // Pre-filled values for temporary editing purposes
  const [matricula, setMatricula] = useState('133613021');
  const [senha, setSenha] = useState('@Jones2028');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Consulta na tabela usuarios_sgaft filtrando por matricula e senha
      const { data, error: dbError } = await supabase
        .from('usuarios_sgaft')
        .select('*')
        .eq('matricula', matricula)
        .eq('senha', senha)
        .single();

      if (dbError || !data) {
        setError('Matrícula ou senha incorretos.');
      } else {
        // Mapeia o registro do banco para o tipo User do app
        const loggedUser: User = {
          id: data.id,
          matricula: data.matricula,
          nome: data.nome || 'Usuário Tático',
          senha: data.senha,
          role: data.role === 'admin' ? UserRole.ADMIN : UserRole.OPERATOR
        };
        onLogin(loggedUser);
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao conectar com o servidor.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('https://images.unsplash.com/photo-1541873676947-d6a2a4ad71e5?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center">
      <div className="absolute inset-0 bg-black opacity-75"></div>
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl backdrop-blur-sm bg-opacity-90">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-yellow-600 p-4 rounded-full mb-4 shadow-lg shadow-yellow-600/20">
              <i className="fas fa-shield-halved text-white text-4xl"></i>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">SGAFT</h1>
            <p className="text-slate-400 mt-1 font-medium">Força Tática - Sistema de Gestão</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Matrícula
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <i className="fas fa-id-badge"></i>
                </span>
                <input
                  type="text"
                  value={matricula}
                  onChange={(e) => setMatricula(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-yellow-600 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: 123456"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wider">
                Senha
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-yellow-600 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl text-sm font-medium flex items-center animate-pulse">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-xl shadow-lg shadow-yellow-600/30 transition-all transform active:scale-95 flex items-center justify-center uppercase tracking-widest"
            >
              {isLoading ? (
                <i className="fas fa-spinner fa-spin mr-2"></i>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Acessar Sistema
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center space-y-1">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              VERSÃO 2.0
            </p>
            <p className="text-slate-600 text-[9px] font-bold uppercase tracking-tighter">
              CREATED BY SGT JONES
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
