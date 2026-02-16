
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AddIndividualModal from '../components/AddIndividualModal';
import ManagePhotosModal from '../components/ManagePhotosModal';
import EditIndividualModal from '../components/EditIndividualModal';
import { Individual, User } from '../types';

interface IndividualsListProps {
  user: User | null;
}

const IndividualsList: React.FC<IndividualsListProps> = ({ user }) => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [managingPhotosIndividual, setManagingPhotosIndividual] = useState<Individual | null>(null);
  const [isAddingIndividual, setIsAddingIndividual] = useState(false);

  useEffect(() => { fetchIndividuals(); }, []);

  const fetchIndividuals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('individuos').select('*, fotos_individuos(*)').order('nome', { ascending: true });
      if (!error && data) setIndividuals(data);
    } finally { setIsLoading(false); }
  };

  const filteredIndividuals = individuals.filter(ind => 
    ind.nome.toLowerCase().includes(search.toLowerCase()) || (ind.alcunha && ind.alcunha.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="bg-yellow-600 p-2.5 rounded-lg shadow-lg shadow-yellow-600/20"><i className="fas fa-users text-white text-xl"></i></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Cadastro de Indivíduos</h2>
        </div>
        <div className="flex gap-4">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar por nome ou vulgo..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-yellow-600 transition-all" 
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
          </div>
          <button onClick={() => setIsAddingIndividual(true)} className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-xl font-black text-sm uppercase transition-all shadow-lg shadow-yellow-600/20 whitespace-nowrap">Novo Cadastro</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-32">
          <div className="w-12 h-12 border-4 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Consultando base tática...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 px-4">
          {filteredIndividuals.map((ind) => (
            <div key={ind.id} onClick={() => setEditingIndividual(ind)} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl hover:border-yellow-600/50 cursor-pointer flex flex-col group transition-all h-[380px]">
              <div className="h-[220px] bg-slate-900 relative flex-shrink-0">
                {ind.fotos_individuos && ind.fotos_individuos.length > 0 ? (
                  <img src={ind.fotos_individuos.find(p => p.is_primary)?.path || ind.fotos_individuos[0].path} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt={ind.nome} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <i className="fas fa-user-secret text-6xl mb-2"></i>
                    <span className="text-[8px] font-black uppercase tracking-widest">Sem Registro Fotográfico</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10 pointer-events-none">
                  {ind.faccao && <span className="text-[7px] font-black px-1.5 py-0.5 bg-red-600 text-white rounded uppercase shadow-xl border border-red-500/30 backdrop-blur-sm">{ind.faccao}</span>}
                  {ind.alcunha && <span className="text-[7px] font-black px-1.5 py-0.5 bg-yellow-600 text-white rounded uppercase shadow-xl border border-yellow-500/30 backdrop-blur-sm">"{ind.alcunha}"</span>}
                </div>
              </div>

              <div className="flex-1 p-3 flex flex-col justify-between bg-slate-800 border-t border-slate-700/50">
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-black text-white uppercase truncate leading-none border-b border-slate-700 pb-2 group-hover:text-yellow-500 transition-colors">{ind.nome}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">DT NASC</span>
                      <span className="text-[10px] text-slate-200 font-bold whitespace-nowrap">{ind.data_nascimento ? new Date(ind.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">CPF</span>
                      <span className="text-[10px] text-slate-200 font-bold truncate">{ind.documento || 'N/I'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                  <button onClick={(e) => { e.stopPropagation(); setManagingPhotosIndividual(ind); }} className="flex-1 h-8 bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-white rounded-lg flex items-center justify-center border border-yellow-600/30 transition-all shadow-lg uppercase text-[10px] font-black"><i className="fas fa-camera mr-2"></i> Fotos</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddingIndividual && <AddIndividualModal currentUser={user} onClose={() => setIsAddingIndividual(false)} onSave={fetchIndividuals} />}
      {editingIndividual && <EditIndividualModal individual={editingIndividual} currentUser={user} onClose={() => setEditingIndividual(null)} onSave={() => { fetchIndividuals(); setEditingIndividual(null); }} />}
      {managingPhotosIndividual && <ManagePhotosModal currentUser={user} individual={managingPhotosIndividual} onClose={() => setManagingPhotosIndividual(null)} onSave={fetchIndividuals} />}
    </div>
  );
};

export default IndividualsList;
