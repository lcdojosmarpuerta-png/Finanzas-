import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  Clock,
  Menu,
} from 'lucide-react';
import { ActiveModule } from '../../types/finance.ts';

interface MobileBottomNavProps {
  activeModule: ActiveModule;
  onChangeModule: (module: ActiveModule) => void;
  onOpenMenu: () => void;
  pendingCount?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeModule,
  onChangeModule,
  onOpenMenu,
  pendingCount = 0,
}) => {
  return (
    <nav
      aria-label="Navegación móvil"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#161616]/95 backdrop-blur-xl border-t border-neutral-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.7)] md:hidden transition-all"
      style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}
    >
      <div className="grid grid-cols-5 h-14 max-w-lg mx-auto px-1 items-center">
        {/* 1. Inicio (Dashboard) */}
        <button
          type="button"
          onClick={() => onChangeModule('inicio')}
          className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all cursor-pointer ${
            activeModule === 'inicio'
              ? 'text-[#FFD700] font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Ir al Inicio"
        >
          {activeModule === 'inicio' && (
            <span className="absolute top-0 w-8 h-0.5 bg-[#FFD700] rounded-full shadow-[0_0_8px_#FFD700]" />
          )}
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Inicio</span>
        </button>

        {/* 2. Ingresos */}
        <button
          type="button"
          onClick={() => onChangeModule('ingresos')}
          className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all cursor-pointer ${
            activeModule === 'ingresos'
              ? 'text-[#2ECC71] font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Ver Ingresos"
        >
          {activeModule === 'ingresos' && (
            <span className="absolute top-0 w-8 h-0.5 bg-[#2ECC71] rounded-full shadow-[0_0_8px_#2ECC71]" />
          )}
          <TrendingUp className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Ingresos</span>
        </button>

        {/* 3. Egresos */}
        <button
          type="button"
          onClick={() => onChangeModule('egresos')}
          className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all cursor-pointer ${
            activeModule === 'egresos'
              ? 'text-[#E74C3C] font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Ver Egresos"
        >
          {activeModule === 'egresos' && (
            <span className="absolute top-0 w-8 h-0.5 bg-[#E74C3C] rounded-full shadow-[0_0_8px_#E74C3C]" />
          )}
          <TrendingDown className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Egresos</span>
        </button>

        {/* 4. Pendientes */}
        <button
          type="button"
          onClick={() => onChangeModule('pendientes')}
          className={`relative flex flex-col items-center justify-center h-full w-full py-1 transition-all cursor-pointer ${
            activeModule === 'pendientes'
              ? 'text-amber-400 font-bold'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
          title="Gastos Pendientes"
        >
          {activeModule === 'pendientes' && (
            <span className="absolute top-0 w-8 h-0.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          )}
          <div className="relative mb-0.5">
            <Clock className="w-5 h-5" />
            {pendingCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-gradient-to-r from-red-500 to-amber-500 text-white font-mono text-[9px] font-bold min-w-4 h-4 px-1 rounded-full flex items-center justify-center border border-[#161616]">
                {pendingCount > 9 ? '9+' : pendingCount}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-tight">Pendientes</span>
        </button>

        {/* 5. Menú Completo (Deudas, Cobros, Gráficos, Copia JSON, Perfiles) */}
        <button
          type="button"
          onClick={onOpenMenu}
          className="relative flex flex-col items-center justify-center h-full w-full py-1 text-neutral-400 hover:text-[#FFD700] transition-all cursor-pointer active:scale-95"
          title="Abrir Menú Completo"
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight font-medium">Más</span>
        </button>
      </div>
    </nav>
  );
};
