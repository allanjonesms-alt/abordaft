
import React from 'react';
import { Link } from 'react-router-dom';
import { User, UserRole } from '../types';

interface DashboardProps {
  user: User | null;
}

const MenuButton: React.FC<{
  to: string;
  icon: string;
  label: string;
  colorClass: string;
  description: string;
}> = ({ to, icon, label, colorClass, description }) => (
  <Link
    to={to}
    className="group relative overflow-hidden bg-slate-800 border border-slate-700 rounded-2xl p-6 transition-all hover:scale-[1.02] hover:shadow-2xl hover:border-slate-500 flex flex-col items-center text-center"
  >
    <div className={`w-16 h-16 ${colorClass} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 shadow-lg`}>
      <i className={`fas ${icon} text-3xl text-white`}></i>
    </div>
    <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">{label}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    
    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <i className="fas fa-chevron-right text-slate-500"></i>
    </div>
  </Link>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
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
          to="/nova-abordagem"
          icon="fa-file-signature"
          label="Nova Abordagem"
          colorClass="bg-blue-600"
          description="Registrar nova abordagem policial em campo."
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

        {/* Botão extra exclusivo para Admin no Menu Principal */}
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

      <div className="mt-12 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
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
