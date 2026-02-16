
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { User, AuthState } from '../types';
import { STORAGE_KEYS } from '../constants';

interface FirstAccessProps {
  user: User;
  onPasswordChanged: (updatedUser: User) => void;
}

const FirstAccess: React.FC<FirstAccessProps> = ({ user, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const minLength = pass.length >= 8;
    return { hasUpper, hasLower, hasNumber, minLength };
  };

  const status = validatePassword(newPassword);
  const isValid = status.hasUpper && status.hasLower && status.hasNumber && status.minLength && newPassword === confirmPassword;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setIsSaving(true);
    setError('');

    try {
      const { error: updateError } = await supabase
        .from('usuarios_sgaft')
        .update({ 
          senha: newPassword,
          primeiro_acesso: false 
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      const updatedUser: User = { ...user, primeiro_acesso: false, senha: newPassword };
      onPasswordChanged(updatedUser);
    } catch (err: any) {
      setError('Erro ao atualizar credenciais: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <div className="bg-yellow-600 p-8 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/30">
            <i className="fas fa-user-shield text-white text-4xl"></i>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Primeiro Acesso</h2>
          <p className="text-yellow-100 text-[10px] font-bold uppercase tracking-widest mt-2">Segurança Obrigatória da Força Tática</p>
        </div>

        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          <p className="text-slate-400 text-xs text-center leading-relaxed">
            Sua conta está utilizando uma senha temporária. Por questões de segurança operacional, você deve definir uma nova senha agora.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nova Senha Tática</label>
              <input 
                type="password"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-4 text-white font-bold focus:ring-2 focus:ring-yellow-600 outline-none transition-all"
                placeholder="Mínimo 8 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Confirmar Senha</label>
              <input 
                type="password"
                className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-4 py-4 text-white font-bold focus:ring-2 focus:ring-yellow-600 outline-none transition-all"
                placeholder="Repita a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 space-y-2">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Requisitos de Segurança:</h4>
            <div className="grid grid-cols-2 gap-2">
              <RequirementItem label="8+ Caracteres" met={status.minLength} />
              <RequirementItem label="Letra Maiúscula" met={status.hasUpper} />
              <RequirementItem label="Letra Minúscula" met={status.hasLower} />
              <RequirementItem label="Número" met={status.hasNumber} />
            </div>
            <div className="pt-2">
              <RequirementItem label="Senhas Coincidem" met={newPassword !== '' && newPassword === confirmPassword} />
            </div>
          </div>

          {error && (
            <div className="bg-red-600/10 border border-red-600/30 p-3 rounded-xl text-red-500 text-[10px] font-black uppercase text-center">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={!isValid || isSaving}
            className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm transition-all shadow-xl flex items-center justify-center ${
              isValid ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-lock-open mr-3"></i>}
            {isSaving ? 'Sincronizando...' : 'Ativar Acesso Pleno'}
          </button>
        </form>
      </div>
    </div>
  );
};

const RequirementItem: React.FC<{ label: string; met: boolean }> = ({ label, met }) => (
  <div className="flex items-center space-x-2">
    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${met ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-600'}`}>
      <i className={`fas ${met ? 'fa-check' : 'fa-circle'}`}></i>
    </div>
    <span className={`text-[9px] font-bold uppercase ${met ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
  </div>
);

export default FirstAccess;
