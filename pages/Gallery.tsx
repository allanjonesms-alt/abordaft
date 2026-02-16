
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Individual, PhotoRecord } from '../types';
import EditIndividualModal from '../components/EditIndividualModal';

interface PhotoWithIndividual extends PhotoRecord {
  individuos: {
    nome: string;
    data_nascimento: string | null;
    mae: string | null;
    endereco: string | null;
  } | null;
}

const CITIES = ['COXIM', 'SONORA', 'PEDRO GOMES', 'ALCINÓPOLIS', 'RIO VERDE'];

const CityIcon: React.FC<{ city: string; active: boolean; size?: string }> = ({ city, active, size = "w-5 h-5" }) => {
  const getPath = () => {
    switch (city) {
      case 'COXIM': return "M4 12 L8 4 L16 6 L20 14 L12 20 L6 18 Z";
      case 'SONORA': return "M6 4 L18 4 L20 12 L12 16 L4 12 Z";
      case 'PEDRO GOMES': return "M12 2 L20 10 L16 20 L8 20 L4 10 Z";
      case 'ALCINÓPOLIS': return "M12 4 L16 8 L16 16 L12 20 L8 16 L8 8 Z";
      case 'RIO VERDE': return "M4 8 Q12 2 20 8 T20 20 Q12 16 4 20 T4 8";
      case 'TODOS': return "M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 M12 6 L12 18 M6 12 L18 12";
      default: return "M12 2 L20 20 L4 20 Z M12 14 v4 M12 10 h.01";
    }
  };

  return (
    <svg 
      viewBox="0 0 24 24" 
      className={`${size} transition-all duration-500 ${active ? 'text-white drop-shadow-[0_0_5px_rgba(168,85,247,0.8)]' : 'text-slate-500'}`}
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d={getPath()} className={active ? "animate-pulse" : ""} />
      {active && <circle cx="12" cy="12" r="1" fill="currentColor" className="animate-ping" />}
    </svg>
  );
};

const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoWithIndividual[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoWithIndividual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('TODOS');
  const [selectedIndividual, setSelectedIndividual] = useState<Individual | null>(null);
  const [isOpeningProfile, setIsOpeningProfile] = useState(false);

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [activeFilter, photos]);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fotos_individuos')
        .select('*, individuos(nome, data_nascimento, mae, endereco)')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPhotos(data as unknown as PhotoWithIndividual[]);
      }
    } catch (err) {
      console.error('Erro ao buscar galeria:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilter = () => {
    if (activeFilter === 'TODOS') {
      setFilteredPhotos(photos);
      return;
    }

    const filtered = photos.filter(photo => {
      const endereco = photo.individuos?.endereco?.toUpperCase() || '';
      
      if (activeFilter === 'OUTROS') {
        return !endereco || !CITIES.some(city => endereco.includes(city));
      }

      return endereco.includes(activeFilter);
    });

    setFilteredPhotos(filtered);
  };

  const handleOpenProfile = async (id: string) => {
    setIsOpeningProfile(true);
    try {
      const { data, error } = await supabase
        .from('individuos')
        .select('*, fotos_individuos(*)')
        .eq('id', id)
        .single();
      
      if (!error && data) {
        setSelectedIndividual(data);
      }
    } catch (err) {
      console.error('Erro ao abrir perfil:', err);
    } finally {
      setIsOpeningProfile(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/I';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return 'N/I';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 px-4">
      {/* Cabeçalho da Galeria */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
        <div className="flex items-center space-x-4">
          <div className="bg-purple-600 p-3 rounded-2xl shadow-xl shadow-purple-600/30">
            <i className="fas fa-images text-white text-2xl"></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">Galeria Tática</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">Inteligência Visual / Monitoramento Geográfico</p>
          </div>
        </div>
        
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl px-6 py-3 flex items-center gap-6">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Registros Ativos</span>
            <div className="text-2xl font-black text-purple-500 leading-none">{filteredPhotos.length}</div>
          </div>
          <div className="w-px h-8 bg-slate-700"></div>
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Localização</span>
            <div className="text-sm font-black text-white leading-none uppercase">{activeFilter}</div>
          </div>
        </div>
      </div>

      {/* Filtros Geográficos */}
      <div className="flex justify-center mb-12">
        <div className="flex flex-wrap justify-center gap-3 max-w-4xl">
          <div className="flex flex-wrap justify-center gap-3 w-full">
            <button
              onClick={() => setActiveFilter('TODOS')}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                activeFilter === 'TODOS' 
                ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/30 scale-105' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <CityIcon city="TODOS" active={activeFilter === 'TODOS'} />
              Todos
            </button>
            
            {CITIES.slice(0, 3).map(city => (
              <button
                key={city}
                onClick={() => setActiveFilter(city)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                  activeFilter === city 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/30 scale-105' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <CityIcon city={city} active={activeFilter === city} />
                {city}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full">
            {CITIES.slice(3).map(city => (
              <button
                key={city}
                onClick={() => setActiveFilter(city)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                  activeFilter === city 
                  ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/30 scale-105' 
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                }`}
              >
                <CityIcon city={city} active={activeFilter === city} />
                {city}
              </button>
            ))}

            <button
              onClick={() => setActiveFilter('OUTROS')}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                activeFilter === 'OUTROS' 
                ? 'bg-purple-600 border-purple-500 text-white shadow-xl shadow-purple-600/30 scale-105' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              <CityIcon city="OUTROS" active={activeFilter === 'OUTROS'} />
              Outros
            </button>
          </div>
        </div>
      </div>

      {isLoading || isOpeningProfile ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-16 h-16 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mb-6"></div>
          <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">
            {isOpeningProfile ? 'Sincronizando Perfil Tático...' : 'Sincronizando Mídias Operacionais...'}
          </p>
        </div>
      ) : filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {filteredPhotos.map((img) => (
            <div 
              key={img.id} 
              onClick={() => handleOpenProfile(img.individuo_id)}
              className="group relative aspect-[3/4] rounded-3xl border border-slate-700 overflow-hidden bg-black shadow-2xl transition-all hover:border-blue-500/50 hover:scale-[1.03] cursor-pointer"
            >
              <img 
                src={img.path.startsWith('data:') ? img.path : `https://picsum.photos/seed/${img.id}/600/800`} 
                alt="Registro tático" 
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-100"
              />
              
              {/* Badge de Cidade - Ícone Reduzido */}
              <div className="absolute top-3 left-3 z-10">
                <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-xl border border-white/10 px-2 py-1 rounded-lg">
                  <CityIcon city={
                    img.individuos?.endereco?.toUpperCase().includes('COXIM') ? 'COXIM' : 
                    img.individuos?.endereco?.toUpperCase().includes('SONORA') ? 'SONORA' :
                    img.individuos?.endereco?.toUpperCase().includes('PEDRO GOMES') ? 'PEDRO GOMES' :
                    img.individuos?.endereco?.toUpperCase().includes('ALCINÓPOLIS') ? 'ALCINÓPOLIS' :
                    img.individuos?.endereco?.toUpperCase().includes('RIO VERDE') ? 'RIO VERDE' : 'OUTROS'
                  } active={true} size="w-3.5 h-3.5" />
                  <span className="text-[8px] text-white font-black uppercase tracking-tighter">
                    {img.individuos?.endereco?.toUpperCase().includes('COXIM') ? 'COXIM' : 
                     img.individuos?.endereco?.toUpperCase().includes('SONORA') ? 'SONORA' :
                     img.individuos?.endereco?.toUpperCase().includes('PEDRO GOMES') ? 'P. GOMES' :
                     img.individuos?.endereco?.toUpperCase().includes('ALCINÓPOLIS') ? 'ALCINÓPOLIS' :
                     img.individuos?.endereco?.toUpperCase().includes('RIO VERDE') ? 'R. VERDE' : 'OUTROS'}
                  </span>
                </div>
              </div>

              {/* Overlay de Informações Biográficas - Estilo Tático Azul Escuro */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950 via-blue-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-6 translate-y-8 group-hover:translate-y-0">
                <div className="space-y-2">
                  <h4 className="text-white text-sm font-black uppercase tracking-tight leading-tight drop-shadow-md">
                    {img.individuos?.nome || 'INDIVÍDUO NÃO IDENTIFICADO'}
                  </h4>
                  
                  <div className="flex flex-col gap-1 border-t border-white/20 pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] text-blue-300 font-bold uppercase tracking-widest">Nascimento:</span>
                      <span className="text-[10px] text-white font-black">{formatDate(img.individuos?.data_nascimento || null)}</span>
                    </div>
                    
                    <div className="flex flex-col mt-1">
                      <span className="text-[9px] text-blue-300 font-bold uppercase tracking-widest">Mãe:</span>
                      <span className="text-[10px] text-white font-black uppercase truncate leading-none mt-1">
                        {img.individuos?.mae || 'NÃO INFORMADA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-4 pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <i className="fas fa-calendar-check text-blue-400 text-[10px]"></i>
                      <p className="text-blue-100 text-[9px] font-bold uppercase">
                        {new Date(img.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <i className="fas fa-fingerprint text-white/30 text-xs"></i>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/30 border border-slate-700 border-dashed rounded-[40px] p-24 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-700 shadow-inner">
            <i className="fas fa-map-marked text-3xl text-slate-700"></i>
          </div>
          <h3 className="text-xl font-black text-white mb-3 uppercase tracking-tight">Sem Registros Geográficos</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-[10px] uppercase font-bold tracking-[0.2em] leading-relaxed">
            A base de dados não retornou imagens vinculadas à jurisdição de: <span className="text-purple-500">{activeFilter}</span>
          </p>
        </div>
      )}

      {selectedIndividual && (
        <EditIndividualModal 
          individual={selectedIndividual} 
          currentUser={null} // Pode ser passado via props se necessário
          onClose={() => setSelectedIndividual(null)} 
          onSave={() => {
            fetchPhotos();
            setSelectedIndividual(null);
          }} 
        />
      )}
    </div>
  );
};

export default Gallery;
