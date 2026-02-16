
import React, { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import AddIndividualModal from '../components/AddIndividualModal';
import ManagePhotosModal from '../components/ManagePhotosModal';
import EditIndividualModal from '../components/EditIndividualModal';
import { Individual, User } from '../types';

interface IndividualsListProps {
  user: User | null;
}

const ITEMS_PER_PAGE = 12;

const IndividualsList: React.FC<IndividualsListProps> = ({ user }) => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [managingPhotosIndividual, setManagingPhotosIndividual] = useState<Individual | null>(null);
  const [isAddingIndividual, setIsAddingIndividual] = useState(false);
  
  // Estados para paginação
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Função central de busca no servidor
  const fetchIndividuals = useCallback(async (currentPage: number, isInitial: boolean = false, searchTerm: string = '') => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Inicia a query base
      let query = supabase
        .from('individuos')
        .select('*, fotos_individuos(path, is_primary)', { count: 'exact' });

      // Aplica filtro de busca se houver termo (Nome, Alcunha ou Documento)
      if (searchTerm.trim()) {
        const s = `%${searchTerm.trim()}%`;
        query = query.or(`nome.ilike.${s},alcunha.ilike.${s},documento.ilike.${s}`);
      }

      // Ordenação e Range
      const { data, error, count } = await query
        .order('nome', { ascending: true })
        .range(from, to);

      if (!error && data) {
        if (isInitial) {
          setIndividuals(data as Individual[]);
        } else {
          setIndividuals(prev => [...prev, ...(data as Individual[])]);
        }
        
        if (count !== null) setTotalCount(count);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Erro ao carregar indivíduos:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  // Efeito para debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchIndividuals(0, true, search);
    }, search ? 500 : 0); // Delay de 500ms se estiver digitando, instantâneo se estiver vazio

    return () => clearTimeout(timer);
  }, [search, fetchIndividuals]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchIndividuals(nextPage, false, search);
  };

  // Agora renderizamos diretamente o estado 'individuals' que já vem filtrado do banco
  const displayIndividuals = individuals;

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="bg-yellow-600 p-2.5 rounded-lg shadow-lg shadow-yellow-600/20">
            <i className="fas fa-users text-white text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Cadastro de Indivíduos</h2>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mt-1">
              {isLoading ? 'Sincronizando...' : `${search ? 'Resultados encontrados: ' : 'Total na base: '}${totalCount} registros`}
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full md:w-80">
            <input 
              type="text" 
              placeholder="Buscar em toda a base..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-600 transition-all font-bold text-sm" 
            />
            <i className={`fas ${isLoading && search ? 'fa-spinner fa-spin' : 'fa-search'} absolute left-4 top-1/2 -translate-y-1/2 text-slate-500`}></i>
          </div>
          <button 
            onClick={() => setIsAddingIndividual(true)} 
            className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase transition-all shadow-lg shadow-yellow-600/20 whitespace-nowrap active:scale-95"
          >
            <i className="fas fa-plus mr-2"></i> Novo Cadastro
          </button>
        </div>
      </div>

      {isLoading && individuals.length === 0 ? (
        <div className="flex flex-col items-center py-40">
          <div className="w-16 h-16 border-4 border-yellow-600/20 border-t-yellow-600 rounded-full animate-spin mb-6"></div>
          <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Consultando Inteligência...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6 px-4">
            {displayIndividuals.map((ind) => (
              <div 
                key={ind.id} 
                onClick={() => setEditingIndividual(ind)} 
                className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl hover:border-yellow-600/50 cursor-pointer flex flex-col group transition-all h-[420px] animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="h-[250px] bg-slate-900 relative flex-shrink-0 overflow-hidden">
                  {ind.fotos_individuos && ind.fotos_individuos.length > 0 ? (
                    <img 
                      src={ind.fotos_individuos.find(p => p.is_primary)?.path || ind.fotos_individuos[0].path} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
                      alt={ind.nome} 
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-10">
                      <i className="fas fa-user-secret text-7xl mb-4"></i>
                      <span className="text-[9px] font-black uppercase tracking-[0.2em]">Sem Imagem</span>
                    </div>
                  )}
                  
                  {/* Overlays de Status */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
                    {ind.faccao && (
                      <span className="text-[8px] font-black px-2 py-1 bg-red-600 text-white rounded-lg uppercase shadow-2xl border border-red-500/30 backdrop-blur-md">
                        {ind.faccao}
                      </span>
                    )}
                    {ind.alcunha && (
                      <span className="text-[8px] font-black px-2 py-1 bg-yellow-600 text-white rounded-lg uppercase shadow-2xl border border-yellow-500/30 backdrop-blur-md">
                        "{ind.alcunha}"
                      </span>
                    )}
                  </div>

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60"></div>
                </div>

                <div className="flex-1 p-5 flex flex-col justify-between bg-slate-800 border-t border-slate-700/50">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-white uppercase truncate leading-none group-hover:text-yellow-500 transition-colors">
                      {ind.nome}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Nascimento</span>
                        <span className="text-[11px] text-slate-300 font-bold">
                          {ind.data_nascimento ? new Date(ind.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I'}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Documento</span>
                        <span className="text-[11px] text-slate-300 font-bold truncate">
                          {ind.documento || 'N/I'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setManagingPhotosIndividual(ind); }} 
                      className="flex-1 h-10 bg-slate-900 hover:bg-yellow-600 text-slate-400 hover:text-white rounded-xl flex items-center justify-center border border-slate-700 hover:border-yellow-500 transition-all shadow-lg uppercase text-[9px] font-black"
                    >
                      <i className="fas fa-camera-retro mr-2"></i> Gerenciar Fotos
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Controle de Paginação / Carregar Mais */}
          {hasMore && (
            <div className="mt-12 mb-20 flex justify-center px-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="w-full max-w-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-black py-5 rounded-3xl uppercase text-xs tracking-[0.2em] transition-all flex items-center justify-center shadow-2xl active:scale-[0.98] group"
              >
                {isLoadingMore ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin mr-3 text-yellow-500"></i>
                    Buscando mais registros...
                  </>
                ) : (
                  <>
                    Carregar Mais {search ? 'Resultados' : 'Registros'}
                    <i className="fas fa-chevron-down ml-3 text-yellow-600 group-hover:translate-y-1 transition-transform"></i>
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && individuals.length > 0 && (
            <div className="mt-12 mb-20 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/30 border border-slate-700/50 rounded-full">
                <i className="fas fa-check-circle text-green-500/50 text-xs"></i>
                <span className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Fim dos resultados para esta busca</span>
              </div>
            </div>
          )}

          {individuals.length === 0 && !isLoading && (
            <div className="flex flex-col items-center py-40">
              <div className="bg-slate-800/50 p-6 rounded-full mb-6">
                <i className="fas fa-search-minus text-5xl text-slate-700"></i>
              </div>
              <h3 className="text-xl font-black text-white uppercase mb-2">Sem resultados</h3>
              <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Nenhum indivíduo corresponde aos termos: "{search}"</p>
            </div>
          )}
        </>
      )}

      {isAddingIndividual && <AddIndividualModal currentUser={user} onClose={() => setIsAddingIndividual(false)} onSave={() => { setIndividuals([]); setPage(0); fetchIndividuals(0, true, search); }} />}
      {editingIndividual && <EditIndividualModal individual={editingIndividual} currentUser={user} onClose={() => setEditingIndividual(null)} onSave={() => { setIndividuals([]); setPage(0); fetchIndividuals(0, true, search); setEditingIndividual(null); }} />}
      {managingPhotosIndividual && <ManagePhotosModal currentUser={user} individual={managingPhotosIndividual} onClose={() => setManagingPhotosIndividual(null)} onSave={() => { setIndividuals([]); setPage(0); fetchIndividuals(0, true, search); }} />}
    </div>
  );
};

export default IndividualsList;
