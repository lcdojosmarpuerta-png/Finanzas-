import React from 'react';
import { DollarSign, Menu, WifiOff, BellRing, HardDrive } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';

interface HeaderProps {
  onOpenMenuCompleto: () => void;
  onGoToInicio?: () => void;
  onOpenDueAlert?: () => void;
  dueCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenuCompleto,
  onGoToInicio,
  onOpenDueAlert,
  dueCount = 0,
}) => {
  const {
    effectiveIsOnline,
    setIsOfflineStatusModalOpen,
    storageStats,
  } = useFinance();

  return (
    <header className="w-full bg-[#1A1A1A] border-b border-neutral-800/90 sticky top-0 z-30 px-3 sm:px-6 py-2.5 sm:py-3.5 transition-all shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand / Logo */}
        <button
          onClick={onGoToInicio}
          className="flex items-center gap-2 sm:gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer shrink-0"
          title="Ir al Inicio (Dashboard)"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#E6B800] text-black font-bold flex items-center justify-center shadow-lg shadow-yellow-500/15 shrink-0">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-lg font-extrabold text-white tracking-tight leading-none">
                Finanzas<span className="text-[#FFD700]">BCV</span>
              </h1>
              <span className="text-[9px] sm:text-[10px] font-mono font-medium px-1 sm:px-1.5 py-0.2 sm:py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/60 uppercase">
                Vzla
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5 hidden sm:block">
              Control de Ingresos, Egresos & Tasa Oficial
            </p>
          </div>
        </button>

        {/* Right side: Local Storage Pill + Connection indicator badge + Menu */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Local Storage Indicator Button */}
          <button
            onClick={() => setIsOfflineStatusModalOpen(true)}
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl border border-neutral-700/60 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 text-[10px] sm:text-[11px] font-semibold transition-all cursor-pointer shadow-sm"
            title={`Guardado 100% Local (${storageStats.totalRecords} registros en dispositivo). Clic para ver almacenamiento.`}
          >
            <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">Guardado Local</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </button>

          {/* Connection Status Pill */}
          {effectiveIsOnline ? (
            <button
              onClick={() => setIsOfflineStatusModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[11px] font-medium transition-colors cursor-pointer"
              title="Conexión activa a internet. Clic para ver detalles."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>En Línea</span>
            </button>
          ) : (
            <button
              onClick={() => setIsOfflineStatusModalOpen(true)}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] sm:text-xs font-bold transition-all duration-200 cursor-pointer shadow-[0_2px_10px_rgba(245,158,11,0.2)] animate-pulse"
              title="Modo sin conexión activo. Clic para ver almacenamiento local."
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="hidden xs:inline">Sin Conexión</span>
            </button>
          )}

          {/* Botón de Campana / Alerta de Pagos Pendientes */}
          {onOpenDueAlert && (
            <button
              onClick={onOpenDueAlert}
              className={`relative p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 min-w-[36px] min-h-[36px] ${
                dueCount > 0
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 shadow-lg shadow-amber-500/10'
                  : 'bg-neutral-800/80 border-neutral-700/80 text-neutral-400 hover:text-white hover:bg-neutral-700'
              }`}
              title={
                dueCount > 0
                  ? `Tienes ${dueCount} pago(s) pendiente(s) por vencer o vencidos. Clic para ver recordatorio.`
                  : 'Recordatorios de pagos al día'
              }
            >
              <BellRing className={`w-4 h-4 ${dueCount > 0 ? 'animate-bounce text-amber-400' : ''}`} />
              {dueCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-amber-500 text-white font-mono text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-[#1A1A1A] shadow-md animate-pulse">
                  {dueCount}
                </span>
              )}
            </button>
          )}

          {/* Botón de Menú Completo */}
          <button
            onClick={onOpenMenuCompleto}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6B800] hover:from-yellow-400 hover:to-yellow-500 text-black text-xs font-extrabold shadow-lg shadow-yellow-500/15 hover:shadow-yellow-500/25 transition-all duration-200 cursor-pointer min-h-[36px]"
          >
            <Menu className="w-4 h-4" />
            <span className="hidden sm:inline">Menú Completo</span>
            <span className="sm:hidden text-[11px]">Menú</span>
          </button>
        </div>
      </div>
    </header>
  );
};



