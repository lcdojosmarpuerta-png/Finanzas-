import React, { useState, useEffect } from 'react';
import { BellRing, ChevronRight, X, AlertTriangle, Clock, Bell, Check } from 'lucide-react';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../../services/notificationService';

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
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleEnableNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      setTestSent(true);
      sendTestNotification();
      setTimeout(() => setTestSent(false), 3500);
    }
  };

  if (dueCount === 0 || dismissed) return null;

  return (
    <aside
      aria-label="Alerta emergente de pagos pendientes por vencer"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 left-3 sm:left-auto z-40 max-w-sm bg-gradient-to-r from-[#1E1E1E] via-[#1A1A1A] to-[#171717] border border-amber-500/50 rounded-2xl p-3.5 sm:p-4 shadow-[0_12px_40px_rgba(0,0,0,0.85)] animate-in slide-in-from-bottom-5 duration-300 backdrop-blur-md"
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

      {/* Notificaciones del Sistema / Segundo Plano */}
      <div className="mt-2.5 p-2 rounded-xl bg-[#121212] border border-neutral-800 text-[10px] flex items-center justify-between gap-2">
        {notifPermission === 'granted' ? (
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Avisos en segundo plano activos</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold transition-colors cursor-pointer"
          >
            <Bell className="w-3 h-3" />
            <span>Activar avisos del sistema (segundo plano)</span>
          </button>
        )}

        {notifPermission === 'granted' && (
          <button
            type="button"
            onClick={() => {
              setTestSent(true);
              sendTestNotification();
              setTimeout(() => setTestSent(false), 3000);
            }}
            disabled={testSent}
            className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[9px] font-mono transition-colors cursor-pointer"
            title="Probar notificación en tu sistema operativo"
          >
            {testSent ? '✓ Enviada' : 'Probar'}
          </button>
        )}
      </div>

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
