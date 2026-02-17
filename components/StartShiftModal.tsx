
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, UserRole } from '../types';

interface StartShiftModalProps {
  user: User | null;
  onClose: () => void;
  onStarted: () => void;
}

const PersonnelSelect: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  operators: User[];
  required?: boolean;
  placeholder?: string;
}> = ({ label, value, onChange, operators, required, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOperators = operators.filter(op =>
    op.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    op.matricula.includes(searchTerm)
  );

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
        {label} {required && '*'}
      </label>
      <div className="relative">
        <input
          type="text"
          className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-green-600 outline-none pr-10"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value.toUpperCase());
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          required={required}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none">
          <i className={`fas ${isOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-xs`}></i>
        </div>
      </div>

      {isOpen && filteredOperators.length > 0 && (
        <div className="absolute z-[210] w-full mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar overflow-x-hidden">
          {filteredOperators.map((op) => (
            <button
              key={op.id}
              type="button"
              className="w-full text-left px-4 py-3 hover:bg-slate-800 flex flex-col transition-colors border-b border-slate-800 last:border-0"
              onClick={() => {
                onChange(op.nome.toUpperCase());
                setSearchTerm('');
                setIsOpen(false);
              }}
            >
              <span className="text-white text-xs font-black uppercase">{op.nome}</span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Matrícula: {op.matricula}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const StartShiftModal: React.FC<StartShiftModalProps> = ({ user, onClose, onStarted }) => {
  const [formData, setFormData] = useState({
    comandante: '',
    motorista: '',
    patrulheiro_1: '',
    patrulheiro_2: '',
    placa_vtr: ''
  });
  const [allOperators, setAllOperators] = useState<User[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchOperators = async () => {
      const { data } = await supabase
        .from('usuarios_sgaft')
        .select('*')
        .order('nome', { ascending: true });
      if (data) setAllOperators(data as User[]);
    };
    fetchOperators();
  }, []);

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
              <PersonnelSelect
                label="Comandante da VTR"
                placeholder="Busque pelo nome ou matrícula..."
                value={formData.comandante}
                onChange={(val) => setFormData({ ...formData, comandante: val })}
                operators={allOperators}
                required
              />
            </div>
            <div className="md:col-span-2">
              <PersonnelSelect
                label="Motorista"
                placeholder="Busque pelo nome ou matrícula..."
                value={formData.motorista}
                onChange={(val) => setFormData({ ...formData, motorista: val })}
                operators={allOperators}
                required
              />
            </div>
            <div className="md:col-span-2">
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
              <PersonnelSelect
                label="Patrulheiro 1"
                placeholder="Nome..."
                value={formData.patrulheiro_1}
                onChange={(val) => setFormData({ ...formData, patrulheiro_1: val })}
                operators={allOperators}
              />
            </div>
            <div>
              <PersonnelSelect
                label="Patrulheiro 2"
                placeholder="Nome..."
                value={formData.patrulheiro_2}
                onChange={(val) => setFormData({ ...formData, patrulheiro_2: val })}
                operators={allOperators}
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-xs transition-colors hover:bg-slate-600">Cancelar</button>
            <button type="submit" disabled={isSaving} className="flex-[2] bg-green-600 hover:bg-green-500 text-white font-black py-4 rounded-2xl uppercase text-xs shadow-xl shadow-green-600/20 transition-all active:scale-95">
              {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Sincronizar Início de Turno'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StartShiftModal;
