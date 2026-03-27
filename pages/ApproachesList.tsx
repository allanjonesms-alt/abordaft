
import React, { useEffect, useState, useCallback, useRef, memo } from 'react';
import { supabase } from '../lib/supabase';
import { DBApproach, Individual } from '../types';

const ITEMS_PER_PAGE = 10;

const ApproachSkeleton = () => (
  <div className="bg-gray-100/50 border border-gray-200/50 rounded-2xl h-32 animate-pulse flex overflow-hidden">
    <div className="w-32 bg-gray-200/20"></div>
    <div className="flex-1 p-5 space-y-3">
      <div className="h-4 bg-gray-200/30 rounded w-3/4"></div>
      <div className="h-2 bg-gray-200/20 rounded w-1/2"></div>
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
      className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xl hover:border-blue-600/50 hover:bg-gray-50 transition-all group flex h-32 cursor-pointer active:scale-[0.99]"
    >
      <div className="w-32 h-full flex-shrink-0 bg-gray-100 border-r border-gray-200 overflow-hidden">
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
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">
                {app.individuo_nome || 'INDIVÍDUO N/I'}
              </h3>
              {faccao && (
                <span className="text-[7px] font-black px-1 py-0.5 bg-red-100 text-red-600 rounded border border-red-200">
                  {faccao}
                </span>
              )}
            </div>
            <div className="flex items-center text-gray-500 text-[10px] font-bold uppercase mt-1">
              {new Date(app.data).toLocaleDateString('pt-BR')} - {app.horario}
            </div>
          </div>
          <i className="fas fa-chevron-right text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all"></i>
        </div>
        <div className="flex items-center text-gray-400 text-[9px] font-bold uppercase tracking-tighter truncate">
          <i className="fas fa-map-marker-alt text-red-600 mr-2"></i> {app.local}
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
      const { data } = await supabase.from('individuos').select('id, nome, alcunha, faccao, mae, observacao').eq('id', id).single();
      if (data) setIndividual(data as Individual);
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-gray-200 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-gray-100 p-6 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg"><i className="fas fa-file-contract text-white"></i></div>
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-tighter">Relatório Operacional</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors"><i className="fas fa-times text-xl"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-200">
            <div><label className="block text-[8px] font-black text-gray-500 uppercase">Data</label><p className="text-sm font-bold text-gray-900">{new Date(approach.data).toLocaleDateString('pt-BR')}</p></div>
            <div><label className="block text-[8px] font-black text-gray-500 uppercase">Hora</label><p className="text-sm font-bold text-gray-900">{approach.horario}</p></div>
            <div><label className="block text-[8px] font-black text-gray-500 uppercase">Status</label><p className="text-sm font-bold text-green-600">{approach.resultado || 'N/I'}</p></div>
          </div>

          <div className="space-y-2">
            <label className="block text-[8px] font-black text-gray-500 uppercase">Local da Abordagem</label>
            <p className="text-sm font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-200 flex items-center gap-2">
              <i className="fas fa-map-marker-alt text-red-600"></i>
              {approach.local}
            </p>
          </div>

          {approach.objetos_apreendidos && (
            <div className="space-y-2">
              <label className="block text-[8px] font-black text-gray-500 uppercase">Objetos Apreendidos</label>
              <p className="text-sm font-bold text-gray-900 bg-gray-50 p-3 rounded-xl border border-gray-200">
                {approach.objetos_apreendidos}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest border-l-2 border-yellow-600 pl-2">Identificação</h4>
            <div className="flex items-center gap-3">
               <p className="text-sm font-bold text-gray-900 uppercase">{approach.individuo_nome || individual?.nome || 'N/I'}</p>
               {individual?.faccao && <span className="text-[8px] font-black px-1.5 py-0.5 bg-red-600 text-white rounded uppercase">{individual.faccao}</span>}
            </div>
            {individual?.alcunha && <p className="text-[10px] font-bold text-yellow-700 uppercase">"{individual.alcunha}"</p>}
            {individual?.mae && <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Mãe: <span className="text-gray-900">{individual.mae}</span></p>}
          </div>

          {individual?.observacao && (
            <div className="space-y-2">
              <label className="block text-[8px] font-black text-gray-500 uppercase">Observações do Indivíduo</label>
              <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-200">
                {individual.observacao}
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[8px] font-black text-gray-500 uppercase">Relatório</label>
            <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap italic bg-gray-50 p-4 rounded-xl border border-gray-200">
              {approach.relatorio}
            </p>
          </div>
        </div>
        <div className="p-6 bg-gray-100 border-t border-gray-200">
          <button onClick={onClose} className="w-full bg-white hover:bg-gray-50 text-gray-900 font-black py-4 rounded-2xl uppercase text-xs border border-gray-200">Fechar</button>
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
        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Histórico Operacional</h2>
        <input type="text" placeholder="Filtrar registros..." value={search} onChange={(e) => setSearch(e.target.value)} className="bg-white border border-gray-200 text-gray-900 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold text-sm w-full md:w-80" />
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
