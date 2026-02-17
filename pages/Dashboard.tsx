
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  user: User | null;
}

const MenuButton: React.FC<{
  to?: string;
  onClick?: () => void;
  icon: string;
  label: string;
  colorClass: string;
  description: string;
  disabled?: boolean;
}> = ({ to, onClick, icon, label, colorClass, description, disabled }) => {
  const content = (
    <div className={`w-16 h-16 ${disabled ? 'bg-slate-700 grayscale' : colorClass} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 shadow-lg`}>
      <i className={`fas ${icon} text-3xl text-white`}></i>
    </div>
  );

  const cardClasses = `group relative overflow-hidden bg-slate-800 border ${disabled ? 'border-slate-800 opacity-60 cursor-not-allowed' : 'border-slate-700 hover:scale-[1.02] hover:shadow-2xl hover:border-slate-500 cursor-pointer'} rounded-2xl p-6 transition-all flex flex-col items-center text-center`;

  if (disabled) {
    return (
      <div className={cardClasses} onClick={onClick}>
        {content}
        <h3 className="text-xl font-black text-slate-500 mb-2 uppercase tracking-tight">{label}</h3>
        <p className="text-slate-600 text-sm leading-relaxed">{description}</p>
        <div className="absolute top-4 right-4 text-[8px] font-black text-red-500 uppercase tracking-widest border border-red-500/20 px-2 py-0.5 rounded bg-red-500/5">Inativo</div>
      </div>
    );
  }

  if (to) {
    return (
      <Link to={to} className={cardClasses}>
        {content}
        <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{label}</h3>
        <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <i className="fas fa-chevron-right text-slate-500"></i>
        </div>
      </Link>
    );
  }

  return (
    <div onClick={onClick} className={cardClasses}>
      {content}
      <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{label}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [hasActiveShift, setHasActiveShift] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkShift = async () => {
      const { data } = await supabase
        .from('servicos_vtr')
        .select('id')
        .eq('status', 'ATIVO')
        .limit(1)
        .maybeSingle();
      setHasActiveShift(!!data);
    };
    checkShift();
    const interval = setInterval(checkShift, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleApproachClick = () => {
    if (!hasActiveShift) {
      alert('ATENÇÃO OPERADOR:\nNão é possível registrar abordagem sem um SERVIÇO ATIVO.\nPor favor, INICIE O SERVIÇO no botão verde do cabeçalho.');
    } else {
      navigate('/nova-abordagem');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-10 animate-fade-in flex items-center justify-between">
          <div>
            <h2 className="text-white text-3xl font-black uppercase tracking-tighter">Terminal de Operações</h2>
            <p className="text-slate-400 mt-1">Bem-vindo, <span className="text-yellow-500 font-bold">{user?.nome}</span></p>
          </div>
          <div className="hidden sm:block">
             <div className="bg-slate-800 px-4 py-2 rounded-xl border border-slate-700 text-[10px] font-black uppercase text-slate-500 tracking-widest">
                Perfil: {user?.role}
             </div>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
        <MenuButton
          onClick={handleApproachClick}
          icon="fa-file-signature"
          label="Nova Abordagem"
          colorClass="bg-blue-600"
          description="Registrar nova abordagem policial em campo."
          disabled={!hasActiveShift}
        />
        <MenuButton
          to="/abordagens"
          icon="fa-history"
          label="Abordagens"
          colorClass="bg-slate-700"
          description="Consultar histórico de registros realizados."
        />
        <MenuButton
          to="/individuos"
          icon="fa-user-shield"
          label="Indivíduos"
          colorClass="bg-yellow-600"
          description="Base de dados e cadastro de indivíduos."
        />
        <MenuButton
          to="/galeria"
          icon="fa-th"
          label="Galeria"
          colorClass="bg-purple-600"
          description="Visualizar registros fotográficos do sistema."
        />

        {user?.role === UserRole.ADMIN && (
          <div className="sm:col-span-2">
            <MenuButton
              to="/configuracoes"
              icon="fa-gears"
              label="Configurações do Sistema"
              colorClass="bg-red-900"
              description="Gerenciamento de usuários, logs e importação de dados."
            />
          </div>
        )}
      </div>

      {!hasActiveShift && (
        <div className="mt-8 p-6 bg-red-600/10 border border-red-500/30 rounded-2xl flex items-center gap-4">
          <div className="bg-red-600 w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 animate-pulse">
            <i className="fas fa-exclamation-triangle text-white text-xl"></i>
          </div>
          <div>
            <h4 className="text-red-500 font-black uppercase text-xs tracking-widest">Aviso Operacional</h4>
            <p className="text-slate-400 text-[10px] mt-1 uppercase font-bold leading-relaxed">
              Sistema em modo de consulta apenas. Para realizar novos registros, você deve <span className="text-green-500">INICIAR O SERVIÇO</span> no topo da página.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-700 p-3 rounded-xl">
            <i className="fas fa-shield-halved text-yellow-600"></i>
          </div>
          <div>
            <h4 className="text-slate-300 font-bold uppercase text-xs tracking-widest">Status da Conexão</h4>
            <p className="text-slate-500 text-[10px] mt-1 uppercase font-black">
              Terminal conectado à rede central da Força Tática. Monitoramento ativo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
