import React, { useState } from 'react';
import { BellRing, ChevronRight, X, AlertTriangle, Clock } from 'lucide-react';

interface DuePaymentFloatingAlertProps {
  dueCount: number;
  overdueCount: number;
  dueTodayCount: number;
  onOpenModal: () => void;
}

export const DuePaymentFloatingAlert: React.FC<DuePaymentFloatingAlertProps> = ({
  dueCount,
  overdueCount,
  dueTodayCount,
  onOpenModal,
}) => {
  const [dismissed, setDismissed] = useState(false);

  if (dueCount === 0 || dismissed) return null;

  return (
    <aside
      aria-label="Alerta emergente de pagos pendientes por vencer"
      className="fixed bottom-6 right-4 sm:right-6 z-40 max-w-sm w-[calc(100vw-2rem)] bg-gradient-to-r from-[#1E1E1E] via-[#1A1A1A] to-[#171717] border border-amber-500/50 rounded-2xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shrink-0 shadow-md shadow-amber-500/10">
            <BellRing className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono uppercase font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                ¡Atención!
              </span>
              {overdueCount > 0 ? (
                <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {overdueCount} vencidos
                </span>
              ) : dueTodayCount > 0 ? (
                <span className="text-[10px] font-bold text-yellow-300 bg-yellow-500/20 border border-yellow-500/30 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" /> {dueTodayCount} vencen hoy
                </span>
              ) : null}
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white mt-1">
              Pagos Pendientes Próximos a Vencer
            </h4>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 transition-colors cursor-pointer"
          title="Ocultar aviso flotante"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-neutral-300 mt-2 font-medium leading-relaxed">
        Tienes <strong className="text-amber-400 font-mono">{dueCount}</strong>{' '}
        {dueCount === 1 ? 'pago pendiente próximo' : 'pagos pendientes próximos'} a su fecha límite o vencidos.
      </p>

      <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between gap-2">
        <button
          onClick={() => setDismissed(true)}
          className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
        >
          Descartar
        </button>

        <button
          onClick={onOpenModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-[#FFD700] hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-extrabold shadow-md transition-all cursor-pointer active:scale-95"
        >
          <span>Ver Detalles & Pagar</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </aside>
  );
};
