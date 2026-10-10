import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  HandCoins,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Trash2,
  PieChart,
  User,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Menu,
  ShieldCheck,
  ChevronRight,
  Search,
  Filter,
  Clock,
  FileSpreadsheet,
  Wifi,
  WifiOff,
  HardDrive,
  Scale,
  Play,
  Pause,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext.tsx';
import { formatUSD, formatBs, calcBs } from '../../services/bcvService.ts';
import { ActiveModule } from '../../types/finance.ts';

interface DashboardModuleProps {
  onOpenProfile: () => void;
  onOpenResetModal: () => void;
  onOpenMenuCompleto?: () => void;
  onOpenReport?: () => void;
}

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  onOpenProfile,
  onOpenResetModal,
  onOpenMenuCompleto,
  onOpenReport,
}) => {
  const {
    data,
    bcvRate,
    refreshBcvRate,
    isSyncingBcv,
    setActiveModule,
    totalIncomeUSD,
    totalExpensesPaidUSD,
    totalReceivablesPaidUSD,
    totalReceivablesPendingUSD,
    totalExpensesPendingUSD,
    totalDebtsRemainingUSD,
    netAvailableBalanceUSD,
    getCategoryById,
    effectiveIsOnline,
    setIsOfflineStatusModalOpen,
    storageStats,
    profiles,
    activeProfileId,
    switchProfile,
  } = useFinance();

  // Dynamic Clock inside Perfil del Usuario card
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = currentTime.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const formattedDate = currentTime.toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Cintillo Rotativo state
  const [isCintilloPaused, setIsCintilloPaused] = useState(false);
  const [cintilloSpeed, setCintilloSpeed] = useState<'normal' | 'fast'>('normal');

  // Search & filter for recent movements
  const [movementSearch, setMovementSearch] = useState('');
  const [movementFilter, setMovementFilter] = useState<'all' | 'ingreso' | 'egreso' | 'cobro'>('all');

  // Actualizar movimientos históricos state
  const [isRefreshingMovements, setIsRefreshingMovements] = useState(false);
  const [lastMovementsUpdate, setLastMovementsUpdate] = useState<Date>(new Date());
  const [showRefreshBadge, setShowRefreshBadge] = useState(false);

  const handleRefreshMovements = async () => {
    setIsRefreshingMovements(true);
    try {
      await refreshBcvRate();
    } catch {
      // ignore
    }
    setLastMovementsUpdate(new Date());
    setTimeout(() => {
      setIsRefreshingMovements(false);
      setShowRefreshBadge(true);
      setTimeout(() => setShowRefreshBadge(false), 2500);
    }, 600);
  };

  // Unified recent movements (Incomes, Expenses, Paid Receivables, Debt Payments) sorted descending
  const recentMovements = [
    ...data.incomes.map((inc) => ({
      id: inc.id,
      title: inc.description,
      type: 'ingreso' as const,
      amountUSD: inc.amountUSD,
      date: inc.date,
      createdAt: inc.createdAt,
      categoryId: inc.categoryId,
      statusText: inc.status === 'pendiente' ? 'Ingreso Por Depositar' : 'Ingreso Depositado',
      isPending: inc.status === 'pendiente',
    })),
    ...data.expenses.map((exp) => ({
      id: exp.id,
      title: exp.description,
      type: 'egreso' as const,
      amountUSD: exp.amountUSD,
      date: exp.date,
      createdAt: exp.createdAt,
      categoryId: exp.categoryId,
      statusText: exp.status === 'pagado' ? 'Egreso Pagado' : 'Egreso Pendiente',
      isPending: exp.status === 'pendiente',
    })),
    ...data.receivables
      .filter((r) => r.status === 'pagado')
      .map((r) => ({
        id: r.id,
        title: `Cobro: ${r.clientName} - ${r.description}`,
        type: 'cobro' as const,
        amountUSD: r.amountUSD,
        date: r.paidAt ? r.paidAt.split('T')[0] : r.date,
        createdAt: r.paidAt || r.createdAt,
        categoryId: 'cobro',
        statusText: 'Cuenta Cobrada',
        isPending: false,
      })),
    ...data.debts.flatMap((d) =>
      d.payments.map((p) => ({
        id: p.id,
        title: `Abono Deuda: ${d.creditor} (${p.note || d.description})`,
        type: 'egreso' as const,
        amountUSD: p.amountUSD,
        date: p.date,
        createdAt: p.date,
        categoryId: 'deuda',
        statusText: 'Pago a Deuda',
        isPending: false,
      }))
    ),
  ]
    .filter((m) => {
      const matchType = movementFilter === 'all' || m.type === movementFilter;
      const matchSearch = m.title.toLowerCase().includes(movementSearch.toLowerCase());
      return matchType && matchSearch;
    })
    .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());

  const isNetPositive = netAvailableBalanceUSD >= 0;
  // Diferencial = Saldo Disponible - Gastos Pendientes
  const diferencialUSD = netAvailableBalanceUSD - totalExpensesPendingUSD;
  const isDiferencialPositive = diferencialUSD >= 0;

  return (
    <div className="space-y-6">
      {/* 
        =========================================================
        1. CINTILLO ROTATIVO
        =========================================================
      */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-2xl p-2 sm:p-2.5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:border-neutral-700/80 transition-all duration-300 overflow-hidden">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Cinta Rotativa con Desvanecimiento Lateral */}
          <div className="relative flex-1 overflow-hidden rounded-xl bg-[#121212] border border-neutral-800/90 py-2 sm:py-2.5 shadow-inner group">
            {/* Degradados de sombra en los bordes para acabado profesional */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#121212] to-transparent z-10" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#121212] to-transparent z-10" />

            {/* Riel Rotativo Infinito */}
            <div
              className={`${
                cintilloSpeed === 'fast' ? 'animate-cintillo-fast' : 'animate-cintillo'
              } ${isCintilloPaused ? 'cintillo-paused' : ''} flex items-center gap-6 px-4`}
            >
            {/* Bloque 1 */}
            <div className="flex items-center gap-6 shrink-0">
              {/* Elemento 1: Hora y Fecha */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <Clock className="w-4 h-4 text-[#FFD700] shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Hora & Fecha:</span>
                <span className="font-mono font-extrabold text-xs text-white tabular-nums">{formattedTime}</span>
                <span className="text-neutral-400 text-xs capitalize">· {formattedDate}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/50 text-neutral-400 border border-neutral-800">VET</span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 2: Tasa Oficial BCV */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-[#FFD700]">
                <RefreshCw className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Tasa Oficial BCV:</span>
                <span className="font-mono font-extrabold text-xs text-[#FFD700] tabular-nums">Bs. {bcvRate.toFixed(2)}</span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 3: Saldo Neto Disponible */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Wallet className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Saldo Neto:</span>
                <span className="font-mono font-extrabold text-xs text-white tabular-nums">{formatUSD(netAvailableBalanceUSD)}</span>
                <span className="text-[11px] font-mono text-emerald-400/90 tabular-nums">({formatBs(calcBs(netAvailableBalanceUSD, bcvRate))})</span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 4: Margen / Déficit */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                isDiferencialPositive
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
              }`}>
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Proyección:</span>
                <span className="text-xs font-bold font-mono">
                  {isDiferencialPositive ? `Margen Favorable ${formatUSD(diferencialUSD)}` : `Déficit Proyectado ${formatUSD(diferencialUSD)}`}
                </span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 5: Almacenamiento Local */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold">100% Guardado Local · Privacidad Garantizada</span>
              </div>
            </div>

            <span className="text-neutral-700 select-none">✦</span>

            {/* Bloque 2 (Duplicado idéntico para continuidad perfecta en bucle) */}
            <div className="flex items-center gap-6 shrink-0" aria-hidden="true">
              {/* Elemento 1: Hora y Fecha */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
                <Clock className="w-4 h-4 text-[#FFD700] shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Hora & Fecha:</span>
                <span className="font-mono font-extrabold text-xs text-white tabular-nums">{formattedTime}</span>
                <span className="text-neutral-400 text-xs capitalize">· {formattedDate}</span>
                <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-black/50 text-neutral-400 border border-neutral-800">VET</span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 2: Tasa Oficial BCV */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-[#FFD700]">
                <RefreshCw className="w-3.5 h-3.5 text-[#FFD700] shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Tasa Oficial BCV:</span>
                <span className="font-mono font-extrabold text-xs text-[#FFD700] tabular-nums">Bs. {bcvRate.toFixed(2)}</span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 3: Saldo Neto Disponible */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Wallet className="w-3.5 h-3.5 text-[#2ECC71] shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Saldo Neto:</span>
                <span className="font-mono font-extrabold text-xs text-white tabular-nums">{formatUSD(netAvailableBalanceUSD)}</span>
                <span className="text-[11px] font-mono text-emerald-400/90 tabular-nums">({formatBs(calcBs(netAvailableBalanceUSD, bcvRate))})</span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 4: Margen / Déficit */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${
                isDiferencialPositive
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300 animate-pulse'
              }`}>
                <Scale className="w-3.5 h-3.5 shrink-0" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Proyección:</span>
                <span className="text-xs font-bold font-mono">
                  {isDiferencialPositive ? `Margen Favorable ${formatUSD(diferencialUSD)}` : `Déficit Proyectado ${formatUSD(diferencialUSD)}`}
                </span>
              </div>

              <span className="text-neutral-700 select-none">✦</span>

              {/* Elemento 5: Almacenamiento Local */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-300">
                <HardDrive className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-xs font-semibold">100% Guardado Local · Privacidad Garantizada</span>
              </div>
            </div>
          </div>
          </div>

          {/* Botones de control compactos */}
          <div className="flex items-center gap-1.5 shrink-0 pr-0.5">
            <button
              onClick={() => setIsCintilloPaused(!isCintilloPaused)}
              className={`p-2 rounded-xl border transition-all cursor-pointer ${
                isCintilloPaused
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 border-neutral-700/80'
              }`}
              title={isCintilloPaused ? 'Reanudar movimiento rotativo' : 'Pausar movimiento del cintillo'}
              aria-label={isCintilloPaused ? 'Reanudar cintillo' : 'Pausar cintillo'}
            >
              {isCintilloPaused ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Pause className="w-3.5 h-3.5 fill-current" />
              )}
            </button>
            <button
              onClick={() => setCintilloSpeed(cintilloSpeed === 'normal' ? 'fast' : 'normal')}
              className="px-2 py-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 border border-neutral-700/80 text-[11px] font-mono font-semibold transition-colors cursor-pointer"
              title="Cambiar velocidad del cintillo rotativo"
            >
              {cintilloSpeed === 'normal' ? '1x' : '1.5x'}
            </button>
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        2. PERFIL DEL USUARIO
        =========================================================
      */}
      <div className="relative bg-gradient-to-br from-[#1E1E1E] via-[#1A1A1A] to-[#181818] border border-neutral-800/90 rounded-3xl p-4 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.7)] hover:border-neutral-700/80 transition-all duration-300 overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#FFD700]/5 via-transparent to-transparent pointer-events-none rounded-full blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-5 relative z-10">
          {/* User info & avatar */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={onOpenProfile}
              className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-neutral-900 border-2 border-[#FFD700] flex items-center justify-center shrink-0 group transition-all duration-300 hover:scale-105 shadow-[0_6px_20px_rgba(255,215,0,0.2)] cursor-pointer"
              title="Haz clic para modificar tu avatar o logotipo"
            >
              {data.profile.avatarUrl ? (
                <img
                  src={data.profile.avatarUrl}
                  alt={data.profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400 group-hover:text-[#FFD700] transition-colors" />
              )}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] sm:text-[11px] text-[#FFD700] font-bold transition-opacity">
                Editar
              </div>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[9px] sm:text-[10px] font-mono uppercase tracking-wider text-[#FFD700] bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Perfil Activo
                </span>
                <span className="text-[11px] text-neutral-500">·</span>
                {effectiveIsOnline ? (
                  <button
                    onClick={() => setIsOfflineStatusModalOpen(true)}
                    className="text-[10px] sm:text-[11px] text-emerald-400 flex items-center gap-1 font-medium hover:text-emerald-300 transition-colors cursor-pointer"
                    title="Conectado a internet. Clic para ver estado de red y almacenamiento."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                    <span>En Línea</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setIsOfflineStatusModalOpen(true)}
                    className="text-[10px] sm:text-[11px] text-amber-300 flex items-center gap-1 font-bold bg-amber-500/15 hover:bg-amber-500/25 px-2 py-0.5 rounded-full border border-amber-500/40 transition-colors cursor-pointer shadow-sm animate-pulse"
                    title="Modo sin conexión activo. Tus datos en LocalStorage están listos para consulta."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-ping" />
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span>Offline (Local)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                <h2 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight truncate">
                  {data.profile.name || 'Josmar Puerta'}
                </h2>
                {data.profile.accountType && (
                  <span className="text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700/80 capitalize shrink-0">
                    {data.profile.accountType}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-neutral-400 font-medium truncate">
                {data.profile.title || 'Administrador Financiero'}
              </p>

              <div className="flex items-center gap-2.5 mt-1.5 sm:mt-2 flex-wrap">
                <button
                  onClick={onOpenProfile}
                  className="text-[11px] sm:text-xs font-semibold text-[#FFD700] hover:text-yellow-300 underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  Gestionar Perfiles ({profiles.length})
                </button>

                {profiles.length > 1 && (
                  <div className="flex items-center gap-1 sm:gap-1.5 pl-2 border-l border-neutral-700/80 flex-wrap">
                    <span className="text-[9px] sm:text-[10px] text-neutral-400 uppercase font-semibold">
                      Cambiar:
                    </span>
                    {profiles.map((p) => {
                      const isCurrent = p.id === activeProfileId;
                      return (
                        <button
                          key={p.id}
                          onClick={() => switchProfile(p.id)}
                          className={`px-2 py-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-gradient-to-r from-[#FFD700] to-[#E6B800] text-black shadow-sm'
                              : 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                          }`}
                          title={`Activar perfil "${p.name}" y sus registros`}
                        >
                          {p.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right action group: Tasa BCV + Almacenamiento Local + Botón Reporte */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
            {/* Tasa BCV Display */}
            <div className="col-span-1 bg-[#121212] border border-neutral-800/90 rounded-2xl px-3 sm:px-3.5 py-2 sm:py-2.5 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] flex items-center justify-between sm:justify-start gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-neutral-400 text-[9px] sm:text-[10px] uppercase font-semibold block tracking-wider truncate">
                    Tasa Oficial BCV
                  </span>
                </div>
                <span className="text-[#FFD700] font-mono font-extrabold text-xs sm:text-base tabular-nums block truncate">
                  Bs. {bcvRate.toFixed(2)}
                </span>
              </div>
              <button
                onClick={refreshBcvRate}
                disabled={isSyncingBcv}
                title={effectiveIsOnline ? 'Actualizar tasa oficial tomada de la red' : 'Sin conexión: se mantiene la tasa en caché local'}
                className="p-1.5 rounded-xl bg-neutral-800 text-neutral-300 hover:text-[#FFD700] hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer shadow-sm shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingBcv ? 'animate-spin text-[#FFD700]' : ''}`} />
              </button>
            </div>

            {/* Almacenamiento Local */}
            <button
              onClick={() => setIsOfflineStatusModalOpen(true)}
              className="col-span-1 border border-neutral-800/90 hover:border-emerald-500/40 bg-[#121212] hover:bg-neutral-900 rounded-2xl px-3 sm:px-3.5 py-2 shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] flex items-center gap-2 transition-all cursor-pointer text-left"
              title={`Tus datos se guardan de forma 100% local en tu dispositivo con máxima privacidad y rapidez (${storageStats.totalRecords} registros). Clic para ver almacenamiento.`}
            >
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                <HardDrive className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </div>
              <div className="min-w-0">
                <span className="text-neutral-400 text-[9px] sm:text-[10px] uppercase font-semibold block tracking-wider flex items-center gap-1 truncate">
                  <span>Guardado Local</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-white block truncate">
                  En Dispositivo
                </span>
              </div>
            </button>

            {/* Botón Reporte (Excel & WhatsApp) */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="col-span-2 sm:col-span-auto flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-[#2ECC71] to-emerald-500 hover:from-emerald-500 hover:to-emerald-600 text-black font-extrabold text-xs rounded-2xl shadow-[0_4px_20px_rgba(46,204,113,0.3)] hover:shadow-[0_6px_25px_rgba(46,204,113,0.4)] transition-all duration-200 cursor-pointer w-full sm:w-auto"
                title="Generar reporte Excel y compartir por WhatsApp"
              >
                <FileSpreadsheet className="w-4 h-4 shrink-0" />
                <span>Emitir Reporte Excel</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        3. SALDO NETO DISPONIBLE
        =========================================================
      */}
      <div className="relative bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-4 sm:p-8 shadow-[0_14px_45px_rgba(0,0,0,0.6)] hover:shadow-[0_18px_55px_rgba(0,0,0,0.75)] hover:border-neutral-700/80 transition-all duration-300 overflow-hidden">
        {/* Glow accent depending on balance sign */}
        <div
          className={`absolute -top-10 -right-10 w-96 h-96 pointer-events-none rounded-full blur-3xl opacity-20 ${
            isNetPositive ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'
          }`}
        />

        <div className="relative z-10 flex flex-col justify-between gap-5 sm:gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-neutral-800/80">
            <div className="flex items-center gap-3 sm:gap-3.5">
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center font-bold shadow-lg shrink-0 ${
                  isNetPositive
                    ? 'bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/40 shadow-emerald-500/10'
                    : 'bg-[#E74C3C]/15 text-[#E74C3C] border border-[#E74C3C]/40 shadow-red-500/10'
                }`}
              >
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.3]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm sm:text-lg font-bold text-white uppercase tracking-wider block truncate">
                  Saldo Neto Disponible
                </h3>
                <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5">
                  Ingresos Depositados + Cuentas por Cobrar − Egresos Pagados
                </p>
              </div>
            </div>

            <span
              className={`text-[11px] sm:text-xs px-3 py-1 rounded-full font-bold self-start sm:self-auto border shadow-sm ${
                isNetPositive
                  ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]/40'
                  : 'bg-[#E74C3C]/15 text-[#E74C3C] border-[#E74C3C]/40'
              }`}
            >
              {isNetPositive ? '✓ Superávit Financiero' : '⚠ Saldo Negativo'}
            </span>
          </div>

          {/* Big Balance Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
              <span className="text-[11px] sm:text-xs text-neutral-400 font-semibold uppercase tracking-wider block mb-1">
                Monto Disponible en USD
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span
                  className={`text-3xl xs:text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight tabular-nums font-mono ${
                    isNetPositive ? 'text-white' : 'text-[#E74C3C]'
                  }`}
                >
                  {formatUSD(netAvailableBalanceUSD)}
                </span>
                <span className="text-xs sm:text-sm font-bold text-neutral-400 font-mono">USD</span>
              </div>
            </div>

            {/* Reconversion to Bolívares */}
            <div className="bg-[#121212]/90 border border-neutral-800 rounded-2xl p-3.5 sm:p-5 shadow-inner">
              <span className="text-[10px] sm:text-[11px] text-neutral-400 font-semibold uppercase tracking-wider block">
                Reconversión Automática en Bolívares (Bs)
              </span>
              <p className="text-xl sm:text-3xl font-extrabold text-[#FFD700] font-mono tabular-nums mt-1">
                {formatBs(calcBs(netAvailableBalanceUSD, bcvRate))}
              </p>
              <p className="text-[10px] sm:text-[11px] text-neutral-400 mt-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] shrink-0" />
                Tasa Oficial BCV de Bs. {bcvRate.toFixed(2)} por dólar
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        4. COMPROMISOS & CUENTAS (Solo Indicador de Déficit Proyectado)
        =========================================================
      */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-4 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.7)] hover:border-neutral-700/80 transition-all duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-400" />
              Compromisos & Cuentas
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Proyección de margen financiero contrastando el saldo disponible contra egresos pendientes
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModule('pendientes')}
              className="px-3.5 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center flex items-center gap-1.5"
            >
              <span>Ver Gastos Pendientes</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Único Indicador: Margen Favorable / Déficit Proyectado */}
        <div className="mt-5">
          <div
            className={`p-5 sm:p-6 rounded-2xl bg-[#141414] border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-[0_4px_20px_rgba(0,0,0,0.4)] ${
              isDiferencialPositive
                ? 'border-cyan-500/40 hover:border-cyan-500/70 shadow-cyan-500/5'
                : 'border-red-500/50 hover:border-red-500/80 shadow-red-500/10'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                  isDiferencialPositive
                    ? 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
                    : 'bg-red-500/15 text-[#E74C3C] border-red-500/30'
                }`}
              >
                <Scale className="w-6 h-6 stroke-[2.2]" />
              </div>

              <div>
                <span
                  className={`text-[10px] sm:text-[11px] uppercase font-mono font-bold px-2.5 py-0.5 rounded-full inline-block border ${
                    isDiferencialPositive
                      ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                      : 'text-red-400 bg-red-500/15 border-red-500/30 animate-pulse'
                  }`}
                >
                  {isDiferencialPositive ? 'Margen Favorable' : 'Déficit Proyectado'}
                </span>
                <h4 className="text-base sm:text-lg font-bold text-white mt-1">
                  {isDiferencialPositive
                    ? 'Margen Favorable Disponible'
                    : 'Déficit Proyectado por Egresos Pendientes'}
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Saldo Neto Disponible ({formatUSD(netAvailableBalanceUSD)}) − Gastos Pendientes por Pagar ({formatUSD(totalExpensesPendingUSD)})
                </p>
              </div>
            </div>

            <div className="flex items-center sm:items-end justify-between sm:justify-start gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-neutral-800/80">
              <div className="text-left sm:text-right">
                <span className="text-[10px] text-neutral-400 uppercase font-semibold block mb-0.5">
                  {isDiferencialPositive ? 'Margen Resultante' : 'Monto en Déficit'}
                </span>
                <p
                  className={`text-2xl sm:text-3xl font-extrabold font-mono tabular-nums ${
                    isDiferencialPositive ? 'text-cyan-400' : 'text-[#E74C3C]'
                  }`}
                >
                  {formatUSD(diferencialUSD)}
                </p>
                <p className="text-xs font-mono text-neutral-400 tabular-nums">
                  {formatBs(calcBs(diferencialUSD, bcvRate))}
                </p>
              </div>

              <button
                onClick={() => setActiveModule('pendientes')}
                className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md shrink-0 active:scale-95 ${
                  isDiferencialPositive
                    ? 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40'
                    : 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
                }`}
                title="Ver y pagar gastos pendientes"
              >
                <span>Pagar Pendientes</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 
        =========================================================
        5. MOVIMIENTOS HISTÓRICOS (Quinto en orden)
        =========================================================
      */}
      <div className="bg-[#1A1A1A] border border-neutral-800/90 rounded-3xl p-4 sm:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.55)] hover:shadow-[0_16px_50px_rgba(0,0,0,0.7)] hover:border-neutral-700/80 transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#FFD700]" />
                Movimientos Históricos
              </h3>
              {showRefreshBadge && (
                <span className="text-[10px] font-bold bg-emerald-500/20 text-[#2ECC71] border border-emerald-500/30 px-2.5 py-0.5 rounded-full animate-in fade-in flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ¡Movimientos Actualizados!
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>Transacciones ordenadas descendentemente por fecha</span>
              <span className="text-neutral-600">·</span>
              <span className="text-[11px] text-neutral-500 font-mono">
                Actualizado: {lastMovementsUpdate.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
              </span>
            </p>
          </div>

          {/* Action button & filter controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Botón para ver en Calendario */}
            <button
              type="button"
              onClick={() => setActiveModule('calendario')}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-xl text-xs font-semibold transition-all shadow-sm active:scale-95 cursor-pointer shrink-0"
              title="Abrir vista de Calendario Mensual para ver ingresos y egresos por fecha"
            >
              <Calendar className="w-3.5 h-3.5 text-[#FFD700]" />
              <span className="hidden xs:inline">Ver en Calendario</span>
              <span className="xs:hidden">Calendario</span>
            </button>

            {/* Botón de actualizar los movimientos históricos */}
            <button
              type="button"
              onClick={handleRefreshMovements}
              disabled={isRefreshingMovements}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500/15 via-[#FFD700]/20 to-yellow-500/15 hover:from-amber-500/25 hover:to-yellow-500/25 text-[#FFD700] border border-[#FFD700]/30 hover:border-[#FFD700]/60 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
              title="Actualizar y recalcular todos los movimientos históricos con la tasa oficial BCV"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingMovements ? 'animate-spin' : ''}`} />
              <span>{isRefreshingMovements ? 'Actualizando...' : 'Actualizar Movimientos'}</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={movementSearch}
                onChange={(e) => setMovementSearch(e.target.value)}
                placeholder="Buscar operación..."
                className="bg-[#121212] border border-neutral-700 focus:border-[#FFD700] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none w-28 sm:w-36 shadow-inner"
              />
            </div>

            <select
              value={movementFilter}
              onChange={(e) => setMovementFilter(e.target.value as any)}
              className="bg-[#121212] border border-neutral-700 rounded-xl px-2.5 py-1.5 text-xs text-neutral-300 focus:outline-none shadow-inner cursor-pointer"
            >
              <option value="all">Todos los Tipos</option>
              <option value="ingreso">Solo Ingresos</option>
              <option value="egreso">Solo Egresos</option>
              <option value="cobro">Solo Cobros CxC</option>
            </select>

            <span className="text-xs text-neutral-400 font-mono px-2 py-1 bg-neutral-900 rounded-lg border border-neutral-800">
              {recentMovements.length} registradas
            </span>
          </div>
        </div>

        {recentMovements.length === 0 ? (
          <div className="py-14 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-neutral-500 mx-auto flex items-center justify-center border border-neutral-800">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm text-neutral-200 font-semibold">No se encontraron movimientos</p>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Utiliza el menú para registrar nuevos ingresos o egresos en la plataforma.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-800/70 mt-2">
            {recentMovements.slice(0, 10).map((m) => {
              const category = getCategoryById(m.categoryId);
              const isIncome = m.type === 'ingreso' || m.type === 'cobro';

              return (
                <div
                  key={`${m.type}-${m.id}`}
                  className="py-3 px-3 flex items-center justify-between gap-3 hover:bg-neutral-800/40 rounded-2xl transition-all duration-150 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        m.isPending
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : isIncome
                          ? 'bg-[#2ECC71]/15 text-[#2ECC71] border border-[#2ECC71]/30'
                          : 'bg-[#E74C3C]/15 text-[#E74C3C] border border-[#E74C3C]/30'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5 stroke-[2.5]" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-[#FFD700] transition-colors">
                        {m.title}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="font-mono">{m.date}</span>
                        <span>·</span>
                        <span className="truncate">
                          {category ? category.name : m.statusText}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`text-sm sm:text-base font-extrabold font-mono tabular-nums ${
                        isIncome
                          ? 'text-[#2ECC71]'
                          : m.isPending
                          ? 'text-amber-400'
                          : 'text-[#E74C3C]'
                      }`}
                    >
                      {isIncome ? '+' : '-'}
                      {formatUSD(m.amountUSD)}
                    </p>
                    <p className="text-[10px] font-mono text-neutral-400 tabular-nums">
                      {formatBs(calcBs(m.amountUSD, bcvRate))}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
