
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { DBApproach, Individual } from '../types';

interface ApproachDetailModalProps {
  approach: DBApproach;
  onClose: () => void;
}

const ApproachDetailModal: React.FC<ApproachDetailModalProps> = ({ approach, onClose }) => {
  const [individual, setIndividual] = useState<Individual | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (approach.individuo_id) {
      fetchIndividual(approach.individuo_id);
    }
  }, [approach.individuo_id]);

  const fetchIndividual = async (id: string) => {
    setLoading(true);
    try {
      const { data } = await supabase.from('individuos').select('*').eq('id', id).single();
      if (data) setIndividual(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:max-h-none print:shadow-none print:border-none print:bg-white print:text-black">
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center print:hidden">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg"><i className="fas fa-file-contract text-white"></i></div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">Relatório Tático</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">ID: {approach.id.split('-')[0]}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 print:overflow-visible">
          <div className="hidden print:block text-center border-b-2 border-black pb-4 mb-8">
            <h1 className="text-2xl font-bold uppercase">SGAFT - Sistema de Gerenciamento da Força Tática</h1>
            <h2 className="text-xl font-bold uppercase mt-2">Relatório de Abordagem Policial</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700 print:bg-white print:border-black print:grid-cols-2">
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Data</label>
              <p className="text-sm font-bold text-white print:text-black">{new Date(approach.data).toLocaleDateString('pt-BR')}</p>
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Hora</label>
              <p className="text-sm font-bold text-white print:text-black">{approach.horario}</p>
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Viatura</label>
              <p className="text-sm font-bold text-blue-500 print:text-black uppercase">{approach.vtr || 'N/D'}</p>
            </div>
            <div>
              <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Status</label>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${approach.resultado === 'Liberado' ? 'bg-green-600/20 text-green-500' : 'bg-red-600/20 text-red-500'}`}>
                {approach.resultado || 'N/I'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-l-2 border-yellow-600 pl-2">Dados do Abordado</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Nome</label>
                <p className="text-sm font-bold text-white uppercase print:text-black">{approach.individuo_nome || individual?.nome || 'NÃO INFORMADO'}</p>
              </div>
              {individual && (
                <>
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Alcunha / Vulgo</label>
                    <p className="text-sm font-bold text-yellow-600 print:text-black uppercase">{individual.alcunha || 'SEM ALCUNHA'}</p>
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Facção</label>
                    <p className="text-sm font-bold text-red-500 print:text-black uppercase">{individual.faccao || 'NENHUMA'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Filiação (Mãe)</label>
                    <p className="text-sm font-bold text-slate-300 print:text-black uppercase">{individual.mae || 'NÃO INFORMADO'}</p>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Localização</label>
            <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-700/50 print:border-black">
              <p className="text-xs text-slate-300 print:text-black"><i className="fas fa-map-marker-alt text-red-500 mr-2"></i>{approach.local}</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest">Relatório da Ocorrência</label>
            <div className="bg-slate-900/50 p-5 rounded-2xl border border-slate-700 print:border-black">
              <p className="text-slate-300 print:text-black text-sm leading-relaxed whitespace-pre-wrap italic italic">
                {approach.relatorio}
              </p>
            </div>
          </div>

          <div className="hidden print:flex justify-between mt-20 border-t border-black pt-4">
            <div className="text-center w-64">
              <div className="border-t border-black mt-10"></div>
              <p className="text-[10px] uppercase font-bold mt-2">Assinatura do Comandante da Equipe</p>
            </div>
            <div className="text-right text-[10px] font-bold uppercase">Gerado em: {new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>

        <div className="p-6 bg-slate-900 border-t border-slate-700 flex gap-4 print:hidden">
          <button onClick={onClose} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-xs transition-all">Fechar</button>
          <button onClick={handlePrint} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl uppercase text-xs shadow-lg transition-all flex items-center justify-center">
            <i className="fas fa-print mr-2"></i> Gerar PDF
          </button>
        </div>
      </div>
    </div>
  );
};

const ApproachesList: React.FC = () => {
  const [approaches, setApproaches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedApproach, setSelectedApproach] = useState<DBApproach | null>(null);

  useEffect(() => { fetchApproaches(); }, []);

  const fetchApproaches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('abordagens')
        .select(`
          *,
          individuos:individuo_id (
            fotos_individuos (
              path,
              is_primary
            )
          )
        `)
        .order('data', { ascending: false });
      
      if (!error && data) setApproaches(data);
    } finally { setIsLoading(false); }
  };

  const handleOpenDetails = async (id: string) => {
    const { data } = await supabase.from('abordagens').select('*').eq('id', id).single();
    if (data) setSelectedApproach(data);
  };

  const filteredApproaches = approaches.filter(app =>
    (app.individuo_nome?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (app.local?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (app.vtr?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-600 p-2.5 rounded-lg shadow-lg"><i className="fas fa-list-ul text-white text-xl"></i></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Histórico Operacional</h2>
        </div>
        <div className="relative w-full md:w-96">
          <input type="text" placeholder="Filtrar por nome, local ou VTR..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-slate-500 transition-all" />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"></i>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-32"><div className="w-12 h-12 border-4 border-slate-600/30 border-t-slate-600 rounded-full animate-spin mb-4"></div></div>
      ) : filteredApproaches.length > 0 ? (
        <div className="space-y-4">
          {filteredApproaches.map((app) => {
            const photos = app.individuos?.fotos_individuos || [];
            const primaryPhoto = photos.find((p: any) => p.is_primary)?.path;
            const fallbackPhoto = photos[0]?.path;
            const displayPhoto = primaryPhoto || fallbackPhoto || app.foto_path;

            return (
              <div 
                key={app.id} 
                onClick={() => handleOpenDetails(app.id)}
                className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl hover:border-blue-600/50 hover:bg-slate-700/50 transition-all group flex h-32 cursor-pointer active:scale-[0.99]"
              >
                {/* Foto em miniatura (altura total do card) */}
                <div className="w-32 h-full flex-shrink-0 bg-slate-900 border-r border-slate-700 overflow-hidden">
                  {displayPhoto ? (
                    <img 
                      src={displayPhoto.startsWith('data:') ? displayPhoto : `https://picsum.photos/seed/${app.id}/200/200`} 
                      alt={app.individuo_nome} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <i className="fas fa-user-secret text-3xl"></i>
                    </div>
                  )}
                </div>

                {/* Conteúdo do Card */}
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest leading-none mb-1 group-hover:text-blue-400 transition-colors">{app.vtr || 'VTR N/D'}</span>
                        <h3 className="text-sm font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors truncate max-w-[200px] sm:max-w-md">
                          {app.individuo_nome || 'INDIVÍDUO NÃO IDENTIFICADO'}
                        </h3>
                        <div className="flex items-center text-slate-400 text-[10px] font-bold uppercase mt-1">
                          <i className="fas fa-calendar-alt mr-1.5 text-slate-600"></i>
                          {new Date(app.data).toLocaleDateString('pt-BR')} - {app.horario}
                        </div>
                      </div>
                    </div>
                    
                    {/* Botão de detalhe removido, card agora é clicável */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500 text-xs font-black uppercase">
                      Clique para Ver <i className="fas fa-chevron-right ml-1"></i>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-slate-500 text-[10px] font-bold uppercase tracking-tighter truncate">
                    <i className="fas fa-map-marker-alt text-red-500 mr-2"></i> {app.local}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-3xl p-16 text-center">
          <i className="fas fa-folder-open text-3xl text-slate-700 mb-4"></i>
          <p className="text-slate-500 font-black uppercase text-xs">Nenhum registro encontrado</p>
        </div>
      )}

      {selectedApproach && <ApproachDetailModal approach={selectedApproach} onClose={() => setSelectedApproach(null)} />}
    </div>
  );
};

export default ApproachesList;
