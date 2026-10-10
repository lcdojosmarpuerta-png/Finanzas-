import React, { useState } from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Clock,
  Landmark,
  HandCoins,
  Calendar,
  Menu,
  X,
  Tag,
  User,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { ActiveModule } from '../../types/finance.ts';

interface MobileNavProps {
  onOpenProfile: () => void;
  onOpenCategories: () => void;
  onOpenResetModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  onOpenProfile,
  onOpenCategories,
  onOpenResetModal,
}) => {
  const { activeModule, setActiveModule, data } = useFinance();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const pendingExpensesCount = data.expenses.filter((e) => e.status === 'pendiente').length;
  const pendingReceivablesCount = data.receivables.filter((r) => r.status === 'pendiente').length;

  const quickNavItems: {
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'inicio', label: 'Inicio', icon: LayoutDashboard },
    { id: 'ingresos', label: 'Ingresos', icon: TrendingUp },
    { id: 'egresos', label: 'Egresos', icon: TrendingDown },
    { id: 'pendientes', label: 'Pendientes', icon: Clock, badge: pendingExpensesCount },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
  ];

  const allModules: {
    id: ActiveModule;
    label: string;
    icon: React.ElementType;
    badge?: number;
  }[] = [
    { id: 'inicio', label: 'Inicio (Dashboard General)', icon: LayoutDashboard },
    { id: 'ingresos', label: 'Ingresos Acumulados', icon: TrendingUp },
    { id: 'egresos', label: 'Egresos y Gastos', icon: TrendingDown },
    { id: 'pendientes', label: 'Gastos Pendientes', icon: Clock, badge: pendingExpensesCount },
    { id: 'deudas', label: 'Control de Deudas', icon: Landmark },
    { id: 'cobrar', label: 'Cuentas por Cobrar', icon: HandCoins, badge: pendingReceivablesCount },
    { id: 'calendario', label: 'Calendario', icon: Calendar },
  ];

  const handleSelectModule = (id: ActiveModule) => {
    setActiveModule(id);
    setDrawerOpen(false);
  };

  return (
    <>
      {/* Top Mobile Bar with Hamburger */}
      <div className="lg:hidden flex items-center justify-between px-4 py-2 bg-[#1A1A1A] border-b border-neutral-800 text-xs">
        <span className="text-neutral-400">
          Módulo actual: <strong className="text-white capitalize">{activeModule}</strong>
        </span>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-200 border border-neutral-700 hover:text-white"
        >
          <Menu className="w-3.5 h-3.5" />
          <span>Menú Completo</span>
        </button>
      </div>

      {/* Drawer Overlay */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-72 max-w-[80vw] bg-[#181818] h-full z-10 flex flex-col justify-between border-r border-neutral-800 p-4 shadow-2xl animate-in slide-in-from-left duration-200">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
                <span className="text-sm font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FFD700]" />
                  Navegación
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="mt-4 space-y-1">
                {allModules.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectModule(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-[#FFD700] text-black font-semibold shadow'
                          : 'text-neutral-300 hover:bg-neutral-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-black text-white' : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-6 pt-4 border-t border-neutral-800 space-y-1">
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenCategories();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  <Tag className="w-4 h-4 text-neutral-400" />
                  <span>Gestionar Categorías</span>
                </button>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800"
                >
                  <User className="w-4 h-4 text-neutral-400" />
                  <span>Perfil de Usuario</span>
                </button>
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onOpenResetModal();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs text-[#E74C3C] hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reiniciar Todos los Datos</span>
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-neutral-800/80 text-[11px] text-neutral-400">
              <p>Sistema Financiero BCV</p>
              <p className="text-neutral-400 text-[10px] mt-0.5">Versión 2.0 Full Responsive</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sticky Navigation Bar for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#161616]/95 backdrop-blur-md border-t border-neutral-800 flex items-center justify-around px-2 py-1.5 shadow-2xl">
        {quickNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-all ${
                isActive ? 'text-[#FFD700]' : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-[#E74C3C] text-white text-[9px] font-bold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 ${isActive ? 'font-bold' : 'font-normal'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
