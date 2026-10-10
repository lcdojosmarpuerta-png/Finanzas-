import React, { useState, useEffect, useMemo } from 'react';
import {
  BellRing,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  X,
  ChevronRight,
  TrendingDown,
  Landmark,
  ArrowRight,
  ShieldAlert,
  Bell,
  Check,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { ExpenseItem, DebtItem } from '../../types/finance.ts';
import {
  getNotificationPermission,
  requestNotificationPermission,
  sendTestNotification,
} from '../../services/notificationService.ts';

export interface DuePaymentItem {
  id: string;
  type: 'expense' | 'debt';
  title: string;
  creditorOrCategory: string;
  amountUSD: number;
  dueDate: string;
  diffDays: number;
  isOverdue: boolean;
  isDueToday: boolean;
  isDueSoon: boolean;
  rawExpense?: ExpenseItem;
  rawDebt?: DebtItem;
}

export function calculateDiffDays(dueDateStr: string): number {
  if (!dueDateStr) return 999;
  const parts = dueDateStr.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const due = new Date(y, m, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffTime = due.getTime() - today.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }
  const parsed = new Date(dueDateStr);
  if (isNaN(parsed.getTime())) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return Math.round((parsed.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

interface DuePaymentAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DuePaymentAlertModal: React.FC<DuePaymentAlertModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    data,
    bcvRate,
    markExpenseAsPaid,
    setActiveModule,
    getCategoryById,
  } = useFinance();

  const [paidItemIds, setPaidItemIds] = useState<Record<string, boolean>>({});
  const [notifPermission, setNotifPermission] = useState(getNotificationPermission());
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setNotifPermission(getNotificationPermission());
  }, []);

  const handleRequestNotifications = async () => {
    const res = await requestNotificationPermission();
    setNotifPermission(res);
    if (res === 'granted') {
      setTestSent(true);
      sendTestNotification();
      setTimeout(() => setTestSent(false), 3500);
    }
  };

  // Collect all pending payments (pending expenses + active debts)
  const dueItems = useMemo<DuePaymentItem[]>(() => {
    const list: DuePaymentItem[] = [];

    // 1. Pending Expenses
    data.expenses.forEach((e) => {
      if (e.status === 'pendiente') {
        const dueDate = e.dueDate || e.date;
        const diffDays = calculateDiffDays(dueDate);
        // Alert if overdue (diffDays < 0), due today (0), or due soon within 3 days (1..3)
        if (diffDays <= 3) {
          const category = getCategoryById(e.categoryId);
          list.push({
            id: e.id,
            type: 'expense',
            title: e.description,
            creditorOrCategory: category?.name || 'Gasto Pendiente',
            amountUSD: e.amountUSD,
            dueDate,
            diffDays,
            isOverdue: diffDays < 0,
            isDueToday: diffDays === 0,
            isDueSoon: diffDays > 0 && diffDays <= 3,
            rawExpense: e,
          });
        }
      }
    });

    // 2. Active Debts
    data.debts.forEach((d) => {
      if (d.status === 'activa') {
        const paidSoFar = d.payments.reduce((acc, p) => acc + p.amountUSD, 0);
        const remainingUSD = Math.max(0, d.totalAmountUSD - paidSoFar);
        if (remainingUSD > 0.01) {
          const dueDate = d.dueDate || d.date;
          const diffDays = calculateDiffDays(dueDate);
          if (diffDays <= 3) {
            list.push({
              id: d.id,
              type: 'debt',
              title: d.description,
              creditorOrCategory: d.creditor,
              amountUSD: remainingUSD,
              dueDate,
              diffDays,
              isOverdue: diffDays < 0,
              isDueToday: diffDays === 0,
              isDueSoon: diffDays > 0 && diffDays <= 3,
              rawDebt: d,
            });
          }
        }
      }
    });

    // Sort by urgency: most overdue first, then due today, then due soon
    return list.sort((a, b) => a.diffDays - b.diffDays);
  }, [data.expenses, data.debts, getCategoryById]);

  const handlePayExpenseNow = (id: string) => {
    setPaidItemIds((prev) => ({ ...prev, [id]: true }));
    markExpenseAsPaid(id);
  };

  const handleGoToPending = () => {
    setActiveModule('pendientes');
    onClose();
  };

  const handleGoToDebts = () => {
    setActiveModule('deudas');
    onClose();
  };

  const handleSnooze = () => {
    try {
      sessionStorage.setItem('dismissed_due_alert_time', (Date.now() + 30 * 60 * 1000).toString());
    } catch {
      // ignore
    }
    onClose();
  };

  if (!isOpen) return null;

  const overdueCount = dueItems.filter((i) => i.isOverdue).length;
  const dueTodayCount = dueItems.filter((i) => i.isDueToday).length;
  const dueSoonCount = dueItems.filter((i) => i.isDueSoon).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#1E1E1E] to-[#151515] border border-amber-500/40 rounded-3xl p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)] overflow-hidden max-h-[90vh] flex flex-col">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-neutral-800 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center shadow-lg shadow-amber-500/10 shrink-0 animate-bounce">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Alerta Preventiva
                </span>
                {overdueCount > 0 && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-500/15 border border-red-500/30 px-2 py-0.5 rounded-full">
                    {overdueCount} vencidos
                  </span>
                )}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight mt-0.5">
                Recordatorio de Pagos Pendientes por Vencer
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-xl hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Cerrar recordatorio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Subtitle / summary info */}
        <div className="mt-3.5 mb-3 bg-[#121212] border border-neutral-800/90 rounded-2xl p-3 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-neutral-300">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Tienes <strong className="text-amber-400 font-mono">{dueItems.length}</strong>{' '}
              {dueItems.length === 1 ? 'compromiso próximo a vencer' : 'compromisos próximos a vencer o vencidos'}:
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            {dueTodayCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 font-bold">
                {dueTodayCount} Hoy
              </span>
            )}
            {dueSoonCount > 0 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold">
                {dueSoonCount} Próximos
              </span>
            )}
          </div>
        </div>

        {/* Banner de Notificaciones del Sistema / Segundo Plano */}
        <div className="mb-3 px-3.5 py-2.5 bg-gradient-to-r from-amber-500/10 via-[#161616] to-emerald-500/10 border border-neutral-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2.5 text-xs">
            <Bell className="w-4 h-4 text-[#FFD700] shrink-0" />
            <div className="text-[11px] text-neutral-300">
              <span className="font-bold text-white">Alertas en Segundo Plano: </span>
              {notifPermission === 'granted' ? (
                <span className="text-emerald-400">Activas. Recibirás avisos en tu pantalla aun cuando la app esté minimizada.</span>
              ) : (
                <span className="text-neutral-400">Actívalas para recibir alertas del sistema incluso cuando no tengas la app en primer plano.</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {notifPermission === 'granted' ? (
              <button
                type="button"
                onClick={() => {
                  setTestSent(true);
                  sendTestNotification();
                  setTimeout(() => setTestSent(false), 3000);
                }}
                disabled={testSent}
                className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                title="Probar notificación en tu sistema operativo"
              >
                {testSent ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Bell className="w-3.5 h-3.5 text-amber-400" />}
                <span>{testSent ? '¡Notificación Enviada!' : 'Probar Notificación'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleRequestNotifications}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-[#FFD700] hover:from-amber-400 hover:to-yellow-400 text-black text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95 flex items-center gap-1.5"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Activar Avisos del Sistema</span>
              </button>
            )}
          </div>
        </div>

        {/* List of Due Items (Scrollable) */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-1 custom-scrollbar">
          {dueItems.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-white">¡No tienes pagos próximos a vencer!</p>
              <p className="text-xs text-neutral-400 max-w-xs mx-auto">
                Todos tus compromisos están al día o no tienen vencimiento en los próximos 3 días.
              </p>
            </div>
          ) : (
            dueItems.map((item) => {
              const isPaid = paidItemIds[item.id];
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPaid
                      ? 'bg-emerald-500/10 border-emerald-500/40 opacity-75'
                      : item.isOverdue
                      ? 'bg-[#181212] border-red-500/40 hover:border-red-500/60'
                      : item.isDueToday
                      ? 'bg-[#19160e] border-yellow-500/40 hover:border-yellow-500/60'
                      : 'bg-[#161616] border-amber-500/30 hover:border-amber-500/50'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Urgency Badge */}
                      {item.isOverdue ? (
                        <span className="text-[10px] font-bold text-red-400 bg-red-500/20 border border-red-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          ¡Vencido hace {Math.abs(item.diffDays)} {Math.abs(item.diffDays) === 1 ? 'día' : 'días'}!
                        </span>
                      ) : item.isDueToday ? (
                        <span className="text-[10px] font-bold text-yellow-300 bg-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          ¡Vence Hoy!
                        </span>
                      ) : item.diffDays === 1 ? (
                        <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Vence Mañana
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/15 border border-amber-500/25 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Vence en {item.diffDays} días
                        </span>
                      )}

                      <span className="text-[10px] font-semibold text-neutral-400 bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded-full">
                        {item.type === 'expense' ? 'Gasto' : 'Deuda'} · {item.creditorOrCategory}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white truncate max-w-sm">
                      {item.title}
                    </h4>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono">
                      <span>Vencimiento: <strong className="text-neutral-200">{item.dueDate}</strong></span>
                    </div>
                  </div>

                  {/* Amounts & Quick action */}
                  <div className="flex items-center justify-between sm:justify-end gap-3.5 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80 shrink-0">
                    <div className="text-left sm:text-right">
                      <p className="text-base font-extrabold font-mono text-white tabular-nums">
                        {formatUSD(item.amountUSD)}
                      </p>
                      <p className="text-[11px] font-mono text-[#FFD700] tabular-nums">
                        {formatBs(calcBs(item.amountUSD, bcvRate))}
                      </p>
                    </div>

                    {isPaid ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40">
                        <CheckCircle2 className="w-4 h-4" /> Pagado
                      </span>
                    ) : item.type === 'expense' ? (
                      <button
                        onClick={() => handlePayExpenseNow(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2ECC71] hover:bg-emerald-600 text-black text-xs font-extrabold shadow transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Pagar Deuda</span>
                      </button>
                    ) : (
                      <button
                        onClick={handleGoToDebts}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white text-xs font-bold shadow transition-all cursor-pointer active:scale-95 shrink-0"
                      >
                        <Landmark className="w-3.5 h-3.5" />
                        <span>Abonar Deuda</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3.5 border-t border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={handleGoToPending}
              className="text-xs text-[#FFD700] hover:text-yellow-300 font-semibold underline underline-offset-2 flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos los pendientes en su módulo</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSnooze}
              className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Posponer aviso por 30 minutos"
            >
              Recordar más tarde
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#FFD700] to-[#E6B800] hover:from-yellow-400 hover:to-yellow-500 text-black text-xs font-bold transition-all cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
