
import React, { useEffect } from 'react';

interface TacticalAlertProps {
  message: string;
  onClose: () => void;
}

const TacticalAlert: React.FC<TacticalAlertProps> = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-yellow-600 w-full max-w-sm rounded-3xl shadow-[0_0_50px_rgba(202,138,4,0.3)] overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-yellow-600/20 text-yellow-500 rounded-full flex items-center justify-center mx-auto border border-yellow-600/30 animate-pulse">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <h3 className="text-white font-black uppercase tracking-widest text-sm">Alerta Operacional</h3>
          <p className="text-slate-400 text-xs font-bold uppercase leading-relaxed">
            {message}
          </p>
        </div>
        
        {/* Barra de progresso regressiva */}
        <div className="h-1 bg-slate-800 w-full">
          <div 
            className="h-full bg-yellow-600 animate-[progress_3s_linear_forwards]"
            style={{ width: '100%' }}
          ></div>
        </div>
      </div>
      
      <style>{`
        @keyframes progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
};

export default TacticalAlert;
