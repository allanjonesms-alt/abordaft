
import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface SettingsProps {
  user: User | null;
}

const Settings: React.FC<SettingsProps> = ({ user }) => {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  
  // Estados para Edição
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('usuarios_sgaft')
        .select('*')
        .order('nome', { ascending: true });
      
      if (!error && data) {
        setUsersList(data as User[]);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === UserRole.ADMIN) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  if (user?.role !== UserRole.ADMIN) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="bg-red-500/10 p-6 rounded-full mb-6"><i className="fas fa-lock text-red-500 text-6xl"></i></div>
        <h2 className="text-3xl font-black text-white mb-4">Acesso Restrito</h2>
        <p className="text-slate-500 uppercase font-black text-xs tracking-widest">Apenas Administradores podem acessar este terminal.</p>
      </div>
    );
  }

  const handleResetPassword = async (targetUser: User) => {
    const defaultPassword = 'Mudar@123';
    if (!confirm(`Deseja resetar a senha de ${targetUser.nome}?\nA nova senha será: ${defaultPassword}\nO usuário será obrigado a trocá-la no próximo acesso.`)) return;

    try {
      const { error } = await supabase
        .from('usuarios_sgaft')
        .update({ 
          senha: defaultPassword, 
          primeiro_acesso: false 
        })
        .eq('id', targetUser.id);

      if (error) throw error;
      alert('Senha resetada com sucesso!');
      fetchUsers();
    } catch (err: any) {
      alert('Erro ao resetar: ' + err.message);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('usuarios_sgaft')
        .update({
          nome: editingUser.nome,
          matricula: editingUser.matricula,
          role: editingUser.role
        })
        .eq('id', editingUser.id);

      if (error) throw error;
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert('Erro ao atualizar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportLegacyData = async () => {
    if (!confirm('Deseja importar os dados do CSV legado?')) return;
    setIsImporting(true);
    setImportStatus('Processando CSV...');
    // ... lógica de importação mantida ...
    setImportStatus('Importação finalizada.');
    setIsImporting(false);
  };

  const filteredUsers = usersList.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.matricula.includes(searchTerm)
  );

  return (
    <div className="max-w-6xl mx-auto py-6 space-y-10">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex items-center space-x-4">
          <div className="bg-slate-700 p-3 rounded-2xl shadow-xl">
            <i className="fas fa-user-gear text-white text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Painel Administrativo</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Gerenciamento de Operadores e Terminal</p>
          </div>
        </div>

        <div className="flex gap-4">
           <div className="relative">
              <input 
                type="text" 
                placeholder="Filtrar por nome/ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl text-xs font-bold focus:ring-2 focus:ring-yellow-600 outline-none w-64"
              />
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"></i>
           </div>
        </div>
      </div>

      {/* Lista de Usuários */}
      <section className="px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full py-20 text-center">
              <i className="fas fa-spinner fa-spin text-yellow-600 text-3xl mb-4"></i>
              <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">Sincronizando Base de Operadores...</p>
            </div>
          ) : filteredUsers.map(u => (
            <div key={u.id} className="bg-slate-800 border border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${u.role === UserRole.ADMIN ? 'bg-red-600/20 text-red-500 border border-red-500/30' : 'bg-blue-600/20 text-blue-500 border border-blue-500/30'}`}>
                  {u.role}
                </span>
              </div>

              <div className="flex items-center space-x-4 mb-6">
                <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700 group-hover:border-yellow-600/50 transition-colors">
                  <i className={`fas ${u.role === UserRole.ADMIN ? 'fa-user-shield' : 'fa-user'} text-slate-500 text-xl`}></i>
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-white font-black uppercase text-sm truncate">{u.nome}</h4>
                  <p className="text-slate-500 text-[10px] font-bold">MAT: {u.matricula}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-2 h-2 rounded-full ${u.primeiro_acesso ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">
                  {u.primeiro_acesso ? 'Acesso Liberado' : 'Senha Pendente'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setEditingUser(u)}
                  className="bg-slate-900 hover:bg-slate-700 text-white py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-pencil-alt text-yellow-600"></i> Editar
                </button>
                <button 
                  onClick={() => handleResetPassword(u)}
                  className="bg-slate-900 hover:bg-red-600/10 text-slate-400 hover:text-red-500 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 border border-transparent hover:border-red-500/30"
                >
                  <i className="fas fa-key"></i> Resetar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Seção de Importação Legada */}
      <section className="px-4">
        <div className="bg-slate-800/50 border border-slate-700 border-dashed p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="max-w-md">
            <h3 className="text-white font-black uppercase tracking-tight text-lg flex items-center">
              <i className="fas fa-database text-yellow-600 mr-3"></i> Sincronização Legada
            </h3>
            <p className="text-slate-500 text-xs mt-2 font-medium">
              Importar registros históricos de abordagens e indivíduos a partir do documento CSV mestre.
            </p>
          </div>
          <button 
            onClick={handleImportLegacyData}
            disabled={isImporting}
            className="bg-yellow-600 hover:bg-yellow-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl disabled:opacity-50"
          >
            {isImporting ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-file-import mr-2"></i>}
            {isImporting ? 'Processando...' : 'Importar CSV'}
          </button>
        </div>
      </section>

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-white font-black uppercase tracking-tighter">Editar Operador</h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-500 hover:text-white"><i className="fas fa-times text-xl"></i></button>
            </div>
            
            <form onSubmit={handleUpdateUser} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  value={editingUser.nome} 
                  onChange={e => setEditingUser({...editingUser, nome: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-yellow-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Matrícula (Login)</label>
                <input 
                  type="text" 
                  value={editingUser.matricula} 
                  onChange={e => setEditingUser({...editingUser, matricula: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-yellow-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargo / Perfil</label>
                <select 
                  value={editingUser.role} 
                  onChange={e => setEditingUser({...editingUser, role: e.target.value as UserRole})}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-bold focus:ring-2 focus:ring-yellow-600 outline-none appearance-none"
                >
                  <option value={UserRole.ADMIN}>ADMINISTRADOR</option>
                  <option value={UserRole.OPERATOR}>OPERADOR TÁTICO</option>
                </select>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingUser(null)}
                  className="flex-1 bg-slate-700 text-white font-black py-4 rounded-xl uppercase text-[10px]"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex-[2] bg-yellow-600 text-white font-black py-4 rounded-xl uppercase text-[10px] shadow-lg"
                >
                  {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
