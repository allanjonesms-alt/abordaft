import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LocationPickerModal from '../components/LocationPickerModal';
import { maskCPF, validateCPF } from '../lib/utils';

interface PhotoRecordUI {
  id: string;
  data: string;
  isPrincipal: boolean;
}

const FACCOES_OPTIONS = [
  { value: '', label: 'Nenhuma / Não Informada' },
  { value: 'PCC', label: 'PCC (Primeiro Comando da Capital)' },
  { value: 'CV', label: 'CV (Comando Vermelho)' },
  { value: 'TCP', label: 'TCP (Terceiro Comando Puro)' },
  { value: 'GDE', label: 'GDE (Guardiões do Estado)' },
  { value: 'BDM', label: 'BDM (Bonde do Maluco)' },
  { value: 'SDC', label: 'SDC (Sindicato do Crime)' },
  { value: 'FDN', label: 'FDN (Família do Norte)' }
];

const MS_CITIES_ALLOWED = [
  'COXIM', 
  'SONORA', 
  'RIO VERDE DE MATO GROSSO', 
  'RIO VERDE DE MT', 
  'PEDRO GOMES', 
  'ALCINÓPOLIS', 
  'FIGUEIRÃO', 
  'COSTA RICA', 
  'RIO NEGRO'
];

const NORTH_MS_BOUNDS = {
  north: -17.50,
  south: -19.80,
  east: -52.50,
  west: -55.50,
};

const GOOGLE_MAPS_API_KEY = 'AIzaSyCitBS_zUZ0485b8KS6G0dOzTFsWv1XH4s';

const NewApproach: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const residentialAddressRef = useRef<HTMLInputElement>(null);
  const autocompleteInstance = useRef<any>(null);

  const [approachData, setApproachData] = useState({
    data: '',
    horario: '',
    local: '',
    vtr: '',
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

  useEffect(() => {
    const initAutocomplete = () => {
      if (!residentialAddressRef.current || !(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) return;

      try {
        const google = (window as any).google;
        const options = {
          componentRestrictions: { country: "br" },
          fields: ['formatted_address', 'address_components', 'geometry'],
          types: ['address'],
          locationRestriction: NORTH_MS_BOUNDS,
          strictBounds: true
        };

        autocompleteInstance.current = new google.maps.places.Autocomplete(
          residentialAddressRef.current, 
          options
        );

        autocompleteInstance.current.addListener('place_changed', () => {
          const place = autocompleteInstance.current.getPlace();
          if (!place.address_components) return;

          const cityComponent = place.address_components.find((c: any) => 
            c.types.includes('administrative_area_level_2') || c.types.includes('locality')
          );
          const city = cityComponent?.long_name?.toUpperCase() || '';

          const isAllowed = MS_CITIES_ALLOWED.some(allowedCity => city.includes(allowedCity));

          if (!isAllowed) {
            alert(`ALERTA: Endereço em "${city}" bloqueado.\nO sistema permite apenas cadastros nas cidades de: Coxim, Sonora, Rio Verde, Pedro Gomes, Alcinópolis, Figueirão, Costa Rica ou Rio Negro.`);
            setIndividualData(prev => ({ ...prev, endereco_residencial: '' }));
            if (residentialAddressRef.current) residentialAddressRef.current.value = '';
          } else {
            setIndividualData(prev => ({ ...prev, endereco_residencial: place.formatted_address }));
          }
        });
      } catch (err) {
        console.error("Erro ao inicializar Autocomplete tradicional:", err);
      }
    };

    const loadScript = () => {
      if (!(window as any).google || !(window as any).google.maps || !(window as any).google.maps.places) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`;
        script.async = true;
        script.defer = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);
      } else {
        initAutocomplete();
      }
    };

    loadScript();
  }, []);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setPhotos(prev => [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            data: base64,
            isPrincipal: prev.length === 0
          }]);
        };
        reader.readAsDataURL(file);
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => {
      const filtered = prev.filter(p => p.id !== id);
      if (filtered.length > 0 && !filtered.some(p => p.isPrincipal)) {
        filtered[0].isPrincipal = true;
      }
      return filtered;
    });
  };

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
          vtr: approachData.vtr,
          objetos_apreendidos: approachData.objetos,
          relatorio: `Abordagem tática registrada. Local: ${approachData.local}. Nome: ${individualData.nome}.`
        }]);

      if (appError) throw appError;

      if (photos.length > 0 && newInd) {
        const photosPayload = photos.map((p, idx) => ({
          individuo_id: newInd.id,
          path: p.data,
          is_primary: p.isPrincipal,
          sort_order: idx,
          created_at: new Date().toISOString()
        }));
        await supabase.from('fotos_individuos').insert(photosPayload);
      }

      alert('Registro finalizado com sucesso!');
      navigate('/abordagens');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao sincronizar registro: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <div className="flex items-center space-x-4 mb-8">
        <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-600/20">
          <i className="fas fa-file-signature text-white text-2xl"></i>
        </div>
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Novo Registro de Abordagem</h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-2 flex items-center">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></span>
            Terminal Tático Ativo
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 pb-12">
        {/* Bloco 1: Localização */}
        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
              <i className="fas fa-map-marked-alt text-blue-500 mr-2"></i> Localização e VTR
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Local da Abordagem (GPS/Mapa)</label>
              <div className="relative group">
                <input 
                  type="text" 
                  readOnly
                  placeholder="Selecione a localização exata no mapa..."
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
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Prefixo da Viatura</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none font-bold text-sm" 
                placeholder="Ex: FT-01" 
                value={approachData.vtr} 
                onChange={e => setApproachData({...approachData, vtr: e.target.value.toUpperCase()})}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Objetos / Apreensões</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none font-bold text-sm" 
                placeholder="Armas, entorpecentes..." 
                value={approachData.objetos} 
                onChange={e => setApproachData({...approachData, objetos: e.target.value})}
              />
            </div>
          </div>
        </div>

        {/* Bloco 2: Indivíduo */}
        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <div className="border-b border-slate-700 pb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
              <i className="fas fa-user-shield text-yellow-500 mr-2"></i> Identificação do Indivíduo
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none font-bold text-sm" 
                placeholder="Sem abreviações" 
                value={individualData.nome} 
                onChange={e => setIndividualData({...individualData, nome: e.target.value.toUpperCase()})} 
                required
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Alcunha / Vulgo</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none font-bold text-sm" 
                placeholder="Vulgo" 
                value={individualData.alcunha} 
                onChange={e => setIndividualData({...individualData, alcunha: e.target.value})} 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">CPF</label>
              <input 
                type="text" 
                className={`w-full bg-slate-900 border ${cpfError ? 'border-red-500' : 'border-slate-700'} text-white p-4 rounded-2xl outline-none font-bold text-sm`} 
                value={individualData.documento} 
                onChange={handleCpfChange} 
                maxLength={14} 
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex justify-between items-center">
                <span>Endereço Residencial</span>
                <span className="text-yellow-600/70 text-[8px] font-black bg-yellow-600/10 px-2 py-0.5 rounded border border-yellow-600/20">RESTRITO: JURISDIÇÃO NORTE MS</span>
              </label>
              <div className="relative group">
                <input 
                  type="text" 
                  ref={residentialAddressRef}
                  className="w-full bg-slate-900 border border-slate-700 text-white pl-12 pr-4 py-4 rounded-2xl outline-none font-bold text-sm focus:ring-2 focus:ring-yellow-600 transition-all placeholder:text-slate-600" 
                  placeholder="Rua, Número - Bairro (Apenas cidades autorizadas)" 
                  defaultValue={individualData.endereco_residencial}
                />
                <i className="fas fa-search-location absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-yellow-600 transition-colors"></i>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Facção / Grupo</label>
              <select 
                className="w-full bg-slate-900 border border-slate-700 text-white p-4 rounded-2xl outline-none appearance-none font-bold text-sm" 
                value={individualData.faccao} 
                onChange={e => setIndividualData({...individualData, faccao: e.target.value})}
              >
                {FACCOES_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Bloco 3: Fotos */}
        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-700 pb-4">
            <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
              <i className="fas fa-camera text-purple-500 mr-2"></i> Registro de Imagens
            </h3>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg flex items-center"
            >
              <i className="fas fa-plus-circle mr-2"></i> Nova Foto
            </button>
            <input type="file" ref={fileInputRef} onChange={handlePhotoCapture} className="hidden" multiple accept="image/*" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
            {photos.map(photo => (
              <div key={photo.id} className={`relative aspect-square rounded-2xl border-2 overflow-hidden group transition-all ${photo.isPrincipal ? 'border-yellow-600' : 'border-slate-700'}`}>
                <img src={photo.data} className="w-full h-full object-cover" alt="Abordado" />
                <button 
                  type="button" 
                  onClick={() => removePhoto(photo.id)} 
                  className="absolute top-1 right-1 bg-red-600 text-white w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bloco 4: Ações (Botões integrados no formulário) */}
        <div className="bg-slate-800 p-6 md:p-8 rounded-3xl border border-slate-700 shadow-2xl flex flex-col sm:flex-row gap-4">
          <button 
            type="button" 
            onClick={() => navigate(-1)} 
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-slate-300 font-black py-4 rounded-2xl uppercase text-xs border border-slate-600 transition-all"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            disabled={isSaving}
            className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl transition-all flex items-center justify-center uppercase text-sm"
          >
            {isSaving ? <i className="fas fa-spinner fa-spin mr-3"></i> : <i className="fas fa-check-circle mr-3"></i>} 
            {isSaving ? 'Gravando...' : 'Salvar Abordagem'}
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