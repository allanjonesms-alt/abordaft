
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { UserRole } from '../types';

interface AddUserModalProps {
  onClose: () => void;
  onSave: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState({
    matricula: '',
    nome: '',
    senha: '',
    role: UserRole.OPERATOR,
    ord: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      // 1. Lógica de Reordenamento (ord + 1)
      const { data: usersToShift, error: fetchError } = await supabase
        .from('usuarios_sgaft')
        .select('id, ord')
        .gte('ord', formData.ord);

      if (fetchError) throw fetchError;

      if (usersToShift && usersToShift.length > 0) {
        const updates = usersToShift.map(u => ({
          id: u.id,
          ord: (u.ord || 0) + 1
        }));

        const { error: shiftError } = await supabase
          .from('usuarios_sgaft')
          .upsert(updates);

        if (shiftError) throw shiftError;
      }

      // 2. Inserção do Novo Operador
      const { error: insertError } = await supabase
        .from('usuarios_sgaft')
        .insert([{
          matricula: formData.matricula.trim(),
          nome: formData.nome.toUpperCase(),
          senha: formData.senha,
          role: formData.role,
          ord: formData.ord,
          primeiro_acesso: false 
        }]);

      if (insertError) {
        if (insertError.code === '23505') throw new Error('Esta matrícula já está cadastrada.');
        throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error("Erro no cadastro:", err);
      setError(err.message || 'Erro ao processar cadastro e reordenamento.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white border border-gray-200 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-gray-100 p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
              <i className="fas fa-user-plus text-white"></i>
            </div>
            <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">Novo Operador</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Nome Completo</label>
            <input 
              type="text" 
              required
              className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all uppercase"
              placeholder="NOME DO POLICIAL"
              value={formData.nome}
              onChange={e => setFormData(prev => ({...prev, nome: e.target.value.toUpperCase()}))}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Matrícula</label>
              <input 
                type="text" 
                required
                className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                placeholder="ID"
                value={formData.matricula}
                onChange={e => setFormData(prev => ({...prev, matricula: e.target.value}))}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Posição na VTR (ORD)</label>
              <input 
                type="number" 
                className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                value={formData.ord}
                onChange={e => setFormData(prev => ({...prev, ord: parseInt(e.target.value) || 0}))}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Senha Inicial</label>
            <input 
              type="password" 
              required
              className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 outline-none transition-all"
              placeholder="••••••••"
              value={formData.senha}
              onChange={e => setFormData(prev => ({...prev, senha: e.target.value}))}
            />
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Perfil de Acesso</label>
            <select 
              className="w-full bg-gray-100 border border-gray-200 rounded-2xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 outline-none appearance-none"
              value={formData.role}
              onChange={e => setFormData(prev => ({...prev, role: e.target.value as UserRole}))}
            >
              <option value={UserRole.OPERATOR}>OPERADOR</option>
              <option value={UserRole.ADMIN}>ADMINISTRADOR</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center flex items-center justify-center gap-2">
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-black py-4 rounded-2xl uppercase text-[10px] transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl uppercase text-[10px] shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center"
            >
              {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
              {isSaving ? 'Processando...' : 'Cadastrar Operador'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
