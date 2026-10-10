import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  HandCoins,
  Calendar,
  Tag,
  DollarSign,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { ActiveModule } from '../../types/finance.ts';

interface SidebarProps {
  onOpenCategories: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenCategories }) => {
  const {
    activeModule,
    setActiveModule,
    data,
  } = useFinance();

  const pendingExpensesCount = data.expenses.filter((e) => e.status === 'pendiente').length;
  const pendingReceivablesCount = data.receivables.filter((r) => r.status === 'pendiente').length;
  const activeDebtsCount = data.debts.filter((d) => d.status === 'activa').length;

  const navItems: {
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
    badge?: number;
    badgeColor?: string;
    activeColor?: string;
  }[] = [
    {
      id: 'inicio',
      label: 'Inicio (Dashboard)',
      icon: LayoutDashboard,
      activeColor: 'text-[#FFD700]',
    },
    {
      id: 'ingresos',
      label: 'Ingresos',
      icon: TrendingUp,
      activeColor: 'text-[#2ECC71]',
    },
    {
      id: 'egresos',
      label: 'Egresos',
      icon: TrendingDown,
      activeColor: 'text-[#E74C3C]',
    },
    {
      id: 'pendientes',
      label: 'Pendientes',
      icon: Clock,
      badge: pendingExpensesCount,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
      activeColor: 'text-amber-400',
    },
    {
      id: 'deudas',
      label: 'Deudas',
      icon: Landmark,
      badge: activeDebtsCount,
      badgeColor: 'bg-red-500/20 text-red-300 border border-red-500/30',
      activeColor: 'text-[#E74C3C]',
    },
    {
      id: 'cobrar',
      label: 'Cuentas por Cobrar',
      icon: HandCoins,
      badge: pendingReceivablesCount,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
      activeColor: 'text-[#2ECC71]',
    },
    {
      id: 'calendario',
      label: 'Calendario',
      icon: Calendar,
      activeColor: 'text-[#FFD700]',
    },
  ];

  return (
    <aside className="w-64 bg-[#181818] border-r border-neutral-800/80 flex-col justify-between hidden lg:flex shrink-0 min-h-[calc(100vh-61px)] p-4">
      <div className="space-y-6">
        <div>
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-3">
            Módulos del Sistema
          </span>
          <nav className="mt-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveModule(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? 'bg-neutral-800 text-white shadow-sm border border-neutral-700'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive ? item.activeColor || 'text-[#FFD700]' : 'text-neutral-400 group-hover:text-neutral-200'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span
                      className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full ${
                        item.badgeColor || 'bg-neutral-800 text-neutral-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Tools */}
        <div className="pt-4 border-t border-neutral-800/80">
          <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider px-3">
            Herramientas
          </span>
          <div className="mt-2 space-y-1">
            <button
              onClick={onOpenCategories}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors"
            >
              <Tag className="w-4 h-4 text-neutral-400" />
              <span>Gestionar Categorías</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mini Summary Card in Sidebar */}
      <div className="bg-[#1F1F1F] border border-neutral-800 rounded-xl p-3 text-xs space-y-2">
        <div className="flex items-center justify-between text-neutral-400 text-[11px]">
          <span>Moneda Base:</span>
          <span className="font-mono text-white">USD ($) & Bs.</span>
        </div>
        <div className="flex items-center justify-between text-neutral-400 text-[11px]">
          <span>Almacenamiento:</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
            Guardado Local
          </span>
        </div>
      </div>
    </aside>
  );
};
