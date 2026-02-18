
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Shift } from '../types';

interface StartShiftModalProps {
  user: User | null;
  onClose: () => void;
  onStarted: () => void;
}

interface SeatAssignment {
  comandante: string;
  motorista: string;
  patrulheiro_1: string;
  patrulheiro_2: string;
}

const ViaturaDiagram = ({ assignments, onDrop }: { assignments: SeatAssignment, onDrop: (role: keyof SeatAssignment, name: string) => void }) => {
  const [dragOver, setDragOver] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, role: string) => {
    e.preventDefault();
    setDragOver(role);
  };

  const handleDragLeave = () => {
    setDragOver(null);
  };

  const handleDrop = (e: React.DragEvent, role: keyof SeatAssignment) => {
    e.preventDefault();
    const name = e.dataTransfer.getData('operatorName');
    if (name) {
      onDrop(role, name);
    }
    setDragOver(null);
  };

  const renderSeat = (role: keyof SeatAssignment, label: string, x: string, y: string) => {
    const isOccupied = !!assignments[role];
    const isOver = dragOver === role;

    return (
      <div 
        className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center p-1.5 rounded-xl transition-all duration-300 border-2 border-dashed
          ${isOver ? 'bg-green-600/30 border-green-500 scale-105' : isOccupied ? 'bg-slate-900/90 border-slate-600 shadow-lg' : 'bg-slate-800/20 border-slate-700/50'}
        `}
        style={{ left: x, top: y, width: '100px', height: '64px' }}
        onDragOver={(e) => handleDragOver(e, role)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, role)}
      >
        <div className={`flex items-center gap-1.5 mb-0.5 ${isOccupied ? 'text-green-500' : 'text-slate-600'}`}>
          <i className={`fas ${isOccupied ? 'fa-user-ninja' : 'fa-user-plus'} text-xs`}></i>
          <span className="text-[7px] font-black uppercase tracking-tighter">{label}</span>
        </div>
        <div className="text-center w-full px-1">
          {isOccupied ? (
            <span className="text-[9px] font-black text-white uppercase leading-none block truncate">{assignments[role]}</span>
          ) : (
            <span className="text-[7px] font-bold text-slate-700 uppercase italic leading-none">Vazio</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full aspect-[2/3] max-w-[240px] mx-auto scale-110">
      {/* VTR VECTOR - TOP VIEW */}
      <svg viewBox="0 0 400 600" className="w-full h-full text-slate-400 drop-shadow-[0_0_20px_rgba(0,0,0,0.5)]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="carBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{ stopColor: '#1e293b', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#0f172a', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1e293b', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        
        {/* Chassis Bold Outer line */}
        <path 
          d="M100,60 Q100,30 200,30 Q300,30 300,60 L330,520 Q330,570 200,570 Q70,570 70,520 Z" 
          fill="url(#carBody)" 
          stroke="#334155" 
          strokeWidth="10" 
        />
        
        {/* Detail Inner lines */}
        <path d="M90,70 Q90,50 200,50 Q310,50 310,70 L320,510 Q320,550 200,550 Q80,550 80,510 Z" fill="none" stroke="#f8fafc" strokeWidth="2" opacity="0.4" />
        
        {/* Roof line */}
        <rect x="105" y="180" width="190" height="260" rx="30" fill="none" stroke="#f8fafc" strokeWidth="6" />
        
        {/* Front Glass */}
        <path d="M110,170 Q200,140 290,170" fill="none" stroke="#f8fafc" strokeWidth="6" />
        
        {/* Back Glass */}
        <path d="M120,450 Q200,470 280,450" fill="none" stroke="#f8fafc" strokeWidth="6" />

        {/* Siren Bar */}
        <rect x="130" y="240" width="140" height="18" rx="4" fill="#1e293b" />
        <rect x="135" y="243" width="60" height="12" rx="2" fill="#ef4444" />
        <rect x="205" y="243" width="60" height="12" rx="2" fill="#3b82f6" />
      </svg>

      {/* SEATS DROP ZONES - Positioned relative to car diagram */}
      {renderSeat('motorista', 'Motorista', '26%', '35%')}
      {renderSeat('comandante', 'Comandante', '74%', '35%')}
      {renderSeat('patrulheiro_1', 'Patrulheiro 1', '26%', '65%')}
      {renderSeat('patrulheiro_2', 'Patrulheiro 2', '74%', '65%')}
    </div>
  );
};

const StartShiftModal: React.FC<StartShiftModalProps> = ({ user, onClose, onStarted }) => {
  const [allOperators, setAllOperators] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [assignments, setAssignments] = useState<SeatAssignment>({
    comandante: '',
    motorista: '',
    patrulheiro_1: '',
    patrulheiro_2: ''
  });

  useEffect(() => {
    const fetchOperators = async () => {
      const { data } = await supabase
        .from('usuarios_sgaft')
        .select('*')
        .order('ord', { ascending: true });
      if (data) setAllOperators(data as User[]);
    };
    fetchOperators();
  }, []);

  const handleDropAssignment = (role: keyof SeatAssignment, name: string) => {
    const newAssignments = { ...assignments };
    (Object.keys(newAssignments) as Array<keyof SeatAssignment>).forEach(key => {
      if (newAssignments[key] === name) newAssignments[key] = '';
    });
    newAssignments[role] = name;
    setAssignments(newAssignments);
  };

  const handleDragStart = (e: React.DragEvent, name: string) => {
    e.dataTransfer.setData('operatorName', name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignments.comandante || !assignments.motorista) {
      return alert('Postos de Comando e Motorista são obrigatórios.');
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('servicos_vtr').insert([{
        comandante: assignments.comandante,
        motorista: assignments.motorista,
        patrulheiro_1: assignments.patrulheiro_1,
        patrulheiro_2: assignments.patrulheiro_2,
        criado_por: user?.id,
        status: 'ATIVO',
        horario_inicio: new Date().toISOString()
      }]);

      if (error) throw error;
      onStarted();
      onClose();
    } catch (err: any) {
      alert('Erro ao sincronizar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOperators = allOperators.filter(op =>
    op.matricula !== '133613021' && ( // Filtro para ocultar matrícula específica
      op.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      op.matricula.includes(searchTerm)
    )
  );

  const clearSeats = () => {
    setAssignments({ comandante: '', motorista: '', patrulheiro_1: '', patrulheiro_2: '' });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 bg-black/90 backdrop-blur-md overflow-hidden">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-6xl rounded-[2rem] shadow-2xl overflow-hidden flex flex-col md:flex-row h-full max-h-[580px]">
        
        {/* LEFT SIDEBAR: OPERATORS LIST (3 COLUMNS) */}
        <div className="w-full md:w-[480px] bg-slate-900 border-r border-slate-700 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 shrink-0">
            <h3 className="text-white font-black uppercase tracking-tighter text-sm mb-3">Efetivo Disponível</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Filtrar operador..." 
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-[10px] font-bold text-white outline-none focus:ring-1 focus:ring-green-600 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <i className="fas fa-search absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px]"></i>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2 grid grid-cols-3 gap-1.5 content-start custom-scrollbar">
            {filteredOperators.map(op => {
              const isAssigned = Object.values(assignments).includes(op.nome.toUpperCase());
              return (
                <div 
                  key={op.id}
                  draggable={!isAssigned}
                  onDragStart={(e) => handleDragStart(e, op.nome.toUpperCase())}
                  className={`p-0 rounded-xl border transition-all flex items-center gap-1.5 cursor-grab active:cursor-grabbing group min-w-0 h-9
                    ${isAssigned ? 'bg-slate-950/40 border-slate-800 opacity-30 cursor-not-allowed' : 'bg-green-600/30 border-green-500/20 hover:border-green-400 hover:bg-green-600/40 shadow-sm'}
                  `}
                >
                  <div className={`w-6 h-full flex items-center justify-center flex-shrink-0 rounded-l-xl ${isAssigned ? 'bg-slate-900 text-slate-700' : 'bg-green-600/20 text-green-400'}`}>
                    <i className="fas fa-id-badge text-[9px]"></i>
                  </div>
                  <div className="flex-1 min-w-0 pr-1">
                    <p className="text-[8px] font-black text-white uppercase truncate leading-none mb-0.5">{op.nome}</p>
                    <p className="text-[6.5px] font-bold text-slate-400/80 uppercase tracking-tighter leading-none">ID: {op.matricula}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* MAIN AREA: VTR DIAGRAM */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          <div className="bg-slate-900/40 p-4 border-b border-slate-700/50 flex justify-between items-center backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-green-600/20 p-2 rounded-lg">
                <i className="fas fa-users-rays text-green-500 text-xs"></i>
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tighter leading-none">Distribuição Tática</h3>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Arraste para os assentos</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearSeats} className="text-slate-500 hover:text-white transition-colors p-1.5" title="Limpar">
                <i className="fas fa-rotate-left text-xs"></i>
              </button>
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1.5">
                <i className="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div className="flex-1 p-4 overflow-hidden flex items-center justify-center bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] bg-opacity-5">
            <ViaturaDiagram assignments={assignments} onDrop={handleDropAssignment} />
          </div>

          <div className="p-4 border-t border-slate-700/50 bg-slate-900/60 backdrop-blur-md flex items-center justify-between shrink-0">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Status Guarnição</span>
              <div className="flex gap-1 mt-1">
                <div className={`w-4 h-1 rounded-full ${assignments.motorista ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                <div className={`w-4 h-1 rounded-full ${assignments.comandante ? 'bg-green-500' : 'bg-slate-700'}`}></div>
                <div className={`w-4 h-1 rounded-full ${assignments.patrulheiro_1 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                <div className={`w-4 h-1 rounded-full ${assignments.patrulheiro_2 ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 bg-slate-700/40 hover:bg-slate-700 text-white font-black py-2.5 rounded-xl uppercase text-[9px] transition-all border border-slate-700/50">Sair</button>
              <button 
                onClick={handleSubmit} 
                disabled={isSaving} 
                className={`px-8 font-black py-2.5 rounded-xl uppercase text-[9px] shadow-xl transition-all active:scale-95 flex items-center justify-center
                  ${assignments.motorista && assignments.comandante ? 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}
                `}
              >
                {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-bolt mr-2"></i>}
                {isSaving ? 'Gravando' : 'Sincronizar'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StartShiftModal;
