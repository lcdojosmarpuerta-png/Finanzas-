import React, { useState } from 'react';
import { WifiOff, RefreshCw, HardDrive, ChevronDown, ChevronUp, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';

export const OfflineBanner: React.FC = () => {
  const {
    effectiveIsOnline,
    isSimulatingOffline,
    checkConnectivity,
    storageStats,
    bcvRate,
    offlineBannerDismissed,
    setOfflineBannerDismissed,
    setIsOfflineStatusModalOpen,
  } = useFinance();

  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  if (effectiveIsOnline) {
    return null;
  }

  const handleCheckConnection = async () => {
    setIsChecking(true);
    setFeedback(null);
    const connected = await checkConnectivity();
    setIsChecking(false);
    if (!connected) {
      setFeedback('Aún sin conexión a internet. Los datos de LocalStorage siguen listos para consulta.');
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  // If dismissed by user, render a compact floating or top bar button so they can re-open it anytime
  if (offlineBannerDismissed) {
    return (
      <aside aria-label="Aviso compacto de modo sin conexión" className="w-full bg-amber-950/80 border-b border-amber-600/40 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3">
          <button
            onClick={() => setOfflineBannerDismissed(false)}
            className="flex items-center gap-2 font-medium hover:text-amber-100 transition-colors cursor-pointer text-left"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block shrink-0" />
            <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>
              <strong>Modo Sin Conexión:</strong> {storageStats.totalRecords} registros disponibles en LocalStorage. Clic para expandir.
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOfflineStatusModalOpen(true)}
              className="text-[11px] underline underline-offset-2 text-amber-300 hover:text-white"
            >
              Ver Estado
            </button>
            <button
              onClick={() => setOfflineBannerDismissed(false)}
              className="p-1 rounded text-amber-400 hover:text-white transition-colors"
              title="Expandir aviso completo"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside aria-label="Aviso de modo sin conexión" className="w-full bg-gradient-to-r from-[#2A1605] via-[#201004] to-[#2A1605] border-b-2 border-amber-500/50 px-4 sm:px-6 py-3 shadow-[0_8px_25px_rgba(245,158,11,0.15)] relative z-25">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Icon & Explanatory Text */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <WifiOff className="w-5 h-5 animate-pulse" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-tight flex items-center gap-1.5">
                Modo Sin Conexión (Offline) Activo
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-semibold">
                LocalStorage Activo
              </span>
              {isSimulatingOffline && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Modo Simulado
                </span>
              )}
            </div>

            <p className="text-xs text-amber-100/90 mt-0.5 leading-relaxed">
              No se detecta conexión a internet. <strong>Todos tus registros, saldos, categorías y reportes se encuentran guardados y disponibles para consulta</strong> en este navegador.
            </p>

            <div className="flex items-center gap-3 mt-1 text-[11px] text-amber-200/80 font-mono flex-wrap">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                {storageStats.totalRecords} registros en memoria local
              </span>
              <span>·</span>
              <span>Tasa BCV en caché: Bs. {bcvRate.toFixed(2)}</span>
              {feedback && (
                <span className="text-amber-300 font-sans font-bold bg-amber-900/60 px-2 py-0.5 rounded border border-amber-600/50">
                  {feedback}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            onClick={handleCheckConnection}
            disabled={isChecking}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Verificar si la conexión a internet ha vuelto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin text-amber-300' : ''}`} />
            <span>{isChecking ? 'Comprobando...' : 'Reintentar Red'}</span>
          </button>

          <button
            onClick={() => setIsOfflineStatusModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            title="Ver detalles de los datos persistidos en este dispositivo"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Detalles del Almacenamiento</span>
          </button>

          <button
            onClick={() => setOfflineBannerDismissed(true)}
            className="p-1.5 rounded-xl text-amber-300/80 hover:text-white hover:bg-amber-900/50 transition-colors ml-1 cursor-pointer"
            title="Minimizar este aviso"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
