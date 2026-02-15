
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface DBApproach {
  id: string;
  data: string;
  horario: string;
  local: string;
  vtr: string;
  relatorio: string;
  objetos_apreendidos?: string;
}

const ApproachesList: React.FC = () => {
  const [approaches, setApproaches] = useState<DBApproach[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchApproaches();
  }, []);

  const fetchApproaches = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('abordagens')
        .select('*')
        .order('data', { ascending: false });
      
      if (!error && data) {
        setApproaches(data);
      }
    } catch (err) {
      console.error('Erro ao buscar abordagens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredApproaches = approaches.filter(app =>
    (app.local?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (app.vtr?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (app.relatorio?.toLowerCase() || '').includes(search.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-slate-600 p-2.5 rounded-lg shadow-lg shadow-slate-600/20">
            <i className="fas fa-list-ul text-white text-xl"></i>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Histórico de Abordagens</h2>
        </div>

        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Buscar por local, VTR or relatório..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2.5 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none transition-all"
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-slate-600/30 border-t-slate-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Carregando registros operacionais...</p>
        </div>
      ) : filteredApproaches.length > 0 ? (
        <div className="space-y-4">
          {filteredApproaches.map((app) => (
            <div key={app.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl hover:border-slate-500 transition-all p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-600">
                    <span className="text-xs font-black text-white uppercase tracking-widest">{app.vtr || 'S/V'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white">
                      {app.data ? new Date(app.data + 'T00:00:00').toLocaleDateString('pt-BR') : 'Data N/D'}
                    </span>
                    <span className="text-[10px] text-slate-500 font-black uppercase">{app.horario || '--:--'}</span>
                  </div>
                </div>
                <div className="flex items-center text-slate-400 text-sm">
                  <i className="fas fa-map-marker-alt mr-2 text-red-500"></i>
                  <span className="font-medium truncate max-w-[300px]">{app.local}</span>
                </div>
              </div>

              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 mb-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Relatório</h4>
                <p className="text-sm text-slate-300 leading-relaxed italic">
                  "{app.relatorio}"
                </p>
              </div>

              {app.objetos_apreendidos && (
                <div className="flex items-start gap-2 text-yellow-500/80 mb-4">
                  <i className="fas fa-box-open mt-1 text-xs"></i>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest">Apreensões</span>
                    <span className="text-xs font-medium">{app.objetos_apreendidos}</span>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-slate-700 pt-4">
                <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center">
                  <i className="fas fa-print mr-1.5"></i> PDF
                </button>
                <button className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors flex items-center">
                  <i className="fas fa-eye mr-1.5"></i> Detalhes
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
            <i className="fas fa-folder-open text-3xl text-slate-600"></i>
          </div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Sem registros</h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">Nenhuma abordagem encontrada com os critérios de busca.</p>
        </div>
      )}
    </div>
  );
};

export default ApproachesList;
