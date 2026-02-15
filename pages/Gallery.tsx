
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface PhotoRecord {
  id: string;
  path: string;
  created_at: string;
  abordagem_id: string;
}

const Gallery: React.FC = () => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fotos_individuos')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setPhotos(data);
      }
    } catch (err) {
      console.error('Erro ao buscar galeria:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 p-2.5 rounded-lg shadow-lg shadow-purple-600/20">
            <i className="fas fa-images text-white text-xl"></i>
          </div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Galeria de Registros</h2>
        </div>
        
        <div className="text-right">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total de Arquivos</span>
          <div className="text-xl font-black text-purple-500">{photos.length}</div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32">
          <div className="w-12 h-12 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Acessando servidores de imagem...</p>
        </div>
      ) : photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((img) => (
            <div key={img.id} className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-700 aspect-video bg-slate-800 shadow-xl transition-all hover:border-purple-500/50">
              <img 
                src={img.path.startsWith('data:') ? img.path : `https://picsum.photos/seed/${img.id}/400/300`} 
                alt="Registro tático" 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                <p className="text-white text-[10px] font-black uppercase tracking-tighter truncate">ID: {img.id.split('-')[0]}</p>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-purple-400 text-[9px] font-bold uppercase tracking-widest">
                    {new Date(img.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  <i className="fas fa-expand text-white text-[10px]"></i>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 border-dashed rounded-3xl p-16 text-center">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-inner">
            <i className="fas fa-camera-retro text-3xl text-slate-600"></i>
          </div>
          <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tight">Galeria Vazia</h3>
          <p className="text-slate-500 max-w-xs mx-auto text-sm">Nenhum registro fotográfico encontrado no banco de dados central.</p>
        </div>
      )}
    </div>
  );
};

export default Gallery;
