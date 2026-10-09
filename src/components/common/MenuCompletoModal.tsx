import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  HandCoins,
  PieChart,
  Tag,
  User,
  Trash2,
  X,
  ChevronRight,
  ShieldCheck,
  DollarSign,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  HardDrive,
  FileJson,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { ActiveModule } from '../../types/finance.ts';
import { formatUSD } from '../../services/bcvService.ts';

interface MenuCompletoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProfile: () => void;
  onOpenCategories: () => void;
  onOpenResetModal: () => void;
  onOpenReport?: () => void;
}

export const MenuCompletoModal: React.FC<MenuCompletoModalProps> = ({
  isOpen,
  onClose,
  onOpenProfile,
  onOpenCategories,
  onOpenResetModal,
  onOpenReport,
}) => {
  const {
    activeModule,
    setActiveModule,
    data,
    totalIncomeUSD,
    totalExpensesPaidUSD,
    totalExpensesPendingUSD,
    totalDebtsRemainingUSD,
    totalReceivablesPendingUSD,
    netAvailableBalanceUSD,
    effectiveIsOnline,
    setIsOfflineStatusModalOpen,
    isBackupModalOpen,
    setIsBackupModalOpen,
    storageStats,
    profiles,
  } = useFinance();

  if (!isOpen) return null;

  const pendingExpensesCount = data.expenses.filter((e) => e.status === 'pendiente').length;
  const pendingReceivablesCount = data.receivables.filter((r) => r.status === 'pendiente').length;
  const activeDebtsCount = data.debts.filter((d) => d.status === 'activa').length;

  const modules: {
    id: ActiveModule;
    title: string;
    description: string;
    icon: React.ElementType;
    badge?: number;
    stat?: string;
    color: string;
    bgColor: string;
  }[] = [
    {
      id: 'inicio',
      title: 'Inicio (Dashboard General)',
      description: 'Vista principal, saldo neto, perfil y movimientos',
      icon: LayoutDashboard,
      stat: `Saldo: ${formatUSD(netAvailableBalanceUSD)}`,
      color: 'text-[#FFD700]',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    },
    {
      id: 'ingresos',
      title: 'Ingresos',
      description: 'Control y registro de ingresos y honorarios',
      icon: TrendingUp,
      stat: `Total: +${formatUSD(totalIncomeUSD)}`,
      color: 'text-[#2ECC71]',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'egresos',
      title: 'Egresos',
      description: 'Registro de gastos pagados y presupuestos',
      icon: TrendingDown,
      stat: `Total: -${formatUSD(totalExpensesPaidUSD)}`,
      color: 'text-[#E74C3C]',
      bgColor: 'bg-red-500/10 border-red-500/30',
    },
    {
      id: 'pendientes',
      title: 'Gastos Pendientes',
      description: 'Egresos diferidos listos para liquidación',
      icon: Clock,
      badge: pendingExpensesCount,
      stat: `Por pagar: ${formatUSD(totalExpensesPendingUSD)}`,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
    },
    {
      id: 'deudas',
      title: 'Control de Deudas',
      description: 'Acreedores, abonos y liquidación total',
      icon: Landmark,
      badge: activeDebtsCount,
      stat: `Resta: ${formatUSD(totalDebtsRemainingUSD)}`,
      color: 'text-[#E74C3C]',
      bgColor: 'bg-red-500/10 border-red-500/30',
    },
    {
      id: 'cobrar',
      title: 'Cuentas por Cobrar',
      description: 'Clientes deudores y recordatorios por WhatsApp',
      icon: HandCoins,
      badge: pendingReceivablesCount,
      stat: `Pendiente: ${formatUSD(totalReceivablesPendingUSD)}`,
      color: 'text-[#2ECC71]',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      id: 'graficos',
      title: 'Gráficos & Análisis',
      description: 'Donas de flujo, comparativos de pasivos y tendencias',
      icon: PieChart,
      color: 'text-[#FFD700]',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
    },
  ];

  const handleSelect = (id: ActiveModule) => {
    setActiveModule(id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative bg-[#181818] border border-neutral-700/80 rounded-2xl sm:rounded-3xl w-full max-w-2xl p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] z-10 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FFD700] to-[#E6B800] text-black font-bold flex items-center justify-center shadow-lg shadow-yellow-500/10">
              <DollarSign className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Menú Completo del Sistema
              </h3>
              <p className="text-xs text-neutral-400">
                Acceso directo a todos los módulos, herramientas y configuraciones
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modules Grid */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-2.5 pr-1">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2 px-1">
            Módulos de Gestión
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {modules.map((m) => {
              const Icon = m.icon;
              const isActive = activeModule === m.id;

              return (
                <button
                  key={m.id}
                  onClick={() => handleSelect(m.id)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 flex items-start justify-between gap-3 group relative overflow-hidden ${
                    isActive
                      ? 'bg-neutral-800 border-[#FFD700] shadow-[0_4px_20px_rgba(255,215,0,0.15)] ring-1 ring-[#FFD700]/30'
                      : 'bg-[#1E1E1E] border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/60 shadow-md'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${m.bgColor} ${m.color}`}
                    >
                      <Icon className="w-4 h-4 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {m.title}
                        </span>
                        {isActive && (
                          <span className="text-[9px] font-bold text-[#FFD700] bg-yellow-500/20 px-1.5 py-0.2 rounded">
                            ACTIVO
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-1">
                        {m.description}
                      </p>
                      {m.stat && (
                        <p className="text-[10px] font-mono text-neutral-300 font-medium mt-1">
                          {m.stat}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0 pt-0.5">
                    {m.badge !== undefined && m.badge > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-[#E74C3C] border border-red-500/30">
                        {m.badge}
                      </span>
                    )}
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-white transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tools & Global Controls */}
          <div className="pt-4 mt-2 border-t border-neutral-800">
            <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block mb-2 px-1">
              Herramientas del Sistema
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenCategories();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1E1E1E] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-colors text-left"
              >
                <Tag className="w-4 h-4 text-[#FFD700]" />
                <div>
                  <span className="text-xs font-semibold text-white block">Categorías</span>
                  <span className="text-[10px] text-neutral-400">Crear y personalizar</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenProfile();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1E1E1E] hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 transition-colors text-left"
              >
                <User className="w-4 h-4 text-[#2ECC71]" />
                <div>
                  <span className="text-xs font-semibold text-white block">Perfiles ({profiles.length})</span>
                  <span className="text-[10px] text-neutral-400">Gestionar y cambiar</span>
                </div>
              </button>

              {onOpenReport && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenReport();
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1E1E1E] hover:bg-emerald-500/10 border border-neutral-800 hover:border-emerald-500/30 transition-colors text-left"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="text-xs font-semibold text-emerald-400 block">Reporte Excel</span>
                    <span className="text-[10px] text-neutral-400">Exportar & WhatsApp</span>
                  </div>
                </button>
              )}

              <button
                onClick={() => {
                  onClose();
                  setIsOfflineStatusModalOpen(true);
                }}
                className={`flex items-center gap-2.5 p-3 rounded-xl border transition-colors text-left ${
                  effectiveIsOnline
                    ? 'bg-[#1E1E1E] hover:bg-neutral-800 border-neutral-800 hover:border-neutral-700'
                    : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
                }`}
              >
                {effectiveIsOnline ? (
                  <Wifi className="w-4 h-4 text-emerald-400" />
                ) : (
                  <WifiOff className="w-4 h-4 text-amber-400 animate-pulse" />
                )}
                <div>
                  <span className="text-xs font-semibold text-white block flex items-center gap-1.5">
                    <span>Memoria & Red</span>
                    {!effectiveIsOnline && (
                      <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-bold">
                        Offline
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-neutral-400">
                    {storageStats.totalRecords} registros en LocalStorage
                  </span>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  setIsBackupModalOpen(true);
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1E1E1E] hover:bg-yellow-500/10 border border-neutral-800 hover:border-yellow-500/30 transition-colors text-left"
              >
                <FileJson className="w-4 h-4 text-[#FFD700]" />
                <div>
                  <span className="text-xs font-semibold text-[#FFD700] block">Copia de Seguridad</span>
                  <span className="text-[10px] text-neutral-400">Exportar & Restaurar JSON</span>
                </div>
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenResetModal();
                }}
                className="flex items-center gap-2.5 p-3 rounded-xl bg-[#1E1E1E] hover:bg-red-500/10 border border-neutral-800 hover:border-red-500/30 transition-colors text-left"
              >
                <Trash2 className="w-4 h-4 text-[#E74C3C]" />
                <div>
                  <span className="text-xs font-semibold text-[#E74C3C] block">Reiniciar Todo</span>
                  <span className="text-[10px] text-neutral-400">Limpiar registros</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFD700]" />
            Sistema Financiero & Tasa BCV
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Cerrar Menú
          </button>
        </div>
      </div>
    </div>
  );
};
