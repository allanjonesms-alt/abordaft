
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../lib/googleMaps';

interface LocationPickerModalProps {
  onClose: () => void;
  onConfirm: (address: string) => void;
}

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ onClose, onConfirm }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState('Carregando localização...');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const googleMap = useRef<any>(null);
  const marker = useRef<any>(null);
  const geocoder = useRef<any>(null);

  useEffect(() => {
    const initMap = () => {
      if (!mapRef.current || !(window as any).google || !(window as any).google.maps) return;

      const defaultPos = { lat: -18.4485, lng: -54.7592 }; // Coxim, MS como centro padrão

      try {
        const google = (window as any).google;
        
        // Inicialização via namespace tradicional (libraries=marker já carrega AdvancedMarker nel namespace)
        googleMap.current = new google.maps.Map(mapRef.current, {
          center: defaultPos,
          zoom: 15,
          mapId: "SGAFT_TACTICAL_MAP",
          disableDefaultUI: true,
          zoomControl: true,
        });

        geocoder.current = new google.maps.Geocoder();

        // Tenta usar AdvancedMarkerElement via namespace se disponível, senão fallback para Marker
        if (google.maps.marker && google.maps.marker.AdvancedMarkerElement) {
          marker.current = new google.maps.marker.AdvancedMarkerElement({
            position: defaultPos,
            map: googleMap.current,
            gmpDraggable: true,
            title: "Local da Abordagem"
          });

          marker.current.addListener('dragend', () => {
            const pos = {
              lat: marker.current.position.lat,
              lng: marker.current.position.lng
            };
            updateAddress(pos);
          });
        } else {
          marker.current = new google.maps.Marker({
            position: defaultPos,
            map: googleMap.current,
            draggable: true,
            title: "Local da Abordagem"
          });

          marker.current.addListener('dragend', (e: any) => {
            const pos = {
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            };
            updateAddress(pos);
          });
        }

        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const userPos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };
              googleMap.current.setCenter(userPos);
              if (marker.current.position) {
                marker.current.position = userPos;
              } else {
                marker.current.setPosition(userPos);
              }
              updateAddress(userPos);
              setIsLoading(false);
            },
            () => {
              updateAddress(defaultPos);
              setIsLoading(false);
            }
          );
        } else {
          updateAddress(defaultPos);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Erro ao carregar mapa tradicional:", err);
        setError(`Erro técnico: ${err.message || 'Falha na inicialização do Google Maps.'}`);
        setIsLoading(false);
      }
    };

    const setup = async () => {
      try {
        await loadGoogleMaps();
        initMap();
      } catch (err: any) {
        setError(err.message || 'Erro ao carregar Google Maps.');
      }
    };

    const updateAddress = (pos: any) => {
      if (!geocoder.current) return;
      geocoder.current.geocode({ location: pos }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setAddress(results[0].formatted_address);
        } else {
          console.error("Geocoding falhou:", status);
          setAddress(`Lat: ${pos.lat.toFixed(6)}, Lng: ${pos.lng.toFixed(6)} (Serviço indisponível)`);
        }
      });
    };

    setup();
  }, []);

  const handleConfirm = () => {
    onConfirm(address);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <i className="fas fa-map-marked-alt text-white"></i>
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">Posicionamento Geográfico</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Arraste o PIN para ajustar o local</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><i className="fas fa-times text-xl"></i></button>
        </div>

        <div className="flex-1 relative bg-slate-900">
          <div ref={mapRef} className="w-full h-full"></div>
          {isLoading && (
            <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center backdrop-blur-sm">
              <div className="flex flex-col items-center">
                <i className="fas fa-satellite-dish fa-spin text-blue-500 text-3xl mb-4"></i>
                <p className="text-white text-[10px] font-black uppercase tracking-widest">Sincronizando GPS...</p>
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center p-8 text-center z-20">
              <div className="bg-slate-800 p-6 rounded-2xl border border-red-500/50 shadow-2xl">
                <i className="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p className="text-white font-bold mb-2">ERRO DE LICENÇA GOOGLE</p>
                <p className="text-slate-400 text-xs mb-6 leading-relaxed">{error}</p>
                <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] hover:bg-red-500 transition-all">Recarregar Sistema</button>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-800 border-t border-slate-700">
          <div className="mb-4">
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Local Detectado</label>
            <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 flex items-start">
              <i className="fas fa-location-arrow text-blue-500 mt-1 mr-3"></i>
              <p className="text-sm text-white font-bold leading-tight">{address}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-2xl uppercase text-xs transition-all active:scale-95">
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              disabled={isLoading || !!error}
              className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl uppercase text-xs transition-all shadow-lg active:scale-95"
            >
              Confirmar Localização
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationPickerModal;
