
import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import { Individual, PhotoRecord } from '../types';
import EditIndividualModal from '../components/EditIndividualModal';

const ITEMS_PER_PAGE = 18;

interface IndividualWithPhoto extends Partial<Individual> {
  fotos_individuos: {
    id: string;
    path: string;
    is_primary: boolean;
  }[];
}

const CITIES = ['COXIM', 'SONORA', 'PEDRO GOMES', 'ALCINÓPOLIS', 'RIO VERDE'];

const GallerySkeleton = () => (
  <div className="aspect-[3/4] bg-slate-800/50 border border-slate-700/50 rounded-3xl animate-pulse"></div>
);

const Gallery: React.FC = () => {
  const [data, setData] = useState<IndividualWithPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('TODOS');
  const [selectedIndividual, setSelectedIndividual] = useState<Individual | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore || isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(p => p + 1);
    });
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, isLoading, hasMore]);

  const fetchGalleryData = useCallback(async (currentPage: number, isInitial: boolean = false) => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Buscamos indivíduos que possuam foto de capa (is_primary = true)
      // Ordenação alfabética pelo nome do indivíduo
      let query = supabase
        .from('individuos')
        .select(`
          id, 
          nome, 
          faccao, 
          alcunha,
          endereco, 
          fotos_individuos!inner(id, path, is_primary)
        `)
        .eq('fotos_individuos.is_primary', true)
        .order('nome', { ascending: true });

      // Filtros geográficos
      if (activeFilter !== 'TODOS') {
        if (activeFilter === 'OUTROS') {
          CITIES.forEach(city => { 
            query = query.not('endereco', 'ilike', `%${city}%`); 
          });
        } else {
          query = query.ilike('endereco', `%${activeFilter}%`);
        }
      }

      const { data: result, error } = await query.range(from, to);
      
      if (!error && result) {
        const formattedData = result as unknown as IndividualWithPhoto[];
        setData(prev => isInitial ? formattedData : [...prev, ...formattedData]);
        setHasMore(result.length === ITEMS_PER_PAGE);
      }
    } catch (err) {
      console.error('Erro ao carregar galeria:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [activeFilter]);

  useEffect(() => { 
    setPage(0); 
    fetchGalleryData(0, true); 
  }, [activeFilter, fetchGalleryData]);

  useEffect(() => { 
    if (page > 0) fetchGalleryData(page); 
  }, [page, fetchGalleryData]);

  const handleOpenProfile = async (id: string) => {
    const { data: ind } = await supabase
      .from('individuos')
      .select('*, fotos_individuos(*)')
      .eq('id', id)
      .single();
    if (ind) setSelectedIndividual(ind as Individual);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-purple-600 p-3 rounded-2xl shadow-xl shadow-purple-600/30">
            <i className="fas fa-images text-white text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Galeria de Capas</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Registros Ordenados por Nome</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['TODOS', ...CITIES, 'OUTROS'].map(city => (
            <button 
              key={city} 
              onClick={() => setActiveFilter(city)} 
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${activeFilter === city ? 'bg-purple-600 border-purple-500 text-white shadow-xl scale-105' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'}`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
        {isLoading && data.length === 0 ? (
          Array.from({ length: 12 }).map((_, i) => <GallerySkeleton key={i} />)
        ) : (
          <>
            {data.map((item, index) => (
              <div 
                key={item.id} 
                ref={index === data.length - 1 ? lastElementRef : null}
                onClick={() => handleOpenProfile(item.id!)}
                className="group relative aspect-[3/4] rounded-3xl border border-slate-700 overflow-hidden bg-black shadow-xl hover:border-purple-500/50 hover:scale-[1.03] cursor-pointer transition-all active:scale-95"
              >
                <img 
                  src={item.fotos_individuos[0]?.path} 
                  className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all duration-700" 
                  loading="lazy" 
                  alt={item.nome}
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-4 flex flex-col justify-end">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h4 className="text-white text-[9px] font-black uppercase tracking-tight truncate leading-tight group-hover:text-purple-400 transition-colors">
                      {item.nome}
                    </h4>
                    {item.faccao && (
                      <span className="text-[7px] font-black px-1.5 py-0.5 bg-red-600/90 text-white rounded uppercase flex-shrink-0 border border-red-500/30">
                        {item.faccao}
                      </span>
                    )}
                  </div>
                  {item.alcunha && (
                    <p className="text-[8px] text-yellow-500/80 font-bold uppercase mt-1 truncate">
                      "{item.alcunha}"
                    </p>
                  )}
                </div>
              </div>
            ))}
            {isLoadingMore && Array.from({ length: 6 }).map((_, i) => <GallerySkeleton key={i} />)}
          </>
        )}
      </div>

      {data.length === 0 && !isLoading && (
        <div className="flex flex-col items-center py-40 border border-slate-800 border-dashed rounded-[3rem]">
          <i className="fas fa-camera-retro text-slate-800 text-5xl mb-4"></i>
          <p className="text-slate-600 font-black uppercase text-xs tracking-[0.3em]">Nenhum registro com foto de capa nesta região</p>
        </div>
      )}

      {selectedIndividual && (
        <EditIndividualModal 
          individual={selectedIndividual} 
          currentUser={null}
          onClose={() => setSelectedIndividual(null)} 
          onSave={() => { setData([]); setPage(0); fetchGalleryData(0, true); setSelectedIndividual(null); }} 
        />
      )}
    </div>
  );
};

export default Gallery;
