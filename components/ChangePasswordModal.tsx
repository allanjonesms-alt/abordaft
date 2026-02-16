
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface ChangePasswordModalProps {
  user: User | null;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ user, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const validatePassword = (pass: string) => {
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const minLength = pass.length >= 8;
    return hasUpper && hasLower && hasNumber && minLength;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!validatePassword(newPassword)) {
      setError('A senha deve ter 8+ caracteres, maiúsculas, minúsculas e números.');
      return;
    }

    setIsSaving(true);

    try {
      const { data: userData, error: fetchError } = await supabase
        .from('usuarios_sgaft')
        .select('senha')
        .eq('id', user.id)
        .single();

      if (fetchError || userData.senha !== currentPassword) {
        setError('Senha atual incorreta.');
        setIsSaving(false);
        return;
      }

      const { error: updateError } = await supabase
        .from('usuarios_sgaft')
        .update({ senha: newPassword })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => onClose(), 2000);
    } catch (err: any) {
      setError('Erro operacional: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-yellow-600 p-2 rounded-lg">
              <i className="fas fa-key text-white"></i>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Alterar Senha</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {success ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-green-600/20 text-green-500 rounded-full flex items-center justify-center mx-auto border border-green-500/30">
                <i className="fas fa-check text-2xl"></i>
              </div>
              <p className="text-white font-black uppercase tracking-widest text-sm">Senha Atualizada!</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Senha Atual</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none font-bold"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>

              <div className="h-px bg-slate-700 my-2"></div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nova Senha</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none font-bold"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Confirmar Senha</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none font-bold"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                  Requisitos: 8+ caracteres, 1 maiúscula, 1 minúscula e 1 número.
                </p>
              </div>

              {error && (
                <div className="bg-red-600/10 border border-red-600/30 p-3 rounded-lg flex items-center gap-3 text-red-500 text-xs font-bold uppercase">
                  <i className="fas fa-exclamation-triangle"></i>
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-xl uppercase text-[10px] transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-xl uppercase text-[10px] shadow-lg shadow-yellow-600/20 transition-all flex items-center justify-center"
                >
                  {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                  {isSaving ? 'Gravando...' : 'Confirmar Troca'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
