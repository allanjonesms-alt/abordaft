
import React from 'react';
import { User, UserRole } from '../types';

interface SettingsProps {
  user: User | null;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-6">
          <i className="fas fa-lock text-red-500 text-6xl"></i>
        </div>
        <h2 className="text-3xl font-black text-white mb-4">Acesso Negado</h2>
        <p className="text-slate-400 max-w-md">Esta seção é exclusiva para administradores do sistema SGAFT.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6">
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-slate-700 p-2.5 rounded-lg">
          <i className="fas fa-cog text-white text-xl"></i>
        </div>
        <h2 className="text-2xl font-black text-white">Configurações de Administrador</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <i className="fas fa-user-shield mr-2 text-yellow-600"></i>
            Gestão de Usuários
          </h3>
          <p className="text-slate-400 text-sm mb-6">Cadastre novos operadores ou altere permissões de acesso.</p>
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">
            Gerenciar Agentes
          </button>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <i className="fas fa-database mr-2 text-blue-600"></i>
            Backup de Dados
          </h3>
          <p className="text-slate-400 text-sm mb-6">Exportar banco de dados local para CSV ou sincronizar com a nuvem.</p>
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">
            Exportar Registros (.csv)
          </button>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <i className="fas fa-history mr-2 text-purple-600"></i>
            Logs do Sistema
          </h3>
          <p className="text-slate-400 text-sm mb-6">Visualize quem acessou o sistema e quais alterações foram feitas.</p>
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">
            Ver Logs de Auditoria
          </button>
        </div>

        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <i className="fas fa-map-marked-alt mr-2 text-green-600"></i>
            Zonas de Patrulha
          </h3>
          <p className="text-slate-400 text-sm mb-6">Defina perímetros de alerta e áreas de maior incidência criminal.</p>
          <button className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-colors">
            Configurar Mapas
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
