
import React from 'react';
import { Link } from 'react-router-dom';
import { User } from '../types';

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
    <div className={`w-16 h-16 ${colorClass} rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6`}>
      <i className={`fas ${icon} text-3xl text-white`}></i>
    </div>
    <h3 className="text-xl font-black text-white mb-2">{label}</h3>
    <p className="text-slate-400 text-sm leading-relaxed">{description}</p>
    
    <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <i className="fas fa-chevron-right text-slate-500"></i>
    </div>
  </Link>
);

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-10 animate-fade-in">
        <h2 className="text-3xl font-black text-white mb-2">
          Olá, {user?.nome?.split(' ')[0]}
        </h2>
        <p className="text-slate-400 text-lg">
          Selecione uma das opções abaixo para gerenciar as operações.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <MenuButton
          to="/nova-abordagem"
          icon="fa-plus-circle"
          label="Nova Abordagem"
          colorClass="bg-blue-600"
          description="Inicie um novo registro de abordagem em campo agora."
        />
        <MenuButton
          to="/abordagens"
          icon="fa-list-ul"
          label="Abordagens"
          colorClass="bg-slate-600"
          description="Consulte o histórico de ocorrências e registros realizados."
        />
        <MenuButton
          to="/individuos"
          icon="fa-users"
          label="Indivíduos"
          colorClass="bg-yellow-600"
          description="Pesquise ou cadastre dados e antecedentes de suspeitos."
        />
        <MenuButton
          to="/galeria"
          icon="fa-images"
          label="Galeria"
          colorClass="bg-purple-600"
          description="Visualize evidências fotográficas e registros de fisionomia."
        />
      </div>

      <div className="mt-12 p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50 border-dashed">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-700 p-3 rounded-xl">
            <i className="fas fa-info-circle text-slate-400"></i>
          </div>
          <div>
            <h4 className="text-slate-300 font-bold">Informação do Sistema</h4>
            <p className="text-slate-500 text-sm mt-1">
              Todos os registros são georreferenciados e possuem carimbo de tempo inviolável.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
