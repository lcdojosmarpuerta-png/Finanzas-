import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, X, HardDrive } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';

export const ConnectionToasts: React.FC = () => {
  const { lastConnectionEvent, clearConnectionEvent, storageStats, setIsOfflineStatusModalOpen } = useFinance();
  const [visibleToast, setVisibleToast] = useState<{
    type: 'online' | 'offline';
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!lastConnectionEvent) return;

    if (lastConnectionEvent.type === 'offline') {
      setVisibleToast({
        type: 'offline',
        title: 'Modo Sin Conexión Activado',
        message: `Se perdió la conexión a internet. Tus ${storageStats.totalRecords} registros en LocalStorage siguen 100% disponibles para consulta.`,
      });
    } else if (lastConnectionEvent.type === 'online') {
      setVisibleToast({
        type: 'online',
        title: '¡Conexión Restablecida!',
        message: 'El sistema ha recuperado la conexión a internet. Los datos están sincronizados en línea.',
      });
    }

    const timer = setTimeout(() => {
      setVisibleToast(null);
      clearConnectionEvent();
    }, 6000);

    return () => clearTimeout(timer);
  }, [lastConnectionEvent, storageStats.totalRecords, clearConnectionEvent]);

  if (!visibleToast) return null;

  const isOffline = visibleToast.type === 'offline';

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div
        className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md ${
          isOffline
            ? 'bg-[#1F140A]/95 border-amber-500/60 shadow-[0_10px_30px_rgba(245,158,11,0.25)] text-amber-200'
            : 'bg-[#0B1D13]/95 border-emerald-500/60 shadow-[0_10px_30px_rgba(46,204,113,0.25)] text-emerald-200'
        }`}
      >
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
            isOffline
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}
        >
          {isOffline ? (
            <WifiOff className="w-5 h-5 animate-pulse" />
          ) : (
            <Wifi className="w-5 h-5 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={`text-xs font-bold uppercase tracking-wider ${
                isOffline ? 'text-amber-300' : 'text-emerald-300'
              }`}
            >
              {visibleToast.title}
            </h4>
            <button
              onClick={() => {
                setVisibleToast(null);
                clearConnectionEvent();
              }}
              className="p-1 rounded text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-neutral-200 mt-1 leading-snug">
            {visibleToast.message}
          </p>

          {isOffline && (
            <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between">
              <span className="text-[10px] text-amber-300/80 font-mono flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-amber-400" />
                Consulta local activa
              </span>
              <button
                onClick={() => {
                  setVisibleToast(null);
                  setIsOfflineStatusModalOpen(true);
                }}
                className="text-[11px] font-bold text-amber-300 hover:text-white underline cursor-pointer"
              >
                Ver Almacenamiento
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
