
import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types';

interface StartShiftModalProps {
  user: User | null;
  onClose: () => void;
  onStarted: () => void;
}

const StartShiftModal: React.FC<StartShiftModalProps> = ({ user, onClose, onStarted }) => {
  const [formData, setFormData] = useState({
    comandante: '',
    motorista: '',
    patrulheiro_1: '',
    patrulheiro_2: '',
    placa_vtr: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comandante || !formData.motorista || !formData.placa_vtr) {
      return alert('Preencha os campos obrigatórios (Comandante, Motorista e VTR).');
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('servicos_vtr').insert([{
        ...formData,
        criado_por: user?.id,
        status: 'ATIVO',
        horario_inicio: new Date().toISOString()
      }]);

      if (error) throw error;
      onStarted();
      onClose();
    } catch (err: any) {
      alert('Erro ao iniciar serviço: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-green-600 p-2 rounded-lg shadow-lg shadow-green-600/20">
              <i className="fas fa-play text-white"></i>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter">Iniciar Serviço</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Comandante da VTR *</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-green-600 outline-none"
                placeholder="Ex: SGT PM J. SILVA"
                value={formData.comandante}
                onChange={e => setFormData({...formData, comandante: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Motorista *</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-green-600 outline-none"
                placeholder="Ex: CB PM ALVES"
                value={formData.motorista}
                onChange={e => setFormData({...formData, motorista: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Viatura (Placa/Prefixo) *</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-green-600 outline-none"
                placeholder="Ex: FT-01 / PLACA-1234"
                value={formData.placa_vtr}
                onChange={e => setFormData({...formData, placa_vtr: e.target.value.toUpperCase()})}
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Patrulheiro 1</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-green-600 outline-none"
                value={formData.patrulheiro_1}
                onChange={e => setFormData({...formData, patrulheiro_1: e.target.value.toUpperCase()})}
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Patrulheiro 2</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-green-600 outline-none"
                value={formData.patrulheiro_2}
                onChange={e => setFormData({...formData, patrulheiro_2: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-xs">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-[2] bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl uppercase text-xs shadow-xl shadow-green-600/20">
              {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Sincronizar Início de Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartShiftModal;
