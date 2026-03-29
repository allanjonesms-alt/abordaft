import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Individual, User, PhotoRecord, Relationship, Attachment, DBApproach } from '../types';
import { maskCPF, validateCPF } from '../lib/utils';
import { loadGoogleMaps } from '../lib/googleMaps';

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

export interface EditIndividualModalProps {
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
  { value: 'GDE', label: 'GDE (Guardioes do Estado)' },
  { value: 'BDM', label: 'BDM (Bonde do Maluco)' },
  { value: 'SDC', label: 'SDC (Sindicato do Crime)' },
  { value: 'FDN', label: 'FDN (Família do Norte)' }
];

const EditIndividualModal: React.FC<EditIndividualModalProps> = ({ individual, onClose, onSave, currentUser }) => {
  const [formData, setFormData] = useState<Individual>({ ...individual });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [approachesHistory, setApproachesHistory] = useState<DBApproach[]>([]);
  const [viewingAttachment, setViewingAttachment] = useState<Attachment | null>(null);
  const [cpfError, setCpfError] = useState(false);
  
  const photos = individual.fotos_individuos || [];
  const initialIndex = photos.findIndex(p => p.is_primary);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(initialIndex !== -1 ? initialIndex : 0);
  
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<any>(null);

  const toggleEdit = () => setIsEditing(!isEditing);
  const handleCancel = () => {
    setFormData({ ...individual });
    setIsEditing(false);
  };

  const initAutocomplete = () => {
    if (!addressInputRef.current || !(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) return;

    try {
      const google = (window as any).google;
      const options = {
        componentRestrictions: { country: "br" },
        fields: ['formatted_address', 'address_components', 'geometry'],
        types: ['address']
      };

      autocompleteInstance.current = new google.maps.places.Autocomplete(
        addressInputRef.current, 
        options
      );

      autocompleteInstance.current.addListener('place_changed', () => {
        const place = autocompleteInstance.current.getPlace();
        if (!place.formatted_address) return;
        setFormData(prev => ({ ...prev, endereco: place.formatted_address }));
      });
    } catch (err) {
      console.error("Erro no Autocomplete:", err);
    }
  };

  useEffect(() => {
    document.body.classList.add('overflow-hidden');
    fetchRelationships();
    fetchAttachments();
    fetchApproachesHistory();

    const setup = async () => {
      try {
        await loadGoogleMaps();
        initAutocomplete();
      } catch (err) {
        console.error("Erro ao carregar Google Maps no EditIndividualModal:", err);
      }
    };

    setup();
    const timer = setTimeout(initAutocomplete, 1000);
    return () => {
      document.body.classList.remove('overflow-hidden');
      clearTimeout(timer);
    };
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

  const fetchApproachesHistory = async () => {
    const { data } = await supabase
      .from('abordagens')
      .select('*')
      .eq('individuo_id', individual.id)
      .order('data', { ascending: false });
    if (data) setApproachesHistory(data);
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value);
    setFormData({ ...formData, documento: masked });
    if (masked.length === 14) setCpfError(!validateCPF(masked));
    else setCpfError(false);
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
    if (formData.documento && !validateCPF(formData.documento)) {
      alert('CPF inválido detectado. Verifique os dados antes de salvar.');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from('individuos').update({
        nome: formData.nome.toUpperCase(), 
        alcunha: formData.alcunha, 
        faccao: formData.faccao, 
        documento: formData.documento,
        mae: formData.mae?.toUpperCase() || '',
        endereco: formData.endereco,
        data_nascimento: formData.data_nascimento, 
        updated_at: new Date().toISOString()
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
      <div className="fixed inset-0 z-[100] bg-white overflow-y-auto md:flex md:items-center md:justify-center md:p-4 md:bg-black/80 md:backdrop-blur-sm">
        <div className="w-full h-full md:h-auto md:max-w-2xl md:rounded-2xl md:shadow-2xl md:my-4 bg-white md:border md:border-gray-200 animate-in fade-in zoom-in duration-200 overflow-y-auto">
          <div className="bg-gray-100 p-6 border-b border-gray-200 flex justify-between items-center z-10 rounded-t-2xl">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg"><i className="fas fa-user text-white"></i></div>
              <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter">PERFIL DO INDIVÍDUO</h3>
            </div>
            <div className="flex items-center gap-3">
              {!isEditing && (
                <button onClick={toggleEdit} className="text-blue-600 hover:text-blue-500 transition-colors font-black uppercase text-xs">
                  <i className="fas fa-pencil-alt mr-2"></i> Editar
                </button>
              )}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-900 transition-colors"><i className="fas fa-times text-xl"></i></button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="relative group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden aspect-video flex items-center justify-center">
              {photos.length > 0 ? (
                <>
                  <img src={photos[currentPhotoIndex].path} className="w-full h-full object-contain animate-in fade-in duration-300" alt={`Foto ${currentPhotoIndex + 1}`} />
                  {photos[currentPhotoIndex].is_primary && (
                    <div className="absolute top-3 left-3 bg-blue-600 text-[10px] font-black px-2 py-1 rounded-lg shadow-lg border border-blue-500/30 text-white">
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
                      <button type="button" onClick={prevPhoto} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-blue-600 text-gray-900 hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-200 shadow-xl opacity-0 group-hover:opacity-100"><i className="fas fa-chevron-left"></i></button>
                      <button type="button" onClick={nextPhoto} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-blue-600 text-gray-900 hover:text-white w-10 h-10 rounded-full flex items-center justify-center transition-all border border-gray-200 shadow-xl opacity-0 group-hover:opacity-100"><i className="fas fa-chevron-right"></i></button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center opacity-20">
                  <i className="fas fa-user-secret text-6xl text-gray-400"></i>
                  <span className="text-[10px] font-black uppercase mt-4 text-gray-900">Sem mídia registrada</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6">
                  <div className="col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Nome Completo</label>
                      <input type="text" readOnly={!isEditing} className={`w-full bg-gray-100 border ${isEditing ? 'border-gray-200' : 'border-transparent'} rounded-xl px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold`} value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} />
                  </div>
                  
                  <div className="flex flex-col gap-y-6">
                      <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Alcunha (Vulgo)</label>
                          <input type="text" readOnly={!isEditing} className={`w-full bg-gray-100 border ${isEditing ? 'border-gray-200' : 'border-transparent'} rounded-xl px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold`} value={formData.alcunha || ''} onChange={e => setFormData({...formData, alcunha: e.target.value})} />
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Facção / Organização</label>
                          <select disabled={!isEditing} className={`w-full bg-gray-100 border ${isEditing ? 'border-gray-200' : 'border-transparent'} rounded-xl px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none font-bold`} value={formData.faccao || ''} onChange={e => setFormData({...formData, faccao: e.target.value})}>
                            {FACCOES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">CPF (Documento)</label>
                          <input 
                            type="text" 
                            readOnly={!isEditing}
                            className={`w-full bg-gray-100 border ${cpfError ? 'border-red-500' : (isEditing ? 'border-gray-200' : 'border-transparent')} rounded-xl px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold`} 
                            value={formData.documento || ''} 
                            onChange={handleCpfChange} 
                            maxLength={14}
                          />
                      </div>

                      <div>
                          <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Data de Nascimento</label>
                          <input type="date" readOnly={!isEditing} className={`w-full bg-gray-100 border ${isEditing ? 'border-gray-200' : 'border-transparent'} rounded-xl px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold`} value={formData.data_nascimento || ''} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} />
                      </div>
                  </div>

                  <div className="col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Filiação Materna (Mãe)</label>
                      <input type="text" readOnly={!isEditing} className={`w-full bg-gray-100 border ${isEditing ? 'border-gray-200' : 'border-transparent'} rounded-xl px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold`} value={formData.mae || ''} onChange={e => setFormData({...formData, mae: e.target.value.toUpperCase()})} />
                  </div>

                  <div className="col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Endereço Residencial (Google Autocomplete)</label>
                      <div className="relative group">
                        <input 
                          type="text" 
                          ref={addressInputRef}
                          readOnly={!isEditing}
                          className={`w-full bg-gray-100 border ${isEditing ? 'border-gray-200' : 'border-transparent'} rounded-xl pl-10 pr-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold`} 
                          defaultValue={formData.endereco || ''} 
                          placeholder="Rua, Número, Bairro, Cidade" 
                        />
                        <i className="fas fa-search-location absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-600"></i>
                      </div>
                  </div>

                  <div className="col-span-2">
                      <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Observações / Histórico Relevante</label>
                      <textarea 
                        readOnly={!isEditing}
                        className={`w-full bg-gray-100 border ${isEditing ? 'border-gray-200' : 'border-transparent'} rounded-xl px-4 py-2 text-gray-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-bold min-h-[100px] resize-none`} 
                        value={formData.observacao || ''} 
                        onChange={e => setFormData({...formData, observacao: e.target.value})}
                        placeholder="Informações adicionais sobre o abordado..."
                      />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Documentos em Anexo</h4>
                    {isEditing && (
                      <button type="button" onClick={() => attachmentInputRef.current?.click()} className="text-[9px] font-black uppercase text-blue-600 border border-blue-600/30 px-3 py-1.5 rounded-lg bg-blue-600/5 hover:bg-blue-600/10 transition-colors">
                      <i className="fas fa-paperclip mr-2"></i> Anexar Doc
                      </button>
                    )}
                    <input type="file" ref={attachmentInputRef} onChange={handleAddAttachment} className="hidden" />
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
                    {attachments.map(att => (
                    <div key={att.id} className="bg-gray-50 border border-gray-200 rounded-lg p-2 flex items-center justify-between group">
                        <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center min-w-0">
                            <i className={`fas ${att.tipo_mime.startsWith('image/') ? 'fa-image' : 'fa-file-pdf'} text-gray-500 mr-2 text-xs flex-shrink-0`}></i>
                            <span className="text-[10px] text-gray-900 font-bold uppercase truncate">{att.nome_arquivo}</span>
                        </div>
                        {att.legenda && <span className="text-[8px] text-blue-600/70 font-bold uppercase truncate mt-0.5 ml-5">{att.legenda}</span>}
                        </div>
                        <div className="flex gap-2 flex-shrink-0 ml-2">
                        <button type="button" onClick={() => setViewingAttachment(att)} className="text-gray-500 hover:text-gray-900 transition-all w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200" title="Visualizar"><i className="fas fa-eye text-xs"></i></button>
                        {isEditing && (
                          <>
                            <button type="button" onClick={() => handleEditLegenda(att)} className="text-gray-500 hover:text-blue-600 transition-all w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200" title="Editar Legenda"><i className="fas fa-pencil-alt text-xs"></i></button>
                            <button type="button" onClick={() => removeAttachment(att.id)} className="text-gray-500 hover:text-red-600 transition-all w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200" title="Excluir"><i className="fas fa-trash-alt text-xs"></i></button>
                          </>
                        )}
                        </div>
                    </div>
                    ))}
                    {attachments.length === 0 && <p className="text-[9px] text-gray-400 italic">Nenhum documento anexo.</p>}
                </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Histórico de Abordagens</h4>
                    <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-100 px-2 py-1 rounded border border-gray-200">{approachesHistory.length} Registros</span>
                </div>
                <div className="grid grid-cols-1 gap-2 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                    {approachesHistory.map(app => (
                    <div key={app.id} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-1.5 hover:bg-gray-100 transition-colors">
                        <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-history text-blue-600 text-[10px]"></i>
                            <span className="text-[10px] text-gray-900 font-black uppercase tracking-tighter">
                            {new Date(app.data).toLocaleDateString('pt-BR')} às {app.horario}
                            </span>
                        </div>
                        </div>
                        <div className="flex items-start gap-2">
                        <i className="fas fa-map-marker-alt text-red-600 text-[9px] mt-0.5"></i>
                        <p className="text-[10px] text-gray-500 font-bold uppercase truncate leading-tight">{app.local}</p>
                        </div>
                    </div>
                    ))}
                    {approachesHistory.length === 0 && <p className="text-[9px] text-gray-400 italic">Sem histórico de abordagens registrado.</p>}
                </div>
                </div>

                {isEditing && (
                  <div className="flex gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-2">
                  <button type="button" onClick={handleCancel} className="flex-1 bg-gray-100 text-gray-900 font-black py-3 rounded-xl uppercase text-xs hover:bg-gray-200 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSaving} className="flex-1 bg-blue-600 text-white font-black py-3 rounded-xl uppercase text-xs hover:bg-blue-500 transition-colors shadow-lg shadow-blue-600/20">
                      {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>} Salvar Alterações
                  </button>
                  </div>
                )}
            </form>
          </div>
        </div>
      </div>

      {viewingAttachment && <AttachmentViewerModal attachment={viewingAttachment} onClose={() => setViewingAttachment(null)} />}
    </>
  );
};

export default EditIndividualModal;
