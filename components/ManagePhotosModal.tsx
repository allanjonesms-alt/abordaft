
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PhotoRecord, User as AppUser } from '../types';

interface ManagePhotosModalProps {
  currentUser: AppUser | null;
  individual: {
    id: string;
    nome: string;
  };
  onClose: () => void;
  onSave: () => void;
}

const ManagePhotosModal: React.FC<ManagePhotosModalProps> = ({ currentUser, individual, onClose, onSave }) => {
  const [photos, setPhotos] = useState<PhotoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchIndividualPhotos();
  }, [individual.id]);

  const fetchIndividualPhotos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fotos_individuos')
        .select('*')
        .eq('individuo_id', individual.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) setPhotos(data);
    } catch (err) {
      console.error('Erro ao buscar fotos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPhotos(prev => {
            // Se não houver fotos, a primeira obrigatoriamente é primary
            const isFirst = prev.length === 0;
            const newPhoto: PhotoRecord = {
              id: 'temp-' + Math.random().toString(36).substr(2, 9),
              path: base64String,
              is_primary: isFirst,
              individuo_id: individual.id
            };
            return [...prev, newPhoto];
          });
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const setAsPrimary = (id: string) => {
    setPhotos(prev => prev.map(p => ({
      ...p,
      is_primary: p.id === id // Apenas a selecionada fica TRUE, o resto FALSE
    })));
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      // Se apagou a primary, promove a primeira disponível
      if (filtered.length > 0 && !filtered.some(p => p.is_primary)) {
        filtered[0].is_primary = true;
      }
      return filtered;
    });
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    
    try {
      // Deleta as fotos antigas e reinsere com as novas ordens e status is_primary
      const { error: deleteError } = await supabase
        .from('fotos_individuos')
        .delete()
        .eq('individuo_id', individual.id);

      if (deleteError) throw deleteError;

      if (photos.length > 0) {
        const photosToInsert = photos.map((p, index) => ({
          individuo_id: individual.id,
          path: p.path,
          is_primary: p.is_primary,
          sort_order: index,
          created_by: currentUser?.nome || 'Operador Desconhecido'
        }));

        const { error: insertError } = await supabase
          .from('fotos_individuos')
          .insert(photosToInsert);

        if (insertError) throw insertError;
      }

      onSave();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar galeria:', err);
      alert('Falha na sincronização: ' + (err.message || 'Erro de conexão.'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-600 w-12 h-12 rounded-xl shadow-lg flex items-center justify-center">
              <i className="fas fa-camera-retro text-white text-xl"></i>
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none">Arquivo de Mídia</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 tracking-widest flex items-center">
                <i className="fas fa-user-circle mr-2 text-yellow-600/70"></i>
                Indivíduo: {individual.nome}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            disabled={isSaving}
            className="bg-slate-800 hover:bg-red-600/20 text-slate-400 hover:text-red-500 transition-all w-10 h-10 rounded-full flex items-center justify-center"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="p-8">
          {isLoading ? (
            <div className="py-20 text-center">
              <i className="fas fa-spinner fa-spin text-yellow-600 text-4xl mb-4"></i>
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Acessando registros...</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-widest">Controle de Identificação</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Marque uma foto como <span className="text-yellow-500">CAPA</span> para o perfil principal</p>
                </div>
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-xl active:scale-95 flex items-center"
                >
                  <i className="fas fa-plus mr-3"></i> Adicionar Foto
                </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept="image/*" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar p-1">
                {photos.map((photo) => (
                  <div 
                    key={photo.id} 
                    className={`relative aspect-square rounded-2xl border-2 overflow-hidden transition-all group ${photo.is_primary ? 'border-yellow-600 ring-4 ring-yellow-600/10 scale-[1.05]' : 'border-slate-700 hover:border-slate-500'}`}
                  >
                    <img src={photo.path} className={`w-full h-full object-cover transition-all ${photo.is_primary ? 'opacity-100' : 'opacity-60 group-hover:opacity-90'}`} alt="Registro" />
                    
                    {/* Botões Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                      {!photo.is_primary && (
                        <button 
                          onClick={() => setAsPrimary(photo.id)}
                          className="bg-yellow-600 text-white w-10 h-10 rounded-full hover:scale-110 active:scale-90 transition-all flex items-center justify-center shadow-xl"
                          title="Definir como Capa"
                        >
                          <i className="fas fa-star text-sm"></i>
                        </button>
                      )}
                      <button 
                        onClick={() => removePhoto(photo.id)}
                        className="bg-red-600 text-white w-10 h-10 rounded-full hover:scale-110 active:scale-90 transition-all flex items-center justify-center shadow-xl"
                        title="Excluir Foto"
                      >
                        <i className="fas fa-trash-alt text-sm"></i>
                      </button>
                    </div>

                    {/* Badge de Capa */}
                    {photo.is_primary && (
                      <div className="absolute top-2 left-2 bg-yellow-600 text-[8px] font-black text-white px-2 py-1 rounded-lg uppercase tracking-widest flex items-center shadow-xl border border-yellow-500/50">
                        <i className="fas fa-check-circle mr-1.5"></i>
                        CAPA
                      </div>
                    )}
                  </div>
                ))}

                <div 
                  onClick={() => !isSaving && fileInputRef.current?.click()}
                  className="aspect-square rounded-2xl border-2 border-slate-700 border-dashed flex flex-col items-center justify-center text-slate-600 hover:text-yellow-600 hover:border-yellow-600/50 hover:bg-slate-900 transition-all cursor-pointer"
                >
                  <i className="fas fa-camera text-3xl mb-2"></i>
                  <span className="text-[9px] font-black uppercase">Nova Mídia</span>
                </div>
              </div>

              <div className="flex gap-4 mt-10 pt-8 border-t border-slate-700/50">
                <button 
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 bg-slate-900 text-slate-400 font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-xs border border-slate-700 hover:bg-slate-700 hover:text-white"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-[2] bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all uppercase tracking-widest text-sm shadow-2xl flex items-center justify-center"
                >
                  {isSaving ? (
                    <><i className="fas fa-spinner fa-spin mr-3"></i>Sincronizando...</>
                  ) : (
                    <><i className="fas fa-save mr-3"></i>Confirmar Registros</>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManagePhotosModal;
