
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LocationPickerModal from '../components/LocationPickerModal';
import TacticalAlert from '../components/TacticalAlert';
import { maskCPF, validateCPF } from '../lib/utils';
import { Shift, User, UserRole } from '../types';

interface PhotoRecordUI {
  id: string;
  data: string;
  isPrincipal: boolean;
}

interface NewApproachProps {
  user: User | null;
}

const FACCOES_OPTIONS = [
  { value: '', label: 'Nenhuma / Não Informada' },
  { value: 'PCC', label: 'PCC (Primeiro Comando da Capital)' },
  { value: 'CV', label: 'CV (Comando Vermelho)' },
  { value: 'TCP', label: 'TCP (Terceiro Comando Puro)' },
  { value: 'GDE', label: 'GDE (Guardioes do Estado)' },
  { value: 'BDM', label: 'BDM (Bonde do Maluco)' },
  { value: 'SDC', label: 'SDC (Sindicato do Crime)' },
  { value: 'FDN', label: 'FDN (Família do Norte)' }
];

const GOOGLE_MAPS_API_KEY = 'AIzaSyCitBS_zUZ0485b8KS6G0dOzTFsWv1XH4s';

const NewApproach: React.FC<NewApproachProps> = ({ user }) => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const residentialAddressRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<any>(null);

  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [checkingShift, setCheckingShift] = useState(true);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const [approachData, setApproachData] = useState({
    data: '',
    horario: '',
    local: '',
    objetos: ''
  });

  const [individualData, setIndividualData] = useState({
    nome: '',
    alcunha: '',
    documento: '',
    data_nascimento: '',
    mae: '',
    endereco_residencial: '',
    faccao: ''
  });

  const [photos, setPhotos] = useState<PhotoRecordUI[]>([]);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cpfError, setCpfError] = useState(false);

  useEffect(() => {
    const checkActiveShift = async () => {
      const { data, error } = await supabase
        .from('servicos_vtr')
        .select('*')
        .eq('status', 'ATIVO')
        .order('horario_inicio', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      const isUserInShift = (userName: string | undefined, shift: Shift | null) => {
        if (!userName || !shift) return false;
        const name = userName.toUpperCase();
        return (
          shift.comandante?.toUpperCase() === name ||
          shift.motorista?.toUpperCase() === name ||
          shift.patrulheiro_1?.toUpperCase() === name ||
          shift.patrulheiro_2?.toUpperCase() === name
        );
      };

      const isAdmin = user?.role === UserRole.ADMIN;

      if (isAdmin) {
        if (data) {
          setActiveShift(data);
        }
        setCheckingShift(false);
      } else {
        if (!data || error) {
          setAlertMessage('BLOQUEIO TÁTICO: Você não possui um serviço ativo. Redirecionando...');
          setTimeout(() => navigate('/'), 3000);
        } else if (!isUserInShift(user?.nome, data)) {
          setAlertMessage('VIOLAÇÃO DE ACESSO: Você não está escalado neste serviço. Acesso negado.');
          setTimeout(() => navigate('/'), 3000);
        } else {
          setActiveShift(data);
          setCheckingShift(false);
        }
      }
    };
    checkActiveShift();
  }, [navigate, user]);

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const msDate = new Date(utc + (3600000 * -4));
      
      const yyyy = msDate.getFullYear();
      const mm = String(msDate.getMonth() + 1).padStart(2, '0');
      const dd = String(msDate.getDate()).padStart(2, '0');
      const hh = String(msDate.getHours()).padStart(2, '0');
      const min = String(msDate.getMinutes()).padStart(2, '0');

      setApproachData(prev => ({
        ...prev,
        data: `${yyyy}-${mm}-${dd}`,
        horario: `${hh}:${min}`
      }));
    };

    updateDateTime();
    const timer = setInterval(updateDateTime, 30000); 
    return () => clearInterval(timer);
  }, []);

  const initAutocomplete = () => {
    if (!residentialAddressRef.current || !(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) return;

    try {
      const google = (window as any).google;
      const options = {
        componentRestrictions: { country: "br" },
        fields: ['formatted_address', 'address_components', 'geometry'],
        types: ['address']
      };

      autocompleteInstance.current = new google.maps.places.Autocomplete(
        residentialAddressRef.current, 
        options
      );

      autocompleteInstance.current.addListener('place_changed', () => {
        const place = autocompleteInstance.current.getPlace();
        if (!place.formatted_address) return;
        setIndividualData(prev => ({ ...prev, endereco_residencial: place.formatted_address }));
      });
    } catch (err) {
      console.error("Erro ao inicializar Autocomplete:", err);
    }
  };

  useEffect(() => {
    if (checkingShift) return;

    const loadScriptAndInit = () => {
      if (!(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) {
        const scriptId = 'google-maps-script-new-approach';
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
    const timer = setTimeout(initAutocomplete, 500);
    return () => clearTimeout(timer);
  }, [checkingShift]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = maskCPF(e.target.value);
    setIndividualData({ ...individualData, documento: masked });
    if (masked.length === 14) setCpfError(!validateCPF(masked));
    else setCpfError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!individualData.nome) return alert('Nome do abordado é obrigatório.');
    if (!approachData.local) return alert('Localização da abordagem é obrigatória.');

    setIsSaving(true);
    try {
      const { data: newInd, error: indError } = await supabase
        .from('individuos')
        .insert([{
          nome: individualData.nome,
          alcunha: individualData.alcunha,
          documento: individualData.documento,
          data_nascimento: individualData.data_nascimento,
          mae: individualData.mae,
          endereco: individualData.endereco_residencial,
          faccao: individualData.faccao,
          created_at: new Date().toISOString()
        }])
        .select().single();

      if (indError) throw indError;

      const { error: appError } = await supabase
        .from('abordagens')
        .insert([{
          data: approachData.data,
          horario: approachData.horario,
          local: approachData.local,
          objetos_apreendidos: approachData.objetos,
          individuo_id: newInd.id,
          individuo_nome: individualData.nome,
          relatorio: `Abordagem registrada via Terminal SGAFT.`
        }]);

      if (appError) throw appError;

      alert('Registro finalizado com sucesso!');
      navigate('/abordagens');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao sincronizar registro: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingShift) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        {alertMessage && <TacticalAlert message={alertMessage} onClose={() => setAlertMessage(null)} />}
        <i className="fas fa-satellite-dish fa-spin text-blue-600 text-5xl mb-6"></i>
        <p className="text-white font-black uppercase tracking-widest text-xs">Sincronizando Terminal...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-600/20">
            <i className="fas fa-file-signature text-white text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Nova Abordagem</h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2">
              {activeShift ? `CMD: ${activeShift.comandante}` : 'REGISTRO ADMIN'}
            </p>
          </div>
        </div>
        <div className="hidden sm:block bg-slate-800 border border-slate-700 px-4 py-2 rounded-xl">
           <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Sessão Segura</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
              <i className="fas fa-map-marked-alt text-blue-500 mr-2"></i> Localização e Ocorrência
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Local da Abordagem</label>
              <div className="relative group">
                <input 
                  type="text" 
                  readOnly
                  placeholder="Selecione no mapa..."
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-4 pr-12 py-4 rounded-2xl outline-none font-bold text-sm cursor-default" 
                  value={approachData.local}
                />
                <button 
                  type="button"
                  onClick={() => setIsMapOpen(true)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 hover:bg-blue-500 text-white w-12 h-12 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                >
                  <i className="fas fa-map-pin text-lg"></i>
                </button>
              </div>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Apreensões</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none font-bold text-sm" 
                placeholder="Armas, drogas, objetos..." 
                value={approachData.objetos} 
                onChange={e => setApproachData({...approachData, objetos: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
              <i className="fas fa-user-shield text-yellow-500 mr-2"></i> Identificação do Abordado
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none font-bold text-sm" 
                placeholder="NOME SEM ABREVIAÇÕES" 
                value={individualData.nome} 
                onChange={e => setIndividualData({...individualData, nome: e.target.value.toUpperCase()})} 
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Alcunha</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none font-bold text-sm" value={individualData.alcunha} onChange={e => setIndividualData({...individualData, alcunha: e.target.value})} />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CPF</label>
              <input type="text" className={`w-full bg-slate-900 border ${cpfError ? 'border-red-500' : 'border-slate-700'} text-white p-4 rounded-2xl outline-none font-bold text-sm`} value={individualData.documento} onChange={handleCpfChange} maxLength={14} />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Residência</label>
              <div className="relative group">
                <input 
                  type="text" 
                  ref={residentialAddressRef} 
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-yellow-600 transition-all font-bold text-sm" 
                  placeholder="Buscar endereço..." 
                  defaultValue={individualData.endereco_residencial} 
                />
                <i className="fas fa-search-location absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-yellow-600 transition-all"></i>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Facção</label>
              <select className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none appearance-none font-bold text-sm" value={individualData.faccao} onChange={e => setIndividualData({...individualData, faccao: e.target.value})}>
                {FACCOES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col sm:flex-row gap-4">
          <button type="button" onClick={() => navigate(-1)} className="flex-1 bg-slate-700 text-white font-black py-4 rounded-2xl uppercase text-xs">Sair</button>
          <button type="submit" disabled={isSaving} className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center uppercase text-sm">
            {isSaving ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-save mr-3"></i>} 
            {isSaving ? 'Sincronizando...' : 'Concluir Abordagem'}
          </button>
        </div>
      </form>

      {isMapOpen && (
        <LocationPickerModal 
          onClose={() => setIsMapOpen(false)} 
          onConfirm={(addr) => setApproachData({...approachData, local: addr})} 
        />
      )}
    </div>
  );
};

export default NewApproach;
