
import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { maskCPF, validateCPF } from '../lib/utils';
import { User as AppUser, Individual } from '../types';
import EditIndividualModal from './EditIndividualModal';

interface PhotoRecordUI {
  id: string;
  data: string;
  isPrincipal: boolean;
}

interface AttachmentUI {
  id: string;
  nome_arquivo: string;
  tipo_mime: string;
  data: string;
}

interface AddIndividualModalProps {
  currentUser: AppUser | null;
  onClose: () => void;
  onSave: () => void;
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyCitBS_zUZ0485b8KS6G0dOzTFsWv1XH4s';

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

const AddIndividualModal: React.FC<AddIndividualModalProps> = ({ currentUser, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nome: '',
    alcunha: '',
    data_nascimento: '',
    documento: '',
    mae: '',
    endereco: '',
    faccao: ''
  });
  const [photos, setPhotos] = useState<PhotoRecordUI[]>([]);
  const [attachments, setAttachments] = useState<AttachmentUI[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [cpfError, setCpfError] = useState(false);
  
  // Estados para Homônimos
  const [homonyms, setHomonyms] = useState<any[]>([]);
  const [showHomonymAlert, setShowHomonymAlert] = useState(false);
  const [confirmedHomonym, setConfirmedHomonym] = useState(false);
  const [isCheckingHomonym, setIsCheckingHomonym] = useState(false);
  
  // Estado para Edição de Homônimo selecionado
  const [editingHomonym, setEditingHomonym] = useState<Individual | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<any>(null);

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
      console.error("Erro ao inicializar Autocomplete:", err);
    }
  };

  useEffect(() => {
    const loadScriptAndInit = () => {
      if (!(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) {
        const scriptId = 'google-maps-script-add';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
          script.async = true;
          script.defer = true;
          script.onload = initAutocomplete;
          document.head.appendChild(script);
        }
      } else {
        initAutocomplete();
      }
    };

    loadScriptAndInit();
    const timer = setTimeout(initAutocomplete, 1000);
    return () => clearTimeout(timer);
  }, []);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setPhotos(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            data: base64String,
            isPrincipal: prev.length === 0
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64String = reader.result as string;
          setAttachments(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            nome_arquivo: file.name,
            tipo_mime: file.type,
            data: base64String
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value);
    setFormData({ ...formData, documento: masked });
    if (masked.length === 14) setCpfError(!validateCPF(masked));
    else setCpfError(false);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const performSave = async () => {
    setIsSaving(true);
    try {
      const { data: indData, error: indError } = await supabase
        .from('individuos')
        .insert([{ 
          ...formData, 
          nome: formData.nome.toUpperCase(),
          mae: formData.mae.toUpperCase(),
          created_at: new Date().toISOString(), 
          updated_at: new Date().toISOString() 
        }])
        .select().single();

      if (indError) throw indError;

      if (indData) {
        if (photos.length > 0) {
          await supabase.from('fotos_individuos').insert(photos.map((p, i) => ({
            individuo_id: indData.id, path: p.data, is_primary: p.isPrincipal, sort_order: i, created_by: currentUser?.nome
          })));
        }
        if (attachments.length > 0) {
          await supabase.from('individuos_anexos').insert(attachments.map(a => ({
            individuo_id: indData.id, nome_arquivo: a.nome_arquivo, tipo_mime: a.tipo_mime, path: a.data, created_by: currentUser?.nome
          })));
        }
      }
      onSave();
      onClose();
    } catch (err: any) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const checkHomonyms = async (nome: string) => {
    if (!nome || nome.length < 3 || confirmedHomonym) return;
    
    setIsCheckingHomonym(true);
    const nomeUpper = nome.toUpperCase();
    
    try {
      const { data: matches } = await supabase
        .from('individuos')
        .select('*, fotos_individuos(path, is_primary)')
        .eq('nome', nomeUpper);

      if (matches && matches.length > 0) {
        setHomonyms(matches);
        setShowHomonymAlert(true);
      }
    } catch (err) {
      console.error("Erro ao checar homônimos:", err);
    } finally {
      setIsCheckingHomonym(false);
    }
  };

  const handleOpenHomonymForEdit = async (h: any) => {
    // Busca os dados completos para edição
    const { data } = await supabase
      .from('individuos')
      .select('*, fotos_individuos(*)')
      .eq('id', h.id)
      .single();
    
    if (data) {
      setEditingHomonym(data as Individual);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome) return alert('Nome é obrigatório.');
    
    if (formData.documento) {
      if (!validateCPF(formData.documento)) {
        alert('CPF inválido.');
        return;
      }

      // 1. Bloqueio de CPF Duplicado
      const { data: existingCpf } = await supabase
        .from('individuos')
        .select('id, nome')
        .eq('documento', formData.documento)
        .maybeSingle();

      if (existingCpf) {
        alert(`ALERTA CRÍTICO: Este CPF já está cadastrado para o indivíduo: ${existingCpf.nome}. Não é permitido duplicar cadastros por CPF.`);
        return;
      }
    }

    // A verificação de homônimo já deve ter ocorrido no onBlur ou será confirmada aqui
    if (!confirmedHomonym) {
      const nomeUpper = formData.nome.toUpperCase();
      const { data: matches } = await supabase
        .from('individuos')
        .select('*, fotos_individuos(path, is_primary)')
        .eq('nome', nomeUpper);

      if (matches && matches.length > 0) {
        setHomonyms(matches);
        setShowHomonymAlert(true);
        return;
      }
    }

    await performSave();
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
        <div className="bg-slate-800 border border-slate-700 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center space-x-3">
              <div className="bg-yellow-600 p-2 rounded-lg"><i className="fas fa-user-plus text-white"></i></div>
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">NOVO CADASTRO</h3>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white p-2 transition-colors"><i className="fas fa-times text-2xl"></i></button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                <div className="relative">
                  <input 
                    type="text" 
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none font-bold uppercase" 
                    value={formData.nome} 
                    onChange={e => { 
                      setFormData({...formData, nome: e.target.value.toUpperCase()}); 
                      setConfirmedHomonym(false); 
                    }} 
                    onBlur={() => checkHomonyms(formData.nome)}
                    required 
                    placeholder="NOME DO ABORDADO" 
                  />
                  {isCheckingHomonym && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <i className="fas fa-spinner fa-spin text-yellow-600 text-xs"></i>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Alcunha / Vulgo</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none font-bold" value={formData.alcunha} onChange={e => setFormData({...formData, alcunha: e.target.value})} placeholder="VULGO" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Data de Nascimento</label>
                <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none font-bold" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CPF</label>
                <input type="text" className={`w-full bg-slate-900 border ${cpfError ? 'border-red-500' : 'border-slate-700'} rounded-xl px-4 py-3 text-white outline-none font-bold`} value={formData.documento} onChange={handleCpfChange} maxLength={14} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Facção</label>
                <select className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none appearance-none font-bold" value={formData.faccao} onChange={e => setFormData({...formData, faccao: e.target.value})}>
                  {FACCOES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Endereço Residencial (Google Autocomplete)</label>
                <div className="relative group">
                  <input 
                    type="text" 
                    ref={addressInputRef}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-white outline-none focus:ring-2 focus:ring-yellow-600 transition-all font-bold" 
                    placeholder="Rua, Número, Bairro, Cidade"
                    defaultValue={formData.endereco}
                  />
                  <i className="fas fa-search-location absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-yellow-600 transition-all"></i>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Filiação Materna</label>
                <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-yellow-600 outline-none font-bold uppercase" value={formData.mae} onChange={e => setFormData({...formData, mae: e.target.value.toUpperCase()})} placeholder="NOME DA MÃE" />
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between mb-2">
                 <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Documentos em Anexo</h4>
                 <button type="button" onClick={() => attachmentInputRef.current?.click()} className="text-yellow-600 hover:text-yellow-500 text-[10px] font-black uppercase flex items-center bg-yellow-600/10 px-3 py-2 rounded-lg border border-yellow-600/30 transition-all">
                  <i className="fas fa-paperclip mr-2"></i> Adicionar Anexo
                </button>
                <input type="file" ref={attachmentInputRef} onChange={handleAttachmentChange} className="hidden" multiple />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {attachments.map(att => (
                  <div key={att.id} className="bg-slate-900 border border-slate-700 rounded-xl p-3 flex items-center justify-between group">
                    <div className="flex items-center overflow-hidden">
                      <i className="fas fa-file-alt text-slate-500 mr-3"></i>
                      <span className="text-xs text-slate-300 font-bold truncate uppercase">{att.nome_arquivo}</span>
                    </div>
                    <button type="button" onClick={() => removeAttachment(att.id)} className="text-slate-500 hover:text-red-500 ml-2 transition-colors"><i className="fas fa-trash-alt"></i></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-700">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Fotos de Identificação</label>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="text-yellow-600 hover:text-yellow-500 text-[10px] font-black uppercase flex items-center transition-all">
                  <i className="fas fa-camera mr-2"></i> Registrar Foto
                </button>
                <input type="file" ref={fileInputRef} onChange={handlePhotoChange} className="hidden" multiple accept="image/*" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {photos.map((photo) => (
                  <div key={photo.id} className={`relative aspect-square rounded-xl border-2 overflow-hidden transition-all ${photo.isPrincipal ? 'border-yellow-600 ring-2 ring-yellow-600/20' : 'border-slate-700'}`}>
                    <img src={photo.data} className="w-full h-full object-cover" alt="Abordado" />
                    {photo.isPrincipal && <div className="absolute top-1 left-1 bg-yellow-600 text-[8px] font-black px-1.5 rounded uppercase">Capa</div>}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4 border-t border-slate-700">
              <button type="button" onClick={onClose} className="flex-1 bg-slate-700 text-white font-black py-4 rounded-xl uppercase text-xs transition-all hover:bg-slate-600 active:scale-95">Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 bg-yellow-600 text-white font-black py-4 rounded-xl uppercase text-xs shadow-lg shadow-yellow-600/20 transition-all hover:bg-yellow-500 active:scale-95">
                {isSaving ? <i className="fas fa-spinner fa-spin mr-2"></i> : 'Sincronizar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL DE ALERTA DE HOMÔNIMO */}
      {showHomonymAlert && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border-2 border-yellow-600 w-full max-w-2xl rounded-[2.5rem] shadow-[0_0_50px_rgba(202,138,4,0.3)] overflow-hidden">
            <div className="bg-yellow-600 p-6 flex items-center gap-4">
              <i className="fas fa-exclamation-triangle text-white text-3xl animate-pulse"></i>
              <div>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter">Alerta de Homônimo</h3>
                <p className="text-yellow-100 text-[10px] font-bold uppercase tracking-widest">Já existem registros com este nome no sistema</p>
              </div>
            </div>

            <div className="p-8 space-y-6">
              <p className="text-slate-300 text-sm font-medium leading-relaxed">
                Detectamos indivíduos cadastrados com o nome <span className="text-white font-black">"{formData.nome}"</span>. 
                Por favor, verifique se o abordado já possui ficha ativa antes de criar um novo cadastro duplicado.
              </p>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {homonyms.map((h) => {
                  const capa = h.fotos_individuos?.find((f: any) => f.is_primary)?.path || h.fotos_individuos?.[0]?.path;
                  return (
                    <div 
                      key={h.id} 
                      onClick={() => handleOpenHomonymForEdit(h)}
                      className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-4 hover:border-yellow-600 group cursor-pointer transition-all"
                    >
                      <div className="w-16 h-16 bg-slate-900 rounded-xl overflow-hidden flex-shrink-0 border border-slate-700">
                        {capa ? <img src={capa} className="w-full h-full object-cover" /> : <i className="fas fa-user-secret text-slate-700 text-2xl flex items-center justify-center h-full"></i>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-white font-black uppercase text-sm truncate">{h.nome}</p>
                          <span className="text-yellow-600 text-[9px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Visualizar Ficha <i className="fas fa-external-link-alt ml-1"></i></span>
                        </div>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-yellow-600 font-bold uppercase">Vulgo: {h.alcunha || 'N/I'}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Nascimento: {h.data_nascimento ? new Date(h.data_nascimento + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/I'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-800">
                <button 
                  onClick={() => setShowHomonymAlert(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest transition-all"
                >
                  Fechar Alerta
                </button>
                <button 
                  onClick={async () => {
                    setConfirmedHomonym(true);
                    setShowHomonymAlert(false);
                  }}
                  className="flex-1 bg-yellow-600 hover:bg-yellow-500 text-white font-black py-4 rounded-2xl uppercase text-[10px] tracking-widest shadow-xl shadow-yellow-600/20 transition-all"
                >
                  Continuar com Novo Cadastro
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO DO HOMÔNIMO SELECIONADO */}
      {editingHomonym && (
        <EditIndividualModal 
          individual={editingHomonym}
          currentUser={currentUser}
          onClose={() => setEditingHomonym(null)}
          onSave={() => {
            setEditingHomonym(null);
            // Ao salvar o existente, podemos fechar o alerta de homônimo
            setShowHomonymAlert(false);
            // Recarrega lista de homônimos se necessário
            checkHomonyms(formData.nome);
          }}
        />
      )}
    </>
  );
};

export default AddIndividualModal;
