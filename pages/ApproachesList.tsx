
import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import { DBApproach, Individual } from '../types';

const ITEMS_PER_PAGE = 10;

const ApproachSkeleton = () => (
  <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl h-32 animate-pulse flex overflow-hidden">
    <div className="w-32 bg-slate-700/20"></div>
    <div className="flex-1 p-5 space-y-3">
      <div className="h-4 bg-slate-700/30 rounded w-3/4"></div>
      <div className="h-2 bg-slate-700/20 rounded w-1/2"></div>
    </div>
  </div>
);

const ApproachCard = memo(({ app, onClick }: { app: any; onClick: () => void }) => {
  const photos = app.individuos?.fotos_individuos || [];
  const primaryPhoto = photos.find((p: any) => p.is_primary)?.path || photos[0]?.path || app.foto_path;
  const faccao = app.individuos?.faccao;

  return (
    <div 
      onClick={onClick}
      className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl hover:border-blue-600/50 hover:bg-slate-700/50 transition-all group flex h-32 cursor-pointer active:scale-[0.99]"
    >
      <div className="w-32 h-full flex-shrink-0 bg-slate-900 border-r border-slate-700 overflow-hidden">
        {primaryPhoto ? (
          <img src={primaryPhoto} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-10"><i className="fas fa-user-secret text-3xl"></i></div>
        )}
      </div>

      <div className="flex-1 p-5 flex flex-col justify-between">
        <div className="flex justify-between items-start gap-4">
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">
                {app.individuo_nome || 'INDIVÍDUO N/I'}
              </h3>
              {faccao && (
                <span className="text-[7px] font-black px-1 py-0.5 bg-red-600/20 text-red-500 rounded border border-red-500/30">
                  {faccao}
                </span>
              )}
            </div>
            <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase mt-1">
              {new Date(app.data).toLocaleDateString('pt-BR')} - {app.horario}
            </div>
          </div>
          <i className="fas fa-chevron-right text-slate-700 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"></i>
        </div>
        <div className="flex items-center text-slate-500 text-[9px] font-bold uppercase tracking-tighter truncate">
          <i className="fas fa-map-marker-alt text-red-500 mr-2"></i> {app.local}
        </div>
      </div>
    </div>
  );
});

interface ApproachDetailModalProps {
  approach: DBApproach;
  onClose: () => void;
}

const ApproachDetailModal: React.FC<ApproachDetailModalProps> = ({ approach, onClose }) => {
  const [individual, setIndividual] = useState<Individual | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (approach.individuo_id) fetchIndividual(approach.individuo_id);
  }, [approach.individuo_id]);

  const fetchIndividual = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await supabase.from('individuos').select('id, nome, alcunha, faccao, mae').eq('id', id).single();
      if (data) setIndividual(data as Individual);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg"><i className="fas fa-file-contract text-white"></i></div>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter">Relatório Operacional</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
            <div><label className="block text-[8px] font-black text-slate-500 uppercase">Data</label><p className="text-sm font-bold text-white">{new Date(approach.data).toLocaleDateString('pt-BR')}</p></div>
            <div><label className="block text-[8px] font-black text-slate-500 uppercase">Hora</label><p className="text-sm font-bold text-white">{approach.horario}</p></div>
            <div><label className="block text-[8px] font-black text-slate-500 uppercase">Status</label><p className="text-sm font-bold text-green-500">{approach.resultado || 'N/I'}</p></div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-l-2 border-yellow-600 pl-2">Identificação</h4>
            <div className="flex items-center gap-3">
               <p className="text-sm font-bold text-white uppercase">{approach.individuo_nome || individual?.nome || 'N/I'}</p>
               {individual?.faccao && <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-600 text-white rounded uppercase">{individual.faccao}</span>}
            </div>
            {individual?.alcunha && <p className="text-[10px] font-bold text-yellow-600 uppercase">"{individual.alcunha}"</p>}
          </div>

          <div className="space-y-2">
            <label className="block text-[8px] font-black text-slate-500 uppercase">Relatório</label>
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap italic bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              {approach.relatorio}
            </p>
          </div>
        </div>
        <div className="p-6 bg-slate-900 border-t border-slate-700">
          <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-xs">Fechar</button>
        </div>
      </div>
    </div>
  );
};

const ApproachesList: React.FC = () => {
  const [approaches, setApproaches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedApproach, setSelectedApproach] = useState<DBApproach | null>(null);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (isLoadingMore || isLoading) return;
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) setPage(p => p + 1);
    });
    if (node) observerRef.current.observe(node);
  }, [isLoadingMore, isLoading, hasMore]);

  const fetchApproaches = useCallback(async (currentPage: number, isInitial: boolean = false) => {
    if (isInitial) setIsLoading(true);
    else setIsLoadingMore(true);

    try {
      const from = currentPage * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error } = await supabase
        .from('abordagens')
        .select(`
          id, data, horario, local, individuo_nome, foto_path,
          individuos:individuo_id ( faccao, fotos_individuos (path, is_primary) )
        `)
        .order('data', { ascending: false })
        .range(from, to);
      
      if (!error && data) {
        setApproaches(prev => isInitial ? data : [...prev, ...data]);
        setHasMore(data.length === ITEMS_PER_PAGE);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchApproaches(0, true); }, [fetchApproaches]);
  useEffect(() => { if (page > 0) fetchApproaches(page); }, [page, fetchApproaches]);

  const filtered = approaches.filter(app => 
    app.individuo_nome?.toLowerCase().includes(search.toLowerCase()) || 
    app.local?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Histórico Operacional</h2>
        <input type="text" placeholder="Filtrar registros..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-slate-800 border border-slate-700 text-white px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-sm w-full md:w-80" />
      </div>

      {isLoading && approaches.length === 0 ? (
        <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <ApproachSkeleton key={i} />)}</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app, index) => (
            <div key={app.id} ref={index === filtered.length - 1 ? lastElementRef : null}>
              <ApproachCard app={app} onClick={() => {
                supabase.from('abordagens').select('*').eq('id', app.id).single().then(({data}) => {
                  if (data) setSelectedApproach(data);
                });
              }} />
            </div>
          ))}
          {isLoadingMore && <div className="mt-4"><ApproachSkeleton /></div>}
        </div>
      )}
      {selectedApproach && <ApproachDetailModal approach={selectedApproach} onClose={() => setSelectedApproach(null)} />}
    </div>
  );
};

export default ApproachesList;
