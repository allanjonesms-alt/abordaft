
import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import AddIndividualModal from '../components/AddIndividualModal';
import ManagePhotosModal from '../components/ManagePhotosModal';
import EditIndividualModal from '../components/EditIndividualModal';
import { Individual, User } from '../types';

interface IndividualsListProps {
  user: User | null;
}

const ITEMS_PER_PAGE = 12;

const IndividualSkeleton = () => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-3xl h-[400px] animate-pulse overflow-hidden">
    <div className="h-[230px] bg-slate-700/20"></div>
    <div className="p-5 space-y-4">
      <div className="h-4 bg-slate-700/30 rounded w-3/4"></div>
      <div className="h-2 bg-slate-700/20 rounded w-1/2"></div>
      <div className="h-10 bg-slate-700/30 rounded-xl mt-4"></div>
    </div>
  </div>
);

const IndividualCard = memo(({ ind, onEdit, onManagePhotos }: { 
  ind: Individual, 
  onEdit: (i: Individual) => void, 
  onManagePhotos: (i: Individual) => void 
}) => {
  const primaryPhoto = ind.fotos_individuos?.find(p => p.is_primary)?.path || ind.fotos_individuos?.[0]?.path;

  return (
    <div 
      onClick={() => onEdit(ind)} 
      className="bg-slate-800 border border-slate-700 rounded-3xl overflow-hidden shadow-2xl hover:border-yellow-600/50 cursor-pointer flex flex-col group transition-all h-[420px] hover:shadow-yellow-600/10 active:scale-[0.98]"
    >
      <div className="h-[230px] bg-slate-900 relative flex-shrink-0 overflow-hidden">
        {primaryPhoto ? (
          <img 
            src={primaryPhoto} 
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" 
            alt={ind.nome} 
            loading="lazy"
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10">
            <i className="fas fa-user-secret text-7xl mb-4"></i>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between bg-slate-800 border-t border-slate-700/50">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xs font-black text-white uppercase truncate max-w-[70%] leading-none group-hover:text-yellow-500 transition-colors">
              {ind.nome}
            </h3>
            {ind.faccao && (
              <span className="text-[7px] font-black px-1.5 py-0.5 bg-red-600/90 text-white rounded uppercase border border-red-500/30">
                {ind.faccao}
              </span>
            )}
            {ind.alcunha && (
              <span className="text-[7px] font-black px-1.5 py-0.5 bg-yellow-600/90 text-white rounded uppercase border border-yellow-500/30">
                "{ind.alcunha}"
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-700/50">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Nascimento</span>
              <span className="text-[10px] text-slate-300 font-bold">
                {ind.data_nascimento ? new Date(ind.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I'}
              </span>
            </div>
            <div className="flex flex-col gap-1 overflow-hidden">
              <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Doc</span>
              <span className="text-[10px] text-slate-300 font-bold truncate">
                {ind.documento || 'N/I'}
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => { e.stopPropagation(); onManagePhotos(ind); }} 
          className="mt-4 h-10 bg-slate-900 hover:bg-yellow-600 text-slate-500 hover:text-white rounded-xl flex items-center justify-center border border-slate-700 hover:border-yellow-500 transition-all shadow-lg uppercase text-[9px] font-black w-full"
        >
          <i className="fas fa-camera-retro mr-2"></i> Fotos
        </button>
      </div>
    </div>
  );
});

const IndividualsList: React.FC<IndividualsListProps> = ({ user }) => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [managingPhotosIndividual, setManagingPhotosIndividual] = useState<Individual | null>(null);
  const [isAddingIndividual, setIsAddingIndividual] = useState(false);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(handler);
  }, [search]);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore || isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(prev => prev + 1);
    }, { threshold: 0.1 });
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, isLoading, hasMore]);

  const fetchIndividuals = useCallback(async (currentPage: number, isInitial: boolean = false, searchTerm: string = '') => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from('individuos')
        .select('id, nome, alcunha, documento, data_nascimento, faccao, fotos_individuos(path, is_primary)', { count: 'planned' });

      if (searchTerm.trim()) {
        const s = `%${searchTerm.trim()}%`;
        query = query.or(`nome.ilike.${s},alcunha.ilike.${s},documento.ilike.${s}`);
      }

      const { data, error, count } = await query
        .order('nome', { ascending: true })
        .range(from, to);

      if (!error && data) {
        setIndividuals(prev => isInitial ? data as Individual[] : [...prev, ...(data as Individual[])]);
        if (count !== null) setTotalCount(count);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    setPage(0);
    fetchIndividuals(0, true, debouncedSearch);
  }, [debouncedSearch, fetchIndividuals]);

  useEffect(() => {
    if (page > 0) fetchIndividuals(page, false, debouncedSearch);
  }, [page, debouncedSearch, fetchIndividuals]);

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-10 gap-6 px-4">
        <div className="flex items-center space-x-5">
          <div className="bg-yellow-600 p-4 rounded-2xl shadow-2xl shadow-yellow-600/20">
            <i className="fas fa-user-shield text-white text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Indivíduos</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">
              {isLoading ? 'Consultando Inteligência...' : `${totalCount} Registros Ativos`}
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="relative flex-1 sm:w-80">
            <input 
              type="text" 
              placeholder="Pesquisar registro..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-slate-900/50 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-600 transition-all font-bold text-sm" 
            />
            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-600"></i>
          </div>
          <button 
            onClick={() => setIsAddingIndividual(true)} 
            className="bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            <i className="fas fa-plus"></i> Novo Cadastro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-6 px-4">
        {isLoading && individuals.length === 0 ? (
          Array.from({ length: 12 }).map((_, i) => <IndividualSkeleton key={i} />)
        ) : (
          <>
            {individuals.map((ind, index) => (
              <div key={ind.id} ref={index === individuals.length - 1 ? lastElementRef : null}>
                <IndividualCard ind={ind} onEdit={setEditingIndividual} onManagePhotos={setManagingPhotosIndividual} />
              </div>
            ))}
            {isLoadingMore && Array.from({ length: 6 }).map((_, i) => <IndividualSkeleton key={i} />)}
          </>
        )}
      </div>

      {isAddingIndividual && <AddIndividualModal currentUser={user} onClose={() => setIsAddingIndividual(false)} onSave={() => { setIndividuals([]); setPage(0); fetchIndividuals(0, true, debouncedSearch); }} />}
      {editingIndividual && <EditIndividualModal individual={editingIndividual} currentUser={user} onClose={() => setEditingIndividual(null)} onSave={() => { setIndividuals([]); setPage(0); fetchIndividuals(0, true, debouncedSearch); setEditingIndividual(null); }} />}
      {managingPhotosIndividual && <ManagePhotosModal currentUser={user} individual={managingPhotosIndividual} onClose={() => setManagingPhotosIndividual(null)} onSave={() => { setIndividuals([]); setPage(0); fetchIndividuals(0, true, debouncedSearch); }} />}
    </div>
  );
};

export default IndividualsList;
