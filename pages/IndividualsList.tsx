
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import AddIndividualModal from '../components/AddIndividualModal';
import ManagePhotosModal from '../components/ManagePhotosModal';
import { Individual, User, PhotoRecord, Relationship, Attachment } from '../types';
import { maskCPF, validateCPF } from '../lib/utils';

interface IndividualsListProps {
  user: User | null;
}

interface AttachmentViewerModalProps {
  attachment: Attachment;
  onClose: () => void;
}

const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({ attachment, onClose }) => {
  const isImage = attachment.tipo_mime.startsWith('image/');
  const isPdf = attachment.tipo_mime === 'application/pdf';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <i className={`fas ${isImage ? 'fa-image' : 'fa-file-pdf'} text-yellow-600`}></i>
            <h3 className="text-sm font-black text-white uppercase tracking-tighter truncate max-w-xs">{attachment.nome_arquivo}</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
        </div>
        
        <div className="flex-1 overflow-auto bg-slate-900 p-4 flex items-center justify-center">
          {isImage ? (
            <img src={attachment.path} className="max-w-full max-h-full object-contain" alt={attachment.nome_arquivo} />
          ) : isPdf ? (
            <iframe src={attachment.path} className="w-full h-[60vh]" title={attachment.nome_arquivo}></iframe>
          ) : (
            <div className="text-center py-20">
              <i className="fas fa-file-download text-5xl text-slate-700 mb-4"></i>
              <p className="text-slate-400 font-bold">Visualização não disponível para este formato.</p>
              <a href={attachment.path} download={attachment.nome_arquivo} className="mt-4 inline-block bg-yellow-600 text-white px-6 py-2 rounded-xl font-black uppercase text-xs">Baixar Arquivo</a>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-800 border-t border-slate-700">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Legenda / Descrição do Documento</h4>
          <p className="text-white text-sm font-medium leading-relaxed italic">
            {attachment.legenda || 'Sem legenda cadastrada.'}
          </p>
          <div className="mt-4 pt-4 border-t border-slate-700/50 flex justify-between items-center">
             <span className="text-[9px] text-slate-500 font-bold uppercase">Anexado por: {attachment.created_by}</span>
             <span className="text-[9px] text-slate-500 font-bold uppercase">{new Date(attachment.created_at).toLocaleString('pt-BR')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface EditModalProps {
  individual: Individual;
  onClose: () => void;
  onSave: (updated: Individual) => void;
  currentUser: User | null;
}

const FACCOES_OPTIONS = [
  { value: '', label: 'Selecione:' },
  { value: 'PCC', label: 'PCC (Primeiro Comando da Capital)' },
  { value: 'CV', label: 'CV (Comando Vermelho)' },
  { value: 'TCP', label: 'TCP (Terceiro Comando Puro)' },
  { value: 'GDE', label: 'GDE (Guardiões do Estado)' },
  { value: 'BDM', label: 'BDM (Bonde do Maluco)' },
  { value: 'SDC', label: 'SDC (Sindicato do Crime)' },
  { value: 'FDN', label: 'FDN (Família do Norte)' }
];

const EditIndividualModal: React.FC<EditModalProps> = ({ individual, onClose, onSave, currentUser }) => {
  const [formData, setFormData] = useState<Individual>({ ...individual });
  const [isSaving, setIsSaving] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  
  const photos = individual.fotos_individuos || [];
  const initialIndex = photos.findIndex(p => p.is_primary);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(initialIndex !== -1 ? initialIndex : 0);
  
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchRelationships();
    fetchAttachments();
  }, [individual.id]);

  const fetchRelationships = async () => {
    const { data } = await supabase
      .from('individuos_relacionamentos')
      .select('*, relacionado:individuos!relacionado_id(nome, alcunha)')
      .eq('individuo_id', individual.id);
    if (data) setRelationships(data.map(r => ({ ...r, relacionado_nome: (r.relacionado as any)?.nome, relacionado_alcunha: (r.relacionado as any)?.alcunha })));
  };

  const fetchAttachments = async () => {
    const { data } = await supabase.from('individuos_anexos').select('*').eq('individuo_id', individual.id).order('created_at', { ascending: false });
    if (data) setAttachments(data);
  };

  const handleAddAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const legenda = window.prompt(`Informe uma LEGENDA para o arquivo: ${file.name}`);
      
      if (legenda === null) {
        if (attachmentInputRef.current) attachmentInputRef.current.value = '';
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        const { error } = await supabase.from('individuos_anexos').insert({
          individuo_id: individual.id,
          nome_arquivo: file.name,
          tipo_mime: file.type,
          path: base64String,
          legenda: legenda || '',
          created_by: currentUser?.nome
        });
        if (!error) fetchAttachments();
      };
      reader.readAsDataURL(file);
    }
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleEditLegenda = async (attachment: Attachment) => {
    const novaLegenda = window.prompt(`Editar legenda para: ${attachment.nome_arquivo}`, attachment.legenda || '');
    if (novaLegenda !== null) {
      const { error } = await supabase
        .from('individuos_anexos')
        .update({ legenda: novaLegenda })
        .eq('id', attachment.id);
      
      if (error) {
        alert('Erro ao atualizar legenda.');
      } else {
        fetchAttachments();
      }
    }
  };

  const removeAttachment = async (id: string) => {
    if (!confirm('Excluir este anexo permanentemente?')) return;
    const { error } = await supabase.from('individuos_anexos').delete().eq('id', id);
    if (!error) fetchAttachments();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await supabase.from('individuos').update({
        nome: formData.nome, alcunha: formData.alcunha, faccao: formData.faccao, documento: formData.documento,
        data_nascimento: formData.data_nascimento, updated_at: new Date().toISOString()
      }).eq('id', individual.id);
      if (!error) onSave(formData);
    } finally { setIsSaving(false); }
  };

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
          <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-600 p-2 rounded-lg"><i className="fas fa-user-edit text-white"></i></div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">EDITAR PERFIL</h3>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="relative group bg-slate-900 rounded-xl border border-slate-700 overflow-hidden aspect-video flex items-center justify-center">
              {photos.length > 0 ? (
                <>
                  <img src={photos[currentPhotoIndex].path} className="w-full h-full object-contain animate-in fade-in duration-300" alt={`Foto ${currentPhotoIndex + 1}`} />
                  {photos[currentPhotoIndex].is_primary && (
                    <div className="absolute top-3 left-3 bg-yellow-600 text-[10px] font-black px-2 py-1 rounded-lg uppercase shadow-lg border border-yellow-500/30">
                      <i className="fas fa-star mr-1"></i> Foto de Capa
                    </div>
                  )}
                  {photos.length > 1 && (
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-[10px] font-black text-white px-3 py-1 rounded-full border border-white/10 uppercase tracking-widest">
                      {currentPhotoIndex + 1} / {photos.length}
                    </div>
                  )}
                  {photos.length > 1 && (
                    <>
                      <button type="button" onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-yellow-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/10 shadow-xl opacity-0 group-hover:opacity-100"><i className="fas fa-chevron-left"></i></button>
                      <button type="button" onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-900/80 hover:bg-yellow-600 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-white/10 shadow-xl opacity-0 group-hover:opacity-100"><i className="fas fa-chevron-right"></i></button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center opacity-20">
                  <i className="fas fa-user-secret text-6xl text-slate-700"></i>
                  <span className="text-[10px] font-black uppercase mt-4">Sem mídia registrada</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Nome Completo</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-yellow-600 transition-all" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Alcunha (Vulgo)</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-yellow-600 transition-all" value={formData.alcunha || ''} onChange={e => setFormData({...formData, alcunha: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Facção</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white outline-none focus:ring-2 focus:ring-yellow-600 transition-all appearance-none" value={formData.faccao || ''} onChange={e => setFormData({...formData, faccao: e.target.value})}>
                  {FACCOES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Outros Anexos (Documentos)</h4>
                 <button type="button" onClick={() => attachmentInputRef.current?.click()} className="text-[9px] font-black uppercase text-yellow-600 border border-yellow-600/30 px-3 py-1.5 rounded-lg bg-yellow-600/5 hover:bg-yellow-600/10 transition-colors">
                  <i className="fas fa-paperclip mr-2"></i> Anexar Doc
                </button>
                <input type="file" ref={attachmentInputRef} onChange={handleAddAttachment} className="hidden" />
              </div>
              <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                {attachments.map(att => (
                  <div key={att.id} className="bg-slate-900/80 border border-slate-700 rounded-lg p-2 flex items-center justify-between group">
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center min-w-0">
                        <i className={`fas ${att.tipo_mime.startsWith('image/') ? 'fa-image' : 'fa-file-pdf'} text-slate-500 mr-2 text-xs flex-shrink-0`}></i>
                        <span className="text-[10px] text-slate-300 font-bold uppercase truncate">{att.nome_arquivo}</span>
                      </div>
                      {att.legenda && <span className="text-[8px] text-yellow-600/70 font-bold uppercase truncate mt-0.5 ml-5">{att.legenda}</span>}
                    </div>
                    <div className="flex gap-2 flex-shrink-0 ml-2">
                      <button type="button" onClick={() => setViewingAttachment(att)} className="text-slate-500 hover:text-white transition-all w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-700" title="Visualizar"><i className="fas fa-eye text-xs"></i></button>
                      <button type="button" onClick={() => handleEditLegenda(att)} className="text-slate-500 hover:text-yellow-500 transition-all w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-700" title="Editar Legenda"><i className="fas fa-pencil-alt text-xs"></i></button>
                      <button type="button" onClick={() => removeAttachment(att.id)} className="text-slate-500 hover:text-red-500 transition-all w-7 h-7 flex items-center justify-center rounded-full hover:bg-slate-700" title="Excluir"><i className="fas fa-trash-alt text-xs"></i></button>
                    </div>
                  </div>
                ))}
                {attachments.length === 0 && <p className="text-[9px] text-slate-600 italic">Nenhum documento anexo.</p>}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-slate-700">
              <button type="button" onClick={onClose} className="flex-1 bg-slate-700 text-white font-black py-3 rounded-xl uppercase text-xs hover:bg-slate-600 transition-colors">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 bg-yellow-600 text-white font-black py-3 rounded-xl uppercase text-xs hover:bg-yellow-500 transition-colors shadow-lg shadow-yellow-600/20">
                {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>} Salvar Alterações
              </button>
            </div>
          </form>
        </div>
      </div>

      {viewingAttachment && <AttachmentViewerModal attachment={viewingAttachment} onClose={() => setViewingAttachment(null)} />}
    </>
  );
};

const IndividualsList: React.FC<IndividualsListProps> = ({ user }) => {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingIndividual, setEditingIndividual] = useState<Individual | null>(null);
  const [managingPhotosIndividual, setManagingPhotosIndividual] = useState<Individual | null>(null);
  const [isAddingIndividual, setIsAddingIndividual] = useState(false);

  useEffect(() => { fetchIndividuals(); }, []);

  const fetchIndividuals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('individuos').select('*, fotos_individuos(*)').order('nome', { ascending: true });
      if (!error && data) setIndividuals(data);
    } finally { setIsLoading(false); }
  };

  const filteredIndividuals = individuals.filter(ind => 
    ind.nome.toLowerCase().includes(search.toLowerCase()) || (ind.alcunha && ind.alcunha.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto py-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="bg-yellow-600 p-2.5 rounded-lg shadow-lg shadow-yellow-600/20"><i className="fas fa-users text-white text-xl"></i></div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Cadastro de Indivíduos</h2>
        </div>
        <div className="flex gap-4">
          <div className="relative w-full md:w-64">
            <input 
              type="text" 
              placeholder="Buscar por nome ou vulgo..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 text-white pl-10 pr-4 py-2 rounded-xl outline-none focus:ring-2 focus:ring-yellow-600 transition-all" 
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm"></i>
          </div>
          <button onClick={() => setIsAddingIndividual(true)} className="bg-yellow-600 hover:bg-yellow-500 text-white px-6 py-2 rounded-xl font-black text-sm uppercase transition-all shadow-lg shadow-yellow-600/20 whitespace-nowrap">Novo Cadastro</button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center py-32">
          <div className="w-12 h-12 border-4 border-yellow-600/30 border-t-yellow-600 rounded-full animate-spin mb-4"></div>
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Consultando base tática...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6 px-4">
          {filteredIndividuals.map((ind) => (
            <div key={ind.id} onClick={() => setEditingIndividual(ind)} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl hover:border-yellow-600/50 cursor-pointer flex flex-col group transition-all h-[380px]">
              <div className="h-[220px] bg-slate-900 relative flex-shrink-0">
                {ind.fotos_individuos && ind.fotos_individuos.length > 0 ? (
                  <img src={ind.fotos_individuos.find(p => p.is_primary)?.path || ind.fotos_individuos[0].path} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt={ind.nome} />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center opacity-20">
                    <i className="fas fa-user-secret text-6xl mb-2"></i>
                    <span className="text-[8px] font-black uppercase tracking-widest">Sem Registro Fotográfico</span>
                  </div>
                )}
                <div className="absolute top-2 right-2 flex flex-col gap-1 items-end z-10 pointer-events-none">
                  {ind.faccao && <span className="text-[7px] font-black px-1.5 py-0.5 bg-red-600 text-white rounded uppercase shadow-xl border border-red-500/30 backdrop-blur-sm">{ind.faccao}</span>}
                  {ind.alcunha && <span className="text-[7px] font-black px-1.5 py-0.5 bg-yellow-600 text-white rounded uppercase shadow-xl border border-yellow-500/30 backdrop-blur-sm">"{ind.alcunha}"</span>}
                </div>
              </div>

              <div className="flex-1 p-3 flex flex-col justify-between bg-slate-800 border-t border-slate-700/50">
                <div className="space-y-2.5">
                  <h3 className="text-[11px] font-black text-white uppercase truncate leading-none border-b border-slate-700 pb-2 group-hover:text-yellow-500 transition-colors">{ind.nome}</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">DT NASC</span>
                      <span className="text-[10px] text-slate-200 font-bold whitespace-nowrap">{ind.data_nascimento ? new Date(ind.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      <span className="text-[7px] text-slate-500 font-black uppercase tracking-tighter">CPF</span>
                      <span className="text-[10px] text-slate-200 font-bold truncate">{ind.documento || 'N/I'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-auto pt-2">
                  <button onClick={(e) => { e.stopPropagation(); }} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border border-slate-600/50 flex items-center justify-center shadow-lg">Histórico</button>
                  <button onClick={(e) => { e.stopPropagation(); setManagingPhotosIndividual(ind); }} className="w-10 h-8 bg-yellow-600/10 hover:bg-yellow-600 text-yellow-500 hover:text-white rounded-lg flex items-center justify-center border border-yellow-600/30 transition-all shadow-lg"><i className="fas fa-camera text-[11px]"></i></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAddingIndividual && <AddIndividualModal currentUser={user} onClose={() => setIsAddingIndividual(false)} onSave={fetchIndividuals} />}
      {editingIndividual && <EditIndividualModal individual={editingIndividual} currentUser={user} onClose={() => setEditingIndividual(null)} onSave={() => { fetchIndividuals(); setEditingIndividual(null); }} />}
      {managingPhotosIndividual && <ManagePhotosModal currentUser={user} individual={managingPhotosIndividual} onClose={() => setManagingPhotosIndividual(null)} onSave={fetchIndividuals} />}
    </div>
  );
};

export default IndividualsList;
