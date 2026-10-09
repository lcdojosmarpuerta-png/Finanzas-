import React from 'react';
import { DollarSign, Menu, Wifi, WifiOff, BellRing } from 'lucide-react';
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
  const { effectiveIsOnline, setIsOfflineStatusModalOpen, storageStats } = useFinance();

  return (
    <header className="w-full bg-[#1A1A1A] border-b border-neutral-800/90 sticky top-0 z-30 px-4 sm:px-6 py-3.5 transition-all shadow-lg shadow-black/30">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <button
          onClick={onGoToInicio}
          className="flex items-center gap-3 text-left hover:opacity-90 transition-opacity cursor-pointer"
          title="Ir al Inicio (Dashboard)"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#E6B800] text-black font-bold flex items-center justify-center shadow-lg shadow-yellow-500/15 shrink-0">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-none">
                Finanzas<span className="text-[#FFD700]">BCV</span>
              </h1>
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700/60 uppercase">
                Vzla
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5 hidden sm:block">
              Control de Ingresos, Egresos & Tasa Oficial
            </p>
          </div>
        </button>

        {/* Right side: Connection indicator badge + Solo el botón de Menú Completo */}
        <div className="flex items-center gap-2.5">
          {/* Connection Status Pill */}
          {effectiveIsOnline ? (
            <button
              onClick={() => setIsOfflineStatusModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 text-[11px] font-medium transition-colors cursor-pointer"
              title="Conexión activa a internet. Clic para ver detalles."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>En Línea</span>
            </button>
          ) : (
            <button
              onClick={() => setIsOfflineStatusModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold transition-all duration-200 cursor-pointer shadow-[0_2px_10px_rgba(245,158,11,0.2)] animate-pulse"
              title="Modo sin conexión activo. Clic para ver almacenamiento local."
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Sin Conexión</span>
              <span className="text-[10px] font-mono text-amber-200/90 hidden md:inline">
                ({storageStats.totalRecords} locales)
              </span>
            </button>
          )}

          {/* Botón de Campana / Alerta de Pagos Pendientes */}
          {onOpenDueAlert && (
            <button
              onClick={onOpenDueAlert}
              className={`relative p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center shrink-0 ${
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
                <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-red-500 to-amber-500 text-white font-mono text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-[#1A1A1A] shadow-md animate-pulse">
                  {dueCount}
                </span>
              )}
            </button>
          )}

          {/* Solo el botón de Menú Completo */}
          <button
            onClick={onOpenMenuCompleto}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6B800] hover:from-yellow-400 hover:to-yellow-500 text-black text-xs font-extrabold shadow-lg shadow-yellow-500/15 hover:shadow-yellow-500/25 transition-all duration-200 cursor-pointer"
          >
            <Menu className="w-4 h-4" />
            <span>Menú Completo</span>
          </button>
        </div>
      </div>
    </header>
  );
};



